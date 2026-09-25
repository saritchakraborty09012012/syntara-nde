#!/usr/bin/env python3
"""Static contract check for the c/syntara Python CLI launcher.

c/syntara is exercised as a Python program in four independent places:

  - flake.nix:          python c/syntara convert --model ...
  - c/Makefile install: places c/syntara in BINDIR as the CLI launcher
  - CI:                 the `python` and `windows-python-focused` jobs run
                        c/tests, which import c/syntara as Python
  - release/Docker:     release verify loads c/syntara as Python and calls
                        engine_for()/model_arch(); Docker's ENTRYPOINT is
                        python3 /app/syntara

So the committed c/syntara must be the extensionless Python launcher. The
engine build (syntara.c -> syntara$(EXE)) must NOT occupy that path: on Unix
EXE is empty, so a built engine lands directly at c/syntara and clobbers the
launcher. This check fails loudly whenever a build artifact or a missing file
breaks the contract instead of letting it surface as a SyntaxError at runtime.

Deliberately static and dependency-free: no yaml, no network, python3 only.
"""
import ast
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
LAUNCHER = HERE / "syntara"

ELF_MAGIC = b"\x7fELF"

REQUIRED_SYMBOLS = ("engine_for", "model_arch", "_EXE")


def shebang_names_python(first_line):
    rest = first_line.lstrip("#!").strip()
    if not rest:
        return False
    parts = rest.split()
    if "python" in parts[0]:
        return True
    if os.path.basename(parts[0]) == "env" and len(parts) > 1:
        return "python" in parts[1]
    return False


def module_level_names(tree: ast.Module) -> set:
    names = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            names.add(node.name)
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    names.add(target.id)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            names.add(node.target.id)
    return names


def report(failures):
    if failures:
        print("launcher-contract FAIL:")
        for line in failures:
            print("  - " + line)
        return 1
    print("launcher-contract OK: c/syntara is the committed Python launcher "
          "with {}".format(", ".join(REQUIRED_SYMBOLS)))
    return 0


def main():
    failures = []

    if not LAUNCHER.exists():
        failures.append(
            "{} is missing: the Python CLI launcher is not committed. Do not "
            "replace it with a built engine (make clean removes those); "
            "restore the launcher source at this path.".format(LAUNCHER)
        )
        return report(failures)

    raw = LAUNCHER.read_bytes()

    if raw.startswith(ELF_MAGIC):
        failures.append(
            "{} is a compiled ELF engine artifact, not the Python launcher "
            "(delete the built engine from the source tree and restore the "
            "launcher here).".format(LAUNCHER)
        )
        return report(failures)

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        failures.append("{} is not UTF-8 text: {}.".format(LAUNCHER, exc))
        return report(failures)

    first_line = text.splitlines()[0] if text else ""
    if not first_line.startswith("#!"):
        failures.append("{}: first line is not a shebang.".format(LAUNCHER))
    elif not shebang_names_python(first_line):
        failures.append(
            "{}: shebang {!r} does not name python.".format(LAUNCHER, first_line)
        )

    try:
        tree = ast.parse(text, filename=str(LAUNCHER))
    except SyntaxError as exc:
        failures.append(
            "{} does not parse as Python: {}.".format(LAUNCHER, exc)
        )
        return report(failures)

    names = module_level_names(tree)
    for symbol in REQUIRED_SYMBOLS:
        if symbol not in names:
            failures.append(
                "{} does not define {} at module level.".format(LAUNCHER, symbol)
            )

    return report(failures)


if __name__ == "__main__":
    sys.exit(main())