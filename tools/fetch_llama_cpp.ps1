<#
.SYNOPSIS
    Fetches the pinned llama.cpp server binary for Syntara's GGUF runtime.

.DESCRIPTION
    A thin front end for tools/fetch_llama_cpp.py, kept because the docs point
    at this path and Windows developers reach for PowerShell first. The logic
    lives in Python so there is exactly one pin table.

    That duplication is the point: this script used to carry its own URL and
    SHA-256 and hard-error on anything but Windows, so the macOS and Linux
    installers shipped with no inference backend at all - the app installed
    cleanly and then failed at RuntimeNotAvailable. One implementation covers
    all three platforms and cannot drift from the release the runtime expects.

    The fetcher checks the SHA-256 before extracting anything, validates every
    archive member name, installs the whole flat payload beside the server
    binary (it is a stub that loads companion shared libraries), and runs
    `--version` to prove the result actually loads.

.PARAMETER Force
    Re-download and replace an already-installed backend.

.PARAMETER Dest
    Also copy the installed server binary to this directory.

.PARAMETER FromArchive
    Install from a local archive instead of downloading. Still checksum-verified.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools/fetch_llama_cpp.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools/fetch_llama_cpp.ps1 -Force

.NOTES
    Nothing from llama.cpp is vendored in this repository; see
    THIRD_PARTY_NOTICES.md for the licence.
#>
[CmdletBinding()]
param(
    [switch]$Force,
    [string]$Dest,
    [string]$FromArchive
)

$ErrorActionPreference = 'Stop'

# `py -3` is the launcher on a stock Windows install; `python` is the App
# Execution Alias stub that Windows 10+ puts on PATH and which fails unless
# the Store version has been opened once. Probing beats trusting either, and
# beats a `||` fallback because PowerShell throws on the first miss.
$python = $null
foreach ($candidate in @('py', 'python', 'python3')) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        $python = $candidate
        break
    }
}
if (-not $python) {
    Write-Error ("no Python interpreter found (tried py, python, python3). " +
        "Syntara bundles one for the installer build; this script only needs " +
        "any Python 3.8+ to fetch the backend. Alternatively build llama.cpp " +
        "from source and set SYNTARA_LLAMA_BIN.")
    exit 1
}

$args = @("-3", "$PSScriptRoot\fetch_llama_cpp.py")
if ($Force)          { $args += '--force' }
if ($Dest)           { $args += @('--dest', $Dest) }
if ($FromArchive)    { $args += @('--from-archive', $FromArchive) }

# Exit code is propagated, not merely logged: the installer workflow runs this
# under a step that must fail loudly rather than publish without a backend.
& $python @args
exit $LASTEXITCODE
