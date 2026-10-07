"""Packaging gates for the published desktop installers.

Everything here guards the two defects that shipped on v1.0.1, where the
release job was green and the installers were unusable:

1. The Windows asset was not an installer. The workflow searched the whole
   cargo target tree for `*.exe` and took the first hit, which was a
   dependency's build script - 302,592 bytes that print an $RUSTC error and
   exit. tools/verify_installer.py now refuses to pass it, and
   test_verifier_rejects_a_cargo_build_script pins that behaviour to the exact
   shape that shipped.

2. No platform shipped an inference backend. syntara/runtime/bin is gitignored,
   the staging script only printed a NOTE when it was absent, and the installer
   was published anyway, so the installed app died at RuntimeNotAvailable. The
   backend is now pinned in tools/fetch_llama_cpp.py and staging can be told to
   require it.

The drift checks matter as much as the format checks: the pin, the binary name
and the staged path are stated in four places (the fetch table, the runtime,
the staging script and this file), and a mismatch in any of them reproduces
the second defect quietly.

Run: python -m unittest -v syntara.tests.test_desktop_packaging
"""

from __future__ import annotations

import io
import os
import pathlib
import subprocess
import sys
import tarfile
import tempfile
import unittest
import zipfile

REPO = pathlib.Path(__file__).resolve().parent.parent.parent
TOOLS = REPO / "tools"
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

import fetch_llama_cpp as fetch  # noqa: E402
import stage_desktop_resources as stage  # noqa: E402
import verify_installer as verify  # noqa: E402
from syntara.runtime import llama_cpp  # noqa: E402


def _pad(target: pathlib.Path, size: int, prefix: bytes = b"") -> None:
    """Write a file of at least `size` bytes without allocating it all."""
    with target.open("wb") as handle:
        handle.write(prefix)
        remaining = size - len(prefix)
        block = b"\x00" * 65536
        while remaining > 0:
            chunk = block[:min(len(block), remaining)]
            handle.write(chunk)
            remaining -= len(chunk)


def _extend(target: pathlib.Path, size: int) -> None:
    """Grow an existing file to `size` with zeros, keeping what it holds.

    Separate from _pad because _pad truncates, which would delete a marker
    already written - the mistake a chunk-boundary test invites.
    """
    have = target.stat().st_size
    assert have <= size, f"{target} is already {have} bytes, wanted {size}"
    with target.open("ab") as handle:
        block = b"\x00" * 65536
        remaining = size - have
        while remaining > 0:
            chunk = block[:min(len(block), remaining)]
            handle.write(chunk)
            remaining -= len(chunk)


class NsisFormatTest(unittest.TestCase):
    def test_accepts_a_pe_carrying_the_nsis_header(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "setup.exe"
            # MZ, then the first-header magic and signature string where NSIS
            # puts them (past the PE image, so not adjacent to MZ).
            _pad(path, verify.MIN_BYTES + 4096, prefix=b"MZ" + b"\x00" * 9000
                 + verify.NSIS_MAGIC + b"\x00" * 32 + verify.NSIS_SIGNATURE)
            verify.verify(path, "nsis")

    def test_rejects_a_cargo_build_script(self):
        """The v1.0.1 artifact: a real PE with no NSIS header at all."""
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "build-script-build.exe"
            _pad(path, verify.MIN_BYTES + 1, prefix=b"MZ" + b"\x00" * 8192)
            with self.assertRaises(verify.Problem) as caught:
                verify.verify(path, "nsis")
            self.assertIn("NullsoftInst", str(caught.exception))

    def test_rejects_the_impostor_by_size_before_even_reading_it(self):
        """The published file was 302,592 bytes; size alone is decisive."""
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "small.exe"
            _pad(path, 302592, prefix=b"MZ")
            with self.assertRaises(verify.Problem) as caught:
                verify.verify(path, "nsis")
            self.assertIn("floor", str(caught.exception))

    def test_rejects_the_bare_application_binary(self):
        """A Tauri build of the app itself has no installer header."""
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "syntara.exe"
            _pad(path, verify.MIN_BYTES + 1, prefix=b"MZ" + b"\x00" * 60000)
            with self.assertRaises(verify.Problem):
                verify.verify(path, "nsis")

    def test_rejects_a_missing_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(verify.Problem):
                verify.verify(pathlib.Path(tmp) / "absent.exe", "nsis")

    def test_finds_a_marker_that_straddles_a_chunk_boundary(self):
        """The scan is chunked; an off-by-one there silently finds nothing."""
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "split.exe"
            # One byte before a 1 MiB boundary, so the 4-byte magic spans it.
            edge = verify._CHUNK - 1
            with path.open("wb") as handle:
                handle.write(b"MZ")
                handle.write(b"\x00" * (edge - 2))
                handle.write(verify.NSIS_MAGIC)
                handle.write(verify.NSIS_SIGNATURE)
            _extend(path, verify.MIN_BYTES + 1)
            verify.verify(path, "nsis")


class DmgFormatTest(unittest.TestCase):
    def _dmg(self, path: pathlib.Path, magic: bytes = b"koly") -> None:
        _pad(path, verify.MIN_BYTES + 1)
        with path.open("r+b") as handle:
            handle.seek(-verify.DMG_TRAILER_BYTES, 2)
            trailer = bytearray(verify.DMG_TRAILER_BYTES)
            trailer[0:len(magic)] = magic
            handle.write(bytes(trailer))

    def test_accepts_a_udif_image(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "app.dmg"
            self._dmg(path)
            verify.verify(path, "dmg")

    def test_rejects_an_image_without_the_koly_trailer(self):
        """A raw disk image or a renamed AppImage has no UDIF trailer."""
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "app.dmg"
            self._dmg(path, magic=b"\x00\x00\x00\x00")
            with self.assertRaises(verify.Problem) as caught:
                verify.verify(path, "dmg")
            self.assertIn("koly", str(caught.exception))


class AppImageFormatTest(unittest.TestCase):
    def _elf(self, path: pathlib.Path, marker: bytes = b"AI") -> None:
        _pad(path, verify.MIN_BYTES + 1,
             prefix=b"\x7fELF\x02\x01\x01\x00" + marker + b"\x02\x00")

    def test_accepts_a_type_two_image(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "app.AppImage"
            self._elf(path)
            verify.verify(path, "appimage")

    def test_rejects_the_bare_elf_without_a_type_marker(self):
        """Right size, right machine, wrong artifact - only the marker tells."""
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "app.AppImage"
            self._elf(path, marker=b"\x00\x00")
            with self.assertRaises(verify.Problem) as caught:
                verify.verify(path, "appimage")
            self.assertIn("AppImage type marker", str(caught.exception))

    def test_rejects_a_non_elf(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "app.AppImage"
            _pad(path, verify.MIN_BYTES + 1, prefix=b"#!/bin/sh\n")
            with self.assertRaises(verify.Problem):
                verify.verify(path, "appimage")


class VerifierCliTest(unittest.TestCase):
    """The gate runs in CI as a subprocess, so its exit code is the contract."""

    def _run(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            [sys.executable, str(TOOLS / "verify_installer.py"), *args],
            capture_output=True, text=True,
        )

    def test_exits_one_for_the_impostor_and_zero_for_a_real_installer(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = pathlib.Path(tmp) / "bad.exe"
            _pad(bad, 302592, prefix=b"MZ")
            failed = self._run("--kind", "nsis", str(bad))
            self.assertEqual(failed.returncode, 1, failed.stdout + failed.stderr)
            self.assertIn("not a usable nsis artifact", failed.stdout)

            good = pathlib.Path(tmp) / "good.exe"
            _pad(good, verify.MIN_BYTES + 1,
                 prefix=b"MZ" + b"\x00" * 9000 + verify.NSIS_MAGIC
                 + b"\x00" * 32 + verify.NSIS_SIGNATURE)
            passed = self._run("--kind", "nsis", str(good))
            self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)
            self.assertIn("is a real nsis artifact", passed.stdout)

    def test_rejects_an_unknown_kind(self):
        result = self._run("--kind", "zip", "whatever.exe")
        self.assertEqual(result.returncode, 2)


class FetchPinTest(unittest.TestCase):
    def test_pin_matches_the_runtime(self):
        """The version the packager installs is the version the runtime wants."""
        self.assertEqual(fetch.RELEASE, llama_cpp.PINNED_RELEASE)

    def test_binary_name_matches_the_runtime(self):
        self.assertEqual(fetch.server_name(sys.platform), llama_cpp.BIN_NAME)

    def test_staged_path_agrees_with_the_runtime_binary_name(self):
        self.assertEqual(stage.backend_binary().name, llama_cpp.BIN_NAME)

    def test_staged_path_is_relative_to_the_app_root(self):
        """Callers join this under `app`, so it must not repeat the prefix.

        Getting this wrong makes --require-backend report a missing file that
        was staged a moment earlier, which reads as "the fetcher did not work"
        and sends the next person looking in the wrong place.
        """
        self.assertFalse(stage.backend_binary().parts[0] == "app")
        self.assertEqual(stage.backend_binary().parts[0], "syntara")

    def test_every_shipped_platform_has_a_pin(self):
        for entry in ("win32", "darwin", "linux"):
            names = [fetch.ARCHIVES[key][0] for key in fetch.ARCHIVES
                     if key[0] == entry]
            self.assertTrue(names, f"no pinned archive for {entry}")

    def test_the_host_platform_this_test_runs_on_has_a_pin(self):
        """Otherwise the release build silently skips the backend here."""
        try:
            name, digest = fetch.select(sys.platform, __import__("platform").machine())
        except fetch.FetchError as problem:
            self.skipTest(str(problem))
        self.assertTrue(name.endswith((".zip", ".tar.gz")))
        self.assertRegex(digest, r"^[0-9a-f]{64}$")

    def test_digests_are_lowercase_hex(self):
        for key, (name, digest) in fetch.ARCHIVES.items():
            with self.subTest(platform=key):
                self.assertRegex(digest, r"^[0-9a-f]{64}$", name)

    def test_archive_names_carry_the_pinned_release(self):
        for key, (name, _) in fetch.ARCHIVES.items():
            with self.subTest(platform=key):
                self.assertIn(fetch.RELEASE, name)

    def test_unsupported_platform_points_at_the_override(self):
        with self.assertRaises(fetch.FetchError) as caught:
            fetch.select("linux", "ppc64le")
        self.assertIn("SYNTARA_LLAMA_BIN", str(caught.exception))


class MachineNormalisationTest(unittest.TestCase):
    """platform.machine() is 'AMD64' on Windows, not 'x86_64'.

    Keying the pin table on the raw string misses on the Windows runner, which
    is how an installer ends up published with no backend at all.
    """

    def test_cpythons_windows_spelling_resolves(self):
        self.assertEqual(fetch.select("win32", "AMD64")[0],
                         fetch.ARCHIVES[("win32", "x64")][0])

    def test_every_spelling_of_one_arch_folds_together(self):
        for spelling in ("amd64", "AMD64", "x86_64", "X86_64", "x64"):
            with self.subTest(machine=spelling):
                self.assertEqual(fetch._normalize_machine(spelling), "x64")
        for spelling in ("arm64", "ARM64", "aarch64"):
            with self.subTest(machine=spelling):
                self.assertEqual(fetch._normalize_machine(spelling), "arm64")

    def test_linux_x64_resolves(self):
        self.assertEqual(fetch.select("linux", "x86_64")[0],
                         fetch.ARCHIVES[("linux", "x64")][0])

    def test_apple_silicon_resolves(self):
        self.assertEqual(fetch.select("darwin", "arm64")[0],
                         fetch.ARCHIVES[("darwin", "arm64")][0])


class ArchiveSafetyTest(unittest.TestCase):
    def test_rejects_traversal(self):
        for name in ("../escape", "root/../../escape", "a/b/../../../x"):
            with self.subTest(name=name):
                with self.assertRaises(fetch.FetchError):
                    fetch._reject_unsafe(name)

    def test_rejects_absolute_paths(self):
        for name in ("/etc/passwd", "C:/Windows/system32"):
            with self.subTest(name=name):
                with self.assertRaises(fetch.FetchError):
                    fetch._reject_unsafe(name)

    def test_rejects_backslashes(self):
        """A backslash member name is a layout change or an escape attempt."""
        with self.assertRaises(fetch.FetchError):
            fetch._reject_unsafe("..\\escape.dll")

    def test_accepts_ordinary_names(self):
        self.assertEqual(fetch._reject_unsafe("ggml-cpu-avx2.dll"),
                         "ggml-cpu-avx2.dll")


class PayloadLayoutTest(unittest.TestCase):
    """Both published layouts must land as one flat directory of siblings.

    Windows ships a flat zip; the POSIX tarballs nest everything under a
    llama-<release>/ root. If either stops being handled, the server binary
    arrives without the libraries it loads at startup.
    """

    def _payload(self) -> list[tuple[str, bytes]]:
        return [("llama-server", b"stub"),
                ("libllama.so", b"lib"),
                ("libggml-cpu-avx2.so", b"lib"),
                ("LICENSE", b"licence")]

    def test_zip_layout_flattens(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "flat.zip"
            with zipfile.ZipFile(archive, "w") as zf:
                for name, blob in self._payload():
                    zf.writestr(name, blob)
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_zip(archive, dest, "llama-server")
            self.assertTrue((dest / "llama-server").is_file())
            self.assertTrue((dest / "libllama.so").is_file())

    def test_tarball_root_is_stripped(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "nested.tar.gz"
            with tarfile.open(archive, "w:gz") as tf:
                for name, blob in self._payload():
                    info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/{name}")
                    info.size = len(blob)
                    tf.addfile(info, __import__("io").BytesIO(blob))
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_tar(archive, dest, "llama-server")
            self.assertTrue((dest / "llama-server").is_file())
            self.assertTrue((dest / "libggml-cpu-avx2.so").is_file())
            # No leftover root directory.
            self.assertEqual(sorted(p.name for p in dest.iterdir()),
                             sorted(n for n, _ in self._payload()))

    def test_nested_files_beside_the_payload_are_not_pulled_in(self):
        """Samples and a second copy of the payload are not runtime deps."""
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "nested.tar.gz"
            import io
            with tarfile.open(archive, "w:gz") as tf:
                for name, blob in [("llama-server", b"stub"),
                                   ("libllama.so", b"lib"),
                                   ("samples/run/other.bin", b"junk")]:
                    info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/{name}")
                    info.size = len(blob)
                    tf.addfile(info, io.BytesIO(blob))
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_tar(archive, dest, "llama-server")
            self.assertFalse((dest / "samples").exists())

    def test_an_archive_without_the_server_fails_loudly(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "flat.zip"
            with zipfile.ZipFile(archive, "w") as zf:
                zf.writestr("readme.txt", b"nothing useful")
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            with self.assertRaises(fetch.FetchError) as caught:
                fetch.extract_zip(archive, dest, "llama-server")
            self.assertIn("no llama-server", str(caught.exception))


class PosixBackendInstallTest(unittest.TestCase):
    """The POSIX legs must install a backend that can actually be run.

    v1.0.2 failed here on macOS and Linux while Windows passed, which is the
    whole reason this class exists. The Windows payload is a zip, so it never
    reaches extract_tar; macos-latest puts Xcode's Python 3.9 on PATH, and
    `filter=` on TarFile.extract arrived in 3.11.4, so the tarball path raised
    TypeError on an interpreter the workflow never pinned.
    """

    def _tarball(self, tmp: str, mode: int = 0o755) -> pathlib.Path:
        archive = pathlib.Path(tmp) / "payload.tar.gz"
        with tarfile.open(archive, "w:gz") as tf:
            for name, blob in [("llama-server", b"stub"), ("libllama.so", b"lib")]:
                info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/{name}")
                info.size = len(blob)
                # The payload must model how the real tarballs ship: only the
                # server binary carries the exec bit the `mode` argument
                # controls, the shared library ships 0644. Giving every member
                # the same mode made the fixture contradict the assertions
                # below (extract_tar follows the archive, by design), which
                # failed the exec-bit test on every POSIX runner while the
                # `os.name != "nt"` guard let Windows stay green.
                info.mode = mode if name == "llama-server" else 0o644
                tf.addfile(info, io.BytesIO(blob))
        return archive

    def test_tar_payload_keeps_the_executable_bit(self):
        """extract_tar sets the mode extract() would have applied.

        The pinned tarballs ship llama-server as 0755. Extracting by hand
        without restoring it yields a backend that installs successfully and
        then dies at exec() with EACCES on the user's machine.
        """
        with tempfile.TemporaryDirectory() as tmp:
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_tar(self._tarball(tmp), dest, "llama-server")
            server = dest / "llama-server"
            self.assertTrue(server.is_file())
            if os.name != "nt":
                self.assertTrue(os.access(server, os.X_OK),
                                "llama-server was extracted without +x")
                # The shared library stays non-executable, as it ships.
                self.assertFalse(os.access(dest / "libllama.so", os.X_OK))

    def test_a_non_executable_member_is_not_promoted(self):
        """chmod follows the archive rather than blanket-marking everything."""
        with tempfile.TemporaryDirectory() as tmp:
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_tar(self._tarball(tmp, mode=0o644), dest, "llama-server")
            if os.name != "nt":
                self.assertFalse(os.access(dest / "llama-server", os.X_OK))

    def _symlink_tarball(self, tmp: str) -> pathlib.Path:
        """A payload in the shape llama.cpp actually ships.

        The POSIX tarballs are 50 files plus 10 symlinks (Linux) and 42 files
        plus 18 (macOS), and the names llama-server dlopen()s - libllama.so,
        libllama.dylib - exist ONLY as symlinks. An extractor that takes plain
        files alone therefore produces a backend that installs cleanly and
        then cannot load its own libraries.
        """
        archive = pathlib.Path(tmp) / "payload.tar.gz"
        with tarfile.open(archive, "w:gz") as tf:
            for name, blob in [("llama-server", b"stub"),
                               ("libllama.so.0.5.0", b"real-library-bytes")]:
                info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/{name}")
                info.size = len(blob)
                info.mode = 0o755
                tf.addfile(info, io.BytesIO(blob))
            link = tarfile.TarInfo(f"llama-{fetch.RELEASE}/libllama.so")
            link.type = tarfile.SYMTYPE
            link.linkname = "libllama.so.0.5.0"
            tf.addfile(link)
        return archive

    def test_symlinked_libraries_are_installed_not_dropped(self):
        """The v1.0.3 POSIX regression, in miniature.

        Both POSIX legs failed because extraction skipped every symlink, so the
        backend shipped without the libraries it loads at startup.
        """
        with tempfile.TemporaryDirectory() as tmp:
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_tar(self._symlink_tarball(tmp), dest, "llama-server")
            link = dest / "libllama.so"
            self.assertTrue(link.exists() or link.is_symlink(),
                            "the dlopen()'d library name was not installed")
            self.assertEqual((dest / "libllama.so.0.5.0").read_bytes(),
                             b"real-library-bytes")

    def test_chained_symlinks_are_resolved(self):
        """libggml.dylib -> libggml.0.dylib -> libggml.0.25.3.dylib.

        The middle link is stored after the one that needs it, so links cannot
        be created in a single archive-order pass.
        """
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "chained.tar.gz"
            with tarfile.open(archive, "w:gz") as tf:
                info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/libggml.0.25.3.dylib")
                info.size = len(b"real")
                info.mode = 0o755
                tf.addfile(info, io.BytesIO(b"real"))
                for leaf, target in (("libggml.0.dylib", "libggml.0.25.3.dylib"),
                                     ("libggml.dylib", "libggml.0.dylib")):
                    link = tarfile.TarInfo(f"llama-{fetch.RELEASE}/{leaf}")
                    link.type = tarfile.SYMTYPE
                    link.linkname = target
                    tf.addfile(link)
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            fetch.extract_tar(archive, dest, "libggml.0.25.3.dylib")
            for leaf in ("libggml.0.dylib", "libggml.dylib"):
                with self.subTest(leaf=leaf):
                    self.assertTrue((dest / leaf).exists() or (dest / leaf).is_symlink())

    def test_a_link_escaping_the_payload_is_refused(self):
        """An archive must not make the installer read or expose a path outside."""
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "escape.tar.gz"
            with tarfile.open(archive, "w:gz") as tf:
                info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/llama-server")
                info.size = len(b"stub")
                info.mode = 0o755
                tf.addfile(info, io.BytesIO(b"stub"))
                escape = tarfile.TarInfo(f"llama-{fetch.RELEASE}/libllama.so")
                escape.type = tarfile.SYMTYPE
                escape.linkname = "../../../../etc/passwd"
                tf.addfile(escape)
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            with self.assertRaises(fetch.FetchError) as caught:
                fetch.extract_tar(archive, dest, "llama-server")
            self.assertIn("links outside the payload", str(caught.exception))

    def test_a_dangling_link_is_refused_rather_than_written(self):
        """A link to a member the payload lacks is a layout change, not a link."""
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "dangling.tar.gz"
            with tarfile.open(archive, "w:gz") as tf:
                info = tarfile.TarInfo(f"llama-{fetch.RELEASE}/llama-server")
                info.size = len(b"stub")
                info.mode = 0o755
                tf.addfile(info, io.BytesIO(b"stub"))
                orphan = tarfile.TarInfo(f"llama-{fetch.RELEASE}/libllama.so")
                orphan.type = tarfile.SYMTYPE
                orphan.linkname = "libllama.so.0.5.0"
                tf.addfile(orphan)
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            with self.assertRaises(fetch.FetchError):
                fetch.extract_tar(archive, dest, "llama-server")

    def test_extraction_does_not_require_tarfile_filter(self):
        """Guard the CPython floor that broke the POSIX legs.

        A 3.9 interpreter has no `filter=` parameter, so calling it is a
        TypeError. This asserts the tarball is written out member by member
        rather than handed to extract(), instead of trying to run a 3.9
        interpreter on a newer CI machine.
        """
        import inspect
        source = inspect.getsource(fetch.extract_tar)
        self.assertNotIn("tf.extract(", source)
        self.assertIn("extractfile(", source)

    def test_missing_backend_is_reported_as_unlaunchable(self):
        with tempfile.TemporaryDirectory() as tmp:
            absent = pathlib.Path(tmp) / "llama-server"
            with self.assertRaises(fetch.FetchError) as caught:
                fetch.smoke_test(absent)
            self.assertIn("could not be launched", str(caught.exception))


class SmokeTestOutputTest(unittest.TestCase):
    """smoke_test must turn every outcome into a reason, not a traceback."""

    def _fake_run(self, returncode: int, stdout: bytes = b"", stderr: bytes = b""):
        class Done:
            pass
        done = Done()
        done.returncode = returncode
        done.stdout = stdout
        done.stderr = stderr
        original = subprocess.run
        subprocess.run = lambda *a, **k: done
        self.addCleanup(setattr, subprocess, "run", original)

    def _stub(self, tmp: str) -> pathlib.Path:
        binary = pathlib.Path(tmp) / "llama-server"
        binary.write_bytes(b"stub")
        return binary

    def test_first_line_is_reported(self):
        self._fake_run(0, stdout=b"version: 0.5.0-dev (build 11321)\nmore\n")
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(fetch.smoke_test(self._stub(tmp)),
                             "version: 0.5.0-dev (build 11321)")

    def test_silence_is_treated_as_an_unusable_backend(self):
        """An empty splitlines()[0] used to raise IndexError."""
        self._fake_run(0, stdout=b"", stderr=b"")
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(fetch.FetchError) as caught:
                fetch.smoke_test(self._stub(tmp))
            self.assertIn("printed nothing", str(caught.exception))

    def test_undecodable_output_does_not_raise(self):
        """text=True would raise UnicodeDecodeError out of subprocess."""
        self._fake_run(0, stdout=b"\xff\xfe not utf-8\n")
        with tempfile.TemporaryDirectory() as tmp:
            # Decoded with U+FFFD for the bad bytes, so the readable part
            # survives instead of the whole run dying on a decode error.
            self.assertIn("not utf-8", fetch.smoke_test(self._stub(tmp)))

    def test_nonzero_exit_reports_the_status_and_output(self):
        self._fake_run(-4, stderr=b"Illegal instruction\n")
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(fetch.FetchError) as caught:
                fetch.smoke_test(self._stub(tmp))
            message = str(caught.exception)
            self.assertIn("exited -4", message)
            self.assertIn("Illegal instruction", message)


class ChecksumTest(unittest.TestCase):
    def test_a_corrupted_archive_is_refused(self):
        """The checksum is checked before anything is extracted (S62)."""
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "payload.zip"
            _pad(archive, 4096, prefix=b"PK\x03\x04")
            with self.assertRaises(fetch.FetchError) as caught:
                fetch._verify(archive, "0" * 64, "payload.zip")
            message = str(caught.exception)
            self.assertIn("checksum mismatch", message)
            self.assertIn("refusing to extract", message)

    def test_install_refuses_a_corrupted_archive_without_touching_dest(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / "payload.zip"
            _pad(archive, 4096, prefix=b"PK\x03\x04")
            dest = pathlib.Path(tmp) / "bin"
            dest.mkdir()
            with self.assertRaises(fetch.FetchError):
                fetch.install(pathlib.Path(tmp), force=True,
                              archive_path=archive,
                              sys_platform="win32", machine="amd64")
            self.assertEqual(list(dest.iterdir()), [],
                             "a refused archive left files behind")


class WorkflowGuardTest(unittest.TestCase):
    """The installer workflow must not be able to regress to the v1.0.1 logic.

    These assert on the workflow's script lines rather than running it: a
    release build is not reproducible in a unit test, but the mistake is
    textual and cheap to pin. Comment lines are excluded because the
    explanation of the original bug necessarily contains the buggy text.
    """

    WORKFLOW = REPO / ".github" / "workflows" / "desktop-installers.yml"

    def setUp(self):
        text = self.WORKFLOW.read_text(encoding="utf-8")
        self.all_lines = text.splitlines()
        self.script = [line for line in self.all_lines
                       if line.strip() and not line.strip().startswith("#")]

    def test_the_artifact_glob_is_never_searched_across_the_whole_target_tree(self):
        """`find src-tauri/target -name "$glob"` is the exact v1.0.1 defect.

        The Windows glob is `*.exe` and the cargo target tree holds a build
        script per dependency crate, so a whole-tree file search publishes one
        of those instead of the installer.
        """
        offenders = [line for line in self.script
                     if "find src-tauri/target" in line and "matrix.glob" in line]
        self.assertEqual(offenders, [], (
            "artifact discovery searches the whole target tree; scope it to "
            f"the bundle directory instead: {offenders}"
        ))

    def test_no_first_match_wins_picking_of_a_build_output(self):
        """`head -1` turns "several candidates" into a silent coin flip."""
        offenders = [line for line in self.script if "head -1" in line]
        self.assertEqual(offenders, [], (
            f"a build output is picked by first match: {offenders}"
        ))

    def test_discovery_is_scoped_to_the_bundler_output_directory(self):
        joined = "\n".join(self.script)
        self.assertIn('bundle/${{ matrix.bundle }}', joined)
        # And it refuses to guess when the count is not exactly one.
        self.assertIn('-ne 1', joined)

    def test_every_platform_installs_the_pinned_backend(self):
        joined = "\n".join(self.script)
        self.assertIn("tools/fetch_llama_cpp.py", joined)
        self.assertIn("--require-backend", joined)

    def test_the_packaging_interpreter_is_pinned(self):
        """The staging scripts are stdlib-only, so nothing else pins it.

        v1.0.2 failed macOS and Linux because the runner image's `python3` was
        older than the code required. Pinning turns the interpreter into a
        declared build input instead of an accident of the image.
        """
        joined = "\n".join(self.all_lines)
        self.assertIn("actions/setup-python@", joined)
        pinned = [line for line in self.all_lines if "python-version:" in line]
        self.assertTrue(pinned, "setup-python declares no python-version")

    def test_staging_failures_are_readable_afterwards(self):
        """Actions logs need a session to read; an artifact does not.

        A staging failure that cannot be inspected from the public API is a
        failure that has to be reproduced before it can be fixed.
        """
        joined = "\n".join(self.all_lines)
        self.assertIn("staging.log", joined)
        self.assertIn("staging-log-", joined)
        # Uploaded unconditionally, so it exists on the run that failed.
        self.assertIn("if: always()", joined)

    def test_staging_status_is_not_masked_by_the_log_tee(self):
        """`| tee` would hide a failing fetcher behind tee's exit status."""
        joined = "\n".join(self.script)
        self.assertIn("PIPESTATUS", joined)

    def test_the_publish_job_verifies_format_before_uploading(self):
        joined = "\n".join(self.script)
        self.assertIn("tools/verify_installer.py", joined)
        for kind in ("nsis", "dmg", "appimage"):
            with self.subTest(kind=kind):
                self.assertIn(f"check {kind}", joined)

    def test_all_three_asset_names_are_verified(self):
        text = self.WORKFLOW.read_text(encoding="utf-8")
        for name in ("Syntara-Windows-x64-Setup.exe",
                     "Syntara-macOS-arm64.dmg",
                     "Syntara-Linux-x86_64.AppImage"):
            with self.subTest(asset=name):
                self.assertIn(name, text)

    def test_every_published_asset_is_built_by_the_matrix(self):
        """The publish job demands all three asset names by name.

        A matrix entry that gets deleted while EXPECTED_ASSETS keeps the name
        turns the publish step red on every successful build; the two lists
        must move together.
        """
        joined = "\n".join(self.script)
        for name in ("Syntara-Windows-x64-Setup.exe",
                     "Syntara-macOS-arm64.dmg",
                     "Syntara-Linux-x86_64.AppImage"):
            with self.subTest(asset=name):
                self.assertIn(f"asset: {name}", joined)
        for kind in ("nsis", "dmg", "appimage"):
            with self.subTest(bundle=kind):
                self.assertIn(f"bundle: {kind}", joined)

    def test_the_windows_leg_does_not_cross_compile(self):
        """The macOS rust_target must stay on the macOS entry.

        When it leaked onto the windows entry, `tauri build` ran with
        `--target aarch64-apple-darwin` on windows-latest and died compiling
        objc2-exception-helper (`-arch arm64` unrecognized): the windows
        installer job failed for a target only macOS should ever see.
        """
        block, in_windows = [], False
        for line in self.script:
            stripped = line.strip()
            if stripped.startswith("- os:"):
                in_windows = stripped == "- os: windows-latest"
                continue
            if in_windows:
                block.append(line)
        offenders = [line for line in block if "rust_target:" in line]
        self.assertEqual(offenders, [], (
            "the windows leg is handed a cross-compilation target; the NSIS "
            f"installer must be built for the runner's host: {offenders}"
        ))

    def test_the_workflow_needs_no_bash4_builtin(self):
        """macOS runners execute these scripts with /bin/bash 3.2.

        `mapfile` there exits 127 - after the dmg has already been built - so
        the macOS leg failed at discovery even though the bundler succeeded.
        """
        joined = "\n".join(self.script)
        for builtin in ("mapfile", "readarray"):
            with self.subTest(builtin=builtin):
                self.assertNotIn(builtin, joined)

    def test_the_dispatch_tag_is_validated_before_anything_builds(self):
        """Run #15 built three installers, then died on a missing git tag.

        `gh release create --verify-tag` was the first thing to look at the
        dispatched `1.0.6` - after fifteen minutes of building. The preflight
        job validates the name and creates the tag first, and both the build
        and the publish job wait for it, so a bad name fails in seconds.
        """
        joined = "\n".join(self.script)
        self.assertIn("git check-ref-format", joined)
        self.assertIn("needs: preflight", joined)
        self.assertIn("needs: [preflight, build]", joined)

    def test_the_release_wait_never_runs_for_a_manual_dispatch(self):
        """A dispatch has no sibling release.yml run to wait for.

        release.yml only triggers on `v*` tag pushes. Run #15 spent 5m08s of
        its 5m27s polling 20 times for a release nothing was going to create.
        """
        lines = self.script
        step = next(
            (i for i, line in enumerate(lines)
             if line.strip() == "- name: Wait for the release from release.yml"),
            None,
        )
        self.assertIsNotNone(step, "the release wait step was renamed or removed")
        following = lines[step + 1:step + 4]
        self.assertTrue(
            any("github.event_name == 'push'" in line for line in following),
            f"the release wait runs on a dispatch too: {following}",
        )


class ReleaseArchiveGuardTest(unittest.TestCase):
    """The launcher-member guards in release.yml must be able to fail correctly.

    `grep -q` exits at the first match, closing the pipe; under the workflow's
    `bash -eo pipefail` the producer's write error then fails the guard for an
    archive that is perfectly fine. The linux x86-64-v3 leg failed exactly
    that way (`tar: stdout: write error` on a tarball that listed `syntara`).
    """

    WORKFLOW = REPO / ".github" / "workflows" / "release.yml"

    def setUp(self):
        text = self.WORKFLOW.read_text(encoding="utf-8")
        self.script = [line for line in text.splitlines()
                       if line.strip() and not line.strip().startswith("#")]

    def test_listing_guards_must_drain_the_stream(self):
        offenders = [
            line for line in self.script
            if "grep -q" in line and ("tar tzf" in line or "7z l " in line)
        ]
        self.assertEqual(offenders, [], (
            "`grep -q` on an archive listing closes the pipe early; pipefail "
            f"then reports the producer's write error as a guard failure: {offenders}"
        ))

    def test_the_launcher_member_is_still_asserted(self):
        """Draining the stream must not have dropped the actual assertion."""
        joined = "\n".join(self.script)
        self.assertIn("grep -x 'syntara'", joined)
        self.assertIn("grep -E '[[:space:]]syntara$'", joined)


class StagedBackendRequirementTest(unittest.TestCase):
    """--require-backend is what stops a backend-less bundle being published."""

    def _tree(self, root: pathlib.Path, *, backend: bool) -> pathlib.Path:
        out = root / "resources"
        app = out / "app"
        for name in stage.REQUIRED_PACKAGE_FILES:
            target = app / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.touch()
        where, fallback = stage.interpreters(out)
        where.parent.mkdir(parents=True, exist_ok=True)
        where.touch()
        if backend:
            binary = app / stage.backend_binary()
            binary.parent.mkdir(parents=True, exist_ok=True)
            binary.touch()
        return out

    def test_backend_is_reported_missing_when_required_and_absent(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = self._tree(pathlib.Path(tmp), backend=False)
            self.assertIn(str(stage.backend_binary()),
                          stage.missing_pieces(out, require_backend=True))

    def test_backend_is_not_reported_when_present(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = self._tree(pathlib.Path(tmp), backend=True)
            self.assertEqual(stage.missing_pieces(out, require_backend=True), [])

    def test_a_dev_run_without_the_flag_still_passes(self):
        """Running the app from source must not require a downloaded backend."""
        with tempfile.TemporaryDirectory() as tmp:
            out = self._tree(pathlib.Path(tmp), backend=False)
            self.assertEqual(stage.missing_pieces(out, require_backend=False), [])


if __name__ == "__main__":
    unittest.main()
