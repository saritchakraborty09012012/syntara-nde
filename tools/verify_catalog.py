#!/usr/bin/env python3
"""Catalog verification gate: check web/src/lib/model-catalog.ts against the
Hugging Face API.

Local checks (no network):
  - the catalog object parses as plain JSON data;
  - every download URL is a direct huggingface.co link ending in
    "?download=true";
  - a checkpoint without files must be flagged gated or missing;
  - no duplicate download URL inside one family.

Remote checks (one metadata request per model repository):
  - the repository exists (a 404 must be flagged "missing" in the catalog);
  - the catalog's gated flag matches the repository's actual access state
    (API "gated": false / true / "auto" / "manual");
  - every listed weight file exists in the repository's file listing
    (gated repositories expose their file list anonymously, so this holds
    for them too).

Usage:
  python tools/verify_catalog.py                # full check, needs network
  python tools/verify_catalog.py --limit 10     # first 10 checkpoints
  python tools/verify_catalog.py --family qwen-local
  python tools/verify_catalog.py --offline      # local checks only

Exit codes: 0 = clean, 1 = problems found, 2 = usage/IO/network error.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from typing import Any
from urllib.parse import quote, unquote

DEFAULT_CATALOG = "web/src/lib/model-catalog.ts"
API_ROOT = "https://huggingface.co/api/models"
USER_AGENT = "Syntara-catalog-verify/1.0"
REQUEST_TIMEOUT_S = 20.0

_RESOLVE_RE = re.compile(
    r"^https://huggingface\.co/[^/]+/[^/]+/resolve/[^/]+/(.+)\?download=true$"
)


def load_catalog(path: str) -> dict[str, list[dict[str, Any]]]:
    """Extract the modelCatalog object literal and parse it as JSON.

    The file is TypeScript, but the exported object is pure JSON data
    (double-quoted keys/strings, no expressions), so a quote-aware brace
    match plus json.loads is exact and rejects any future non-data edit."""
    with open(path, encoding="utf-8") as handle:
        src = handle.read()
    anchor = src.find("modelCatalog")
    if anchor < 0:
        raise ValueError("modelCatalog declaration not found")
    start = src.find("{", anchor)
    if start < 0:
        raise ValueError("modelCatalog object literal not found")
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(src)):
        ch = src[index]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                body = src[start : index + 1]
                data = json.loads(body)
                if not isinstance(data, dict):
                    raise ValueError("modelCatalog is not an object")
                return data
    raise ValueError("unterminated modelCatalog object literal")


def check_local(model: dict[str, Any]) -> list[str]:
    """Structural checks that need no network access."""
    problems: list[str] = []
    repo = model.get("repo")
    if not isinstance(repo, str) or "/" not in repo:
        problems.append("repo must be an 'org/name' string")
        return problems
    files = model.get("files")
    if not isinstance(files, list):
        problems.append("files must be a list")
        return problems
    if not files and not (model.get("gated") or model.get("missing")):
        problems.append("has no files and no gated/missing flag")
    seen: set[str] = set()
    for entry in files:
        url = entry.get("url", "") if isinstance(entry, dict) else ""
        if not url.startswith("https://huggingface.co/") or not url.endswith(
            "?download=true"
        ):
            problems.append(f"not a direct download URL: {url!r}")
            continue
        if url in seen:
            problems.append(f"duplicate URL in family: {url}")
        seen.add(url)
        match = _RESOLVE_RE.match(url)
        if match is None:
            problems.append(f"URL has no /resolve/ segment: {url!r}")
    caps = model.get("capabilities")
    if caps is not None and (
        not isinstance(caps, list)
        or not caps
        or not all(isinstance(tag, str) and tag for tag in caps)
    ):
        problems.append(f"capabilities must be a non-empty string list: {caps!r}")
    return problems


def fetch_json(url: str) -> tuple[int, Any]:
    """GET url; return (status, parsed body or None).

    2xx bodies are parsed as JSON; HTTP error codes are returned as-is with a
    None body. Transport failures (offline, DNS, timeout) raise OSError so the
    caller can exit with the network error code instead of pretending the
    catalog is broken."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error: Exception | None = None
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S) as resp:
                raw = resp.read()
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt == 1:
                time.sleep(1.5)
                continue
            return exc.code, None
        except urllib.error.URLError as exc:
            last_error = exc
            if attempt == 1:
                time.sleep(1.0)
                continue
        except (TimeoutError, OSError) as exc:  # pragma: no cover - transport
            last_error = exc
            if attempt == 1:
                time.sleep(1.0)
                continue
        except ValueError as exc:
            raise OSError(f"invalid JSON from {url}: {exc}") from exc
    reason = getattr(last_error, "reason", last_error)
    raise OSError(f"cannot reach {url}: {reason}")


def check_remote(model: dict[str, Any]) -> list[str]:
    """Cross-check one checkpoint against its Hugging Face repository."""
    repo = model["repo"]
    url = f"{API_ROOT}/{quote(repo, safe='/')}"
    status, data = fetch_json(url)

    if status == 404:
        if model.get("missing"):
            return []
        return [f"repository does not exist on Hugging Face (404) but the catalog does not flag it missing"]
    if status in (401, 403):
        if model.get("gated"):
            # Metadata itself is behind the gate; the gated flag is what the
            # UI already shows, and the file list cannot be read anonymously.
            return []
        return [f"repository metadata denied ({status}) but the catalog does not flag it gated"]
    if status != 200 or not isinstance(data, dict):
        return [f"HF API returned HTTP {status} for {repo}"]

    problems: list[str] = []
    api_gated = bool(data.get("gated"))
    catalog_gated = bool(model.get("gated"))
    if api_gated != catalog_gated:
        problems.append(
            f"gated flag mismatch: API says gated={api_gated!r}, catalog says {catalog_gated!r}"
        )

    siblings = {
        item.get("rfilename")
        for item in (data.get("siblings") or [])
        if isinstance(item, dict)
    }
    for entry in model.get("files", []):
        match = _RESOLVE_RE.match(entry.get("url", ""))
        if match is None:
            continue  # already reported by the local check
        path = unquote(match.group(1))
        if siblings and path not in siblings:
            problems.append(f"listed file not in repository: {path}")
    if not siblings:
        problems.append("HF API returned no file listing for the repository")
    return problems


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Verify the web model catalog against the Hugging Face API."
    )
    parser.add_argument("--catalog", default=DEFAULT_CATALOG, help="catalog file path")
    parser.add_argument("--limit", type=int, default=0, help="check only the first N checkpoints")
    parser.add_argument("--family", action="append", default=[], help="limit to a family id (repeatable)")
    parser.add_argument("--offline", action="store_true", help="run local checks only")
    parser.add_argument("--verbose", action="store_true", help="print OK lines too")
    args = parser.parse_args(argv)

    try:
        catalog = load_catalog(args.catalog)
    except (OSError, ValueError) as exc:
        print(f"error: cannot read catalog {args.catalog}: {exc}", file=sys.stderr)
        return 2

    families = [(fid, models) for fid, models in catalog.items() if not args.family or fid in args.family]
    if args.family and not families:
        print(f"error: no family matched {args.family!r}", file=sys.stderr)
        return 2

    problems: list[str] = []
    checked = 0
    for family, models in families:
        for model in models:
            if args.limit and checked >= args.limit:
                break
            label = f"{family}::{model.get('repo', '?')}"
            local = check_local(model)
            remote: list[str] = []
            if not args.offline and not local:
                try:
                    remote = check_remote(model)
                except OSError as exc:
                    print(f"network error: {exc}", file=sys.stderr)
                    return 2
            found = local + remote
            checked += 1
            if found:
                problems.append(label)
                for item in found:
                    print(f"  FAIL {label}: {item}")
            elif args.verbose:
                print(f"  ok   {label}")
        if args.limit and checked >= args.limit:
            break

    total_files = sum(
        len(model.get("files", [])) for _, models in families for model in models
    )
    mode = "offline" if args.offline else "hf-verified"
    if problems:
        print(
            f"catalog verify FAILED - {len(problems)} of {checked} checkpoints "
            f"have problems ({mode}, {total_files} listed files)"
        )
        return 1
    print(
        f"catalog verify OK - {checked} checkpoints, {total_files} files "
        f"({mode}); no problems found."
    )
    return 0


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    sys.exit(main(sys.argv[1:]))
