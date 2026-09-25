from __future__ import annotations

import json
import os
import re
import socket
import urllib.error
import urllib.request
from typing import Any, Callable, Iterator

from .store import LocalStore, default_data_dir


class SyntaraError(RuntimeError):
    """Raised when the local Syntara runtime cannot satisfy a request.

    ``status`` carries the HTTP status when the runtime returned one,
    ``code`` the machine-readable error code (for example
    ``model_not_found``), ``body`` the decoded JSON error object and ``url``
    the request URL that failed.
    """

    def __init__(self, message: str, *, status: int | None = None, code: str | None = None,
                 body: Any = None, url: str | None = None) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.body = body
        self.url = url


class _Models:
    """Inspect the model(s) the local runtime serves."""

    def __init__(self, client: "Syntara") -> None:
        self._client = client

    def list(self) -> list[dict[str, Any]]:
        body = self._client._request("models")
        return list(body.get("data", [])) if isinstance(body, dict) else []

    def ids(self) -> list[str]:
        return [item.get("id", "") for item in self.list() if item.get("id")]

    def get(self, model_id: str) -> dict[str, Any]:
        """Fetch one model object; raises SyntaraError (404) if not served."""
        body = self._client._request(f"models/{_quote(model_id)}")
        if not isinstance(body, dict):
            raise SyntaraError(f"Unexpected model response for {model_id!r}: {body!r}",
                               url=self._client.base_url)
        return body


class _Agents:
    """A small agent loop over the local chat/completions endpoint.

    If the model family opts into tool calls, the OpenAI-style ``tools``
    passed to the runtime are honored and their results are fed back for up
    to ``max_steps`` iterations. Every step stays on the machine.
    """

    def __init__(self, client: "Syntara") -> None:
        self._client = client

    def run(self, task: str, *, model: str | None = None, system: str | None = None,
            tools: dict[str, Callable[[dict[str, Any]], Any]] | None = None,
            tool_specs: list[dict[str, Any]] | None = None,
            max_steps: int = 3, temperature: float = 0.2, max_tokens: int = 8192) -> dict[str, Any]:
        if not model:
            model = self._client.default_model()
        messages: list[dict[str, Any]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": task})
        specs = list(tool_specs) if tool_specs is not None else self._tool_specs(tools)
        steps = 0
        while True:
            payload: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_completion_tokens": max_tokens,
                "stream": False,
            }
            if specs:
                payload["tools"] = specs
            body = self._client._request("chat/completions", "POST", payload)
            try:
                message = body["choices"][0]["message"]
            except (KeyError, IndexError, TypeError) as exc:
                raise SyntaraError(f"Unexpected agent response: {body!r}") from exc
            calls = message.get("tool_calls") or []
            if not calls:
                return {"task": task, "model": model, "steps": steps + 1,
                        "content": message.get("content"),
                        "usage": body.get("usage"), "tool_calls": []}
            if not tools or steps >= max_steps:
                return {"task": task, "model": model, "steps": steps + 1,
                        "content": message.get("content"),
                        "usage": body.get("usage"), "tool_calls": calls,
                        "interrupted": "tools_not_bound_or_max_steps"}
            messages.append(message)
            for call in calls:
                function = call.get("function") or {}
                name = function.get("name", "")
                handler = tools.get(name)
                if handler is None:
                    result = {"error": f"no local handler registered for tool {name!r}"}
                else:
                    try:
                        result = handler(self._tool_arguments(function))
                    except Exception as exc:  # a tool reaching its limits must not kill the loop
                        result = {"error": f"{type(exc).__name__}: {exc}"}
                messages.append({
                    "role": "tool",
                    "tool_call_id": call.get("id") or f"call_{steps}_{name}",
                    "content": json.dumps(result, ensure_ascii=False),
                })
            steps += 1

    @staticmethod
    def _tool_arguments(function: dict[str, Any]) -> dict[str, Any]:
        raw = function.get("arguments")
        if isinstance(raw, dict):
            return raw
        try:
            parsed = json.loads(raw or "{}")
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def _tool_specs(tools: dict[str, Callable[[dict[str, Any]], Any]] | None) -> list[dict[str, Any]]:
        if not tools:
            return []
        specs = []
        for name, fn in tools.items():
            doc = (fn.__doc__ or "").strip()
            specs.append({
                "type": "function",
                "function": {
                    "name": name,
                    "description": doc or name,
                    "parameters": {"type": "object", "properties": {},
                                   "additionalProperties": True},
                },
            })
        return specs


class _Projects:
    """Projects live in the local user-data store."""

    def __init__(self, client: "Syntara") -> None:
        self._client = client

    def list(self) -> list[dict[str, Any]]:
        return self._client._store.list_projects()

    def get(self, project_id: str) -> dict[str, Any] | None:
        return self._client._store.get_project(project_id)

    def create(self, name: str, description: str = "",
               meta: dict[str, Any] | None = None) -> dict[str, Any]:
        return self._client._store.create_project(name, description=description, meta=meta)

    def delete(self, project_id: str) -> bool:
        return self._client._store.delete_project(project_id)


class _Memories:
    """Long-term user memories, stored locally in the user-data directory."""

    def __init__(self, client: "Syntara") -> None:
        self._client = client

    def list(self) -> list[dict[str, Any]]:
        return self._client._store.list_memories()

    def add(self, text: str, meta: dict[str, Any] | None = None) -> dict[str, Any]:
        return self._client._store.add_memory(text, meta=meta)

    def get(self, memory_id: str) -> dict[str, Any] | None:
        for memory in self._client._store.list_memories():
            if memory.get("id") == memory_id:
                return memory
        return None

    def update(self, memory_id: str, text: str) -> dict[str, Any] | None:
        return self._client._store.update_memory(memory_id, text)

    def delete(self, memory_id: str) -> bool:
        return self._client._store.delete_memory(memory_id)


class _Backups:
    """Local, offline backups of chats, memories, projects and settings."""

    def __init__(self, client: "Syntara") -> None:
        self._client = client

    def create(self, out: str | os.PathLike | None = None,
               include: Any = ("chats", "memories", "projects", "settings"),
               model_refs: list[dict[str, Any]] | None = None):
        return self._client._store.create_backup(out=out, include=include, model_refs=model_refs)

    def list(self) -> list[dict[str, Any]]:
        return self._client._store.list_backups()

    def verify(self, archive: str | os.PathLike) -> dict[str, Any]:
        return self._client._store.verify_backup(archive)

    def restore(self, archive: str | os.PathLike, include: Any = ("chats", "memories", "projects", "settings"),
                merge: bool = True) -> dict[str, Any]:
        return self._client._store.restore_backup(archive, include=include, merge=merge)


class Syntara:
    """Dependency-free client for a local Syntara runtime.

    Models stay on the user's computer. This SDK only talks to the local
    Syntara control/API surface; it does not host or download model weights
    and works fully offline once the runtime is up.

    ``base_url`` and ``api_key`` may be left unset; they then fall back to
    the ``SYNTARA_BASE_URL`` and ``SYNTARA_API_KEY`` environment variables
    (respectively) before the localhost default / empty key. Explicit
    arguments always win over the environment.
    """

    def __init__(self, base_url: str | None = None, api_key: str | None = None,
                 timeout: float = 60.0, data_dir: str | os.PathLike | None = None):
        resolved_base = (base_url if base_url is not None
                         else os.environ.get("SYNTARA_BASE_URL",
                                             "http://127.0.0.1:8000/v1"))
        self.base_url = resolved_base.rstrip("/")
        self.api_key = api_key if api_key is not None else os.environ.get("SYNTARA_API_KEY", "")
        self.timeout = timeout
        self._store = LocalStore(data_dir or default_data_dir())
        self.models = _Models(self)
        self.agents = _Agents(self)
        self.projects = _Projects(self)
        self.memories = _Memories(self)
        self.backups = _Backups(self)

    # ---------------------------------------------------------------- transport

    @property
    def root_url(self) -> str:
        """The server origin (base_url without the ``/v1`` suffix)."""
        return self.base_url[:-3] if self.base_url.endswith("/v1") else self.base_url

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _open(self, url: str, method: str, payload: dict[str, Any] | None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(url, data=data, headers=self._headers(), method=method)
        try:
            return urllib.request.urlopen(request, timeout=self.timeout)
        except urllib.error.HTTPError as exc:
            raise self._http_error(exc, url) from exc
        except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError) as exc:
            raise SyntaraError(
                f"Unable to reach local Syntara runtime at {url}: {exc}", url=url) from exc

    def _http_error(self, exc: urllib.error.HTTPError, url: str) -> SyntaraError:
        raw = ""
        try:
            raw = exc.read().decode("utf-8", "replace")
        except Exception:
            pass
        body: Any = None
        code: str | None = None
        message = f"{exc.code} {exc.reason}"
        try:
            body = json.loads(raw)
            error = body.get("error") if isinstance(body, dict) else None
            if isinstance(error, dict):
                message = error.get("message") or message
                code = error.get("code")
        except json.JSONDecodeError:
            if raw:
                message = raw
        return SyntaraError(f"Local Syntara runtime returned: {message}",
                            status=exc.code, code=code, body=body, url=url)

    def _request(self, path: str, method: str = "GET", payload: dict[str, Any] | None = None,
                 *, base: str | None = None, stream: bool = False):
        root = (base or self.base_url).rstrip("/")
        url = f"{root}/{path.lstrip('/')}"
        response = self._open(url, method, payload)
        if stream:
            return response
        raw = response.read().decode("utf-8")
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw

    # ---------------------------------------------------------------- convenience

    def list_models(self) -> list[str]:
        return self.models.ids()

    def default_model(self) -> str:
        model = os.environ.get("SYNTARA_MODEL")
        if model:
            return model
        ids = self.models.ids()
        if not ids:
            raise SyntaraError(
                "The local Syntara runtime is not serving a model. Start it with a model "
                "first (e.g. `syntara serve --model <path-or-id>`) or set SYNTARA_MODEL.")
        return ids[0]

    def chat(self, model: str, message: str, *, temperature: float = 0.7,
             max_tokens: int = 4096, system: str | None = None,
             enable_thinking: bool = False, tools: list[dict[str, Any]] | None = None,
             tool_choice: Any = None, cache_slot: int | None = None) -> str:
        messages: list[dict[str, Any]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": message})
        payload: dict[str, Any] = {
            "model": model, "messages": messages, "temperature": temperature,
            "max_completion_tokens": max_tokens, "enable_thinking": enable_thinking,
            "stream": False,
        }
        if tools is not None:
            payload["tools"] = tools
        if tool_choice is not None:
            payload["tool_choice"] = tool_choice
        if cache_slot is not None:
            payload["cache_slot"] = cache_slot
        body = self._request("chat/completions", "POST", payload)
        try:
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise SyntaraError(f"Unexpected chat response: {body!r}") from exc
        return content

    def stream_chat(self, model: str, message: str, *, temperature: float = 0.7,
                    max_tokens: int = 4096, system: str | None = None,
                    enable_thinking: bool = False, cache_slot: int | None = None,
                    tools: list[dict[str, Any]] | None = None,
                    tool_choice: Any = None) -> Iterator[dict[str, Any]]:
        """Stream chat completions via SSE.

        Yields one dict per server frame: ``delta`` (new text or None),
        ``tool_calls``, ``finish_reason`` and ``usage`` (the final frame).
        """
        messages: list[dict[str, Any]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": message})
        payload: dict[str, Any] = {
            "model": model, "messages": messages, "temperature": temperature,
            "max_completion_tokens": max_tokens, "enable_thinking": enable_thinking,
            "stream": True, "stream_options": {"include_usage": True},
        }
        if cache_slot is not None:
            payload["cache_slot"] = cache_slot
        if tools is not None:
            payload["tools"] = tools
        if tool_choice is not None:
            payload["tool_choice"] = tool_choice
        response = self._request("chat/completions", "POST", payload, stream=True)
        try:
            for data in self._sse_frames(response):
                if data == "[DONE]":
                    break
                try:
                    event = json.loads(data)
                except json.JSONDecodeError:
                    continue
                choices = event.get("choices")
                choice = choices[0] if isinstance(choices, list) and choices else {}
                delta = choice.get("delta") or {}
                yield {
                    "delta": delta.get("content"),
                    "tool_calls": delta.get("tool_calls"),
                    "finish_reason": choice.get("finish_reason"),
                    "usage": event.get("usage"),
                }
        finally:
            response.close()

    def complete(self, model: str, prompt: str, *, temperature: float = 0.7,
                 max_tokens: int = 4096) -> str:
        body = self._request("completions", "POST", {
            "model": model, "prompt": prompt, "temperature": temperature,
            "max_tokens": max_tokens, "stream": False,
        })
        try:
            return body["choices"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise SyntaraError(f"Unexpected completions response: {body!r}") from exc

    def brio(self, model: str, question: str, options: list[str],
             *, state: str = "") -> dict[str, Any]:
        """Score a closed set of options instead of generating an answer."""
        if not options:
            raise SyntaraError("brio needs at least one option to score")
        body = self._request("brio", "POST", {
            "model": model, "state": state, "question": question, "options": list(options),
        })
        if not isinstance(body, dict):
            raise SyntaraError(f"Unexpected brio response: {body!r}")
        return body

    def messages(self, model: str, messages: list[dict[str, Any]], **extra: Any) -> dict[str, Any]:
        """Anthropic-style /v1/messages passthrough for Claude-compatible clients."""
        payload: dict[str, Any] = {"model": model, "messages": list(messages)}
        payload.update(extra)
        body = self._request("messages", "POST", payload)
        if not isinstance(body, dict):
            raise SyntaraError(f"Unexpected messages response: {body!r}")
        return body

    def health(self) -> dict[str, Any]:
        body = self._request("health", base=self.root_url)
        if not isinstance(body, dict):
            raise SyntaraError(f"Unexpected health response: {body!r}")
        return body

    def profile(self) -> dict[str, Any]:
        body = self._request("profile", base=self.root_url)
        if not isinstance(body, dict):
            raise SyntaraError(f"Unexpected profile response: {body!r}")
        return body

    def experts(self) -> dict[str, Any]:
        body = self._request("experts", base=self.root_url)
        if not isinstance(body, dict):
            raise SyntaraError(f"Unexpected experts response: {body!r}")
        return body

    def raw(self, path: str, method: str = "GET", payload: dict[str, Any] | None = None) -> Any:
        return self._request(path, method, payload)

    # ---------------------------------------------------------------- SSE parsing

    @staticmethod
    def _read_chunks(response) -> Iterator[str]:
        while True:
            chunk = response.read(65536)
            if not chunk:
                break
            yield chunk.decode("utf-8", "replace")

    @staticmethod
    def _sse_frames(response) -> Iterator[str]:
        """Yield the ``data:`` payload of each SSE frame in an HTTP body."""
        buffer = ""
        for chunk in Syntara._read_chunks(response):
            buffer += chunk
            while True:
                match = re.search(r"\r?\n\r?\n", buffer)
                if not match:
                    break
                frame, buffer = buffer[:match.start()], buffer[match.end():]
                payload = _sse_data(frame)
                if payload is not None:
                    yield payload
        if buffer.strip():
            payload = _sse_data(buffer)
            if payload is not None:
                yield payload


def _sse_data(frame: str) -> str | None:
    lines = [line[5:].lstrip() for line in frame.splitlines() if line.startswith("data:")]
    return "\n".join(lines) if lines else None


def _quote(value: str) -> str:
    return urllib.request.quote(value, safe="")