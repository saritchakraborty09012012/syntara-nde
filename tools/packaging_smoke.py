"""Phase 1d packaging smoke test.

Proves the Syntara host can run from an *embedded* CPython with:
  - no system Python on PATH,
  - no PYTHONHOME / PYTHONPATH,
  - site disabled (python312._pth keeps `import site` commented out).

Writes a JSON result next to this file and exits 0 only if every check the
host actually depends on passes. Under pythonw.exe stdout is unavailable, so
the result file is the contract.
"""

from __future__ import annotations

import asyncio
import json
import os
import platform
import shutil
import sqlite3
import ssl
import subprocess
import sys
import tempfile
import traceback


def check(name: str, ok: bool, detail: str = "") -> dict:
    return {"name": name, "ok": bool(ok), "detail": detail}


def main() -> int:
    results = []

    # 1. Interpreter identity: embedded runtime (marker._pth ships only with
    #    the embeddable distribution) or a PyInstaller-frozen bundle.
    exe = os.path.abspath(sys.executable)
    here = os.path.dirname(exe)
    frozen = bool(getattr(sys, "frozen", False))
    is_embed = os.path.exists(os.path.join(here, "python312._pth"))
    results.append(check("interpreter-is-bundled", is_embed or frozen, exe))

    # 2. Site isolation: only meaningful for the embeddable route (._pth
    #    ships with `import site` commented out). PyInstaller bootstraps
    #    imports itself, so the check is skipped in frozen mode.
    if frozen:
        results.append(check("site-disabled", True, "frozen: n/a (pyinstaller bootstrap)"))
    else:
        import site as site_mod

        sp_on_path = [p for p in sys.path if "site-packages" in p.replace("\\", "/").lower()]
        results.append(
            check(
                "site-disabled",
                site_mod.ENABLE_USER_SITE is None and not sp_on_path,
                f"ENABLE_USER_SITE={site_mod.ENABLE_USER_SITE} path={sp_on_path}",
            )
        )

    # 3. stdlib set the host depends on.
    import asyncio as _a
    import http.server  # noqa: F401  (also used by check 8)
    import json as _j
    import ssl as _s

    results.append(check("stdlib-imports", all((_a, http.server, _j, _s)), ""))

    # 4. sqlite3: DLL must resolve from the embedded dir.
    try:
        con = sqlite3.connect(":memory:")
        con.execute("CREATE TABLE t(x)")
        con.execute("INSERT INTO t VALUES (1)")
        assert con.execute("SELECT COUNT(*) FROM t").fetchone()[0] == 1
        con.close()
        results.append(check("sqlite3", True, sqlite3.sqlite_version))
    except Exception as e:  # noqa: BLE001
        results.append(check("sqlite3", False, repr(e)))

    # 5. TLS stack: default context can be built offline.
    try:
        ctx = ssl.create_default_context()
        results.append(check("ssl-context", True, ctx.protocol))
    except Exception as e:  # noqa: BLE001
        results.append(check("ssl-context", False, repr(e)))

    # 6. Subprocess: the embedded python.exe must be spawnable with no PATH.
    #    Skipped when frozen — a bundle ships no separate interpreter.
    if frozen:
        results.append(check("subprocess-python-exe", True, "frozen: n/a (no bundled python.exe)"))
    else:
        py = os.path.join(here, "python.exe")
        try:
            p = subprocess.run([py, "-c", "print(1234)"], capture_output=True, text=True, timeout=30, env={"SYSTEMROOT": os.environ.get("SYSTEMROOT", "")})
            results.append(check("subprocess-python-exe", p.returncode == 0 and p.stdout.strip() == "1234", f"rc={p.returncode}"))
        except Exception as e:  # noqa: BLE001
            results.append(check("subprocess-python-exe", False, repr(e)))

    # 7. asyncio event loop (host scheduler is async).
    try:
        async def probe() -> str:
            await asyncio.sleep(0)
            return "loop-ok"

        results.append(check("asyncio", asyncio.run(probe()) == "loop-ok", ""))
    except Exception as e:  # noqa: BLE001
        results.append(check("asyncio", False, repr(e)))

    # 8. http.server can bind an ephemeral localhost port (gateway smoke).
    try:
        import threading

        class H(http.server.BaseHTTPRequestHandler):
            def do_GET(self):  # noqa: N802
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"ok")

            def log_message(self, *args):  # noqa: ARG002
                pass

        srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
        port = srv.server_address[1]
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        import urllib.request

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5) as r:
            body = r.read()
        srv.shutdown()
        results.append(check("http-server-loopback", body == b"ok", f"port={port}"))
    except Exception:  # noqa: BLE001
        results.append(check("http-server-loopback", False, traceback.format_exc(limit=1)))

    # 9. Environment purity report (informational, must be clean for isolation).
    results.append(
        check(
            "env-clean",
            not os.environ.get("PYTHONHOME") and not os.environ.get("PYTHONPATH"),
            f"PYTHONHOME={os.environ.get('PYTHONHOME')!r} PYTHONPATH={os.environ.get('PYTHONPATH')!r}",
        )
    )

    payload = {
        "python": sys.version,
        "executable": sys.executable,
        "frozen": bool(getattr(sys, "frozen", False)),
        "platform": platform.platform(),
        "tempdir-writable": None,
        "checks": results,
        "all_ok": all(r["ok"] for r in results),
    }
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".probe", delete=True) as f:
            f.write("x")
        payload["tempdir-writable"] = True
    except Exception as e:  # noqa: BLE001
        payload["tempdir-writable"] = f"FAIL {e!r}"

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smoke_result.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
    return 0 if payload["all_ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
