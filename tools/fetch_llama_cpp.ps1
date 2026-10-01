<#
.SYNOPSIS
    Fetches the pinned llama.cpp server binary for Syntara's GGUF runtime.

.DESCRIPTION
    Downloads one release archive from the official llama.cpp GitHub releases
    at a pinned URL, verifies its SHA-256 before touching it, and extracts
    only the server executable into syntara/runtime/bin/ (gitignored).

    Windows x64 CPU builds are pinned here. On other platforms this script
    explains the honest alternative (SYNTARA_LLAMA_BIN) instead of guessing
    a URL: the runtime adapter reads that environment variable first.

    Nothing from llama.cpp is vendored in this repository; see
    THIRD_PARTY_NOTICES.md for the licence.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools/fetch_llama_cpp.ps1
#>
[CmdletBinding()]
param(
    # Re-download and replace an already-installed binary.
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$Release   = 'b11321'
$ArchiveUrl = "https://github.com/ggml-org/llama.cpp/releases/download/$Release/llama-$Release-bin-win-cpu-x64.zip"
$ArchiveSha256 = '8f8c0c6501b075f52deff59537c05acd57d8621a0a7935f29b7d7c4812892569'
$ExeName   = 'llama-server.exe'
$BinName   = if ($IsWindows -or $env:OS -eq 'Windows_NT') { 'llama-server.exe' } else { 'llama-server' }

$RepoRoot = Split-Path -Parent $PSScriptRoot
$TargetDir = Join-Path $RepoRoot 'syntara\runtime\bin'
$TargetExe = Join-Path $TargetDir $BinName

if (-not ($IsWindows -or $env:OS -eq 'Windows_NT')) {
    Write-Error ("this installer pins a Windows x64 build (llama.cpp $Release). " +
        "On this platform build llama.cpp from source (https://github.com/ggml-org/llama.cpp) " +
        "and set SYNTARA_LLAMA_BIN to the resulting server binary; " +
        "syntara/runtime/llama_cpp.py reads that variable before any bundled path.")
    exit 1
}

$DllName   = 'llama-server-impl.dll'   # the stub exe cannot run without it
if ((Test-Path -LiteralPath $TargetExe) -and
    (Test-Path -LiteralPath (Join-Path $TargetDir $DllName)) -and
    -not $Force) {
    Write-Host "already installed: $TargetExe (use -Force to re-fetch)"
    exit 0
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
$zip = Join-Path ([System.IO.Path]::GetTempPath()) "syntara-llama-$Release.zip"
try {
    Write-Host "downloading llama.cpp $Release ..."
    # Older PowerShell defaults can miss TLS 1.2, which GitHub requires.
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $old = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is very slow otherwise
    try {
        Invoke-WebRequest -Uri $ArchiveUrl -OutFile $zip -UseBasicParsing
    } finally {
        $ProgressPreference = $old
    }

    $actual = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $ArchiveSha256) {
        Write-Error ("archive checksum mismatch - refusing to extract.`n" +
            "  expected: $ArchiveSha256`n  actual:   $actual`n" +
            "The download was corrupted or the pinned value is stale; " +
            "do not proceed until this is explained.")
        exit 1
    }
    Write-Host "checksum ok"

    # The server executable is a small stub that loads companion DLLs
    # (llama-server-impl.dll, llama-common.dll, ggml-*.dll, libomp.dll, ...),
    # so the whole flat distribution must be extracted. Entries are validated
    # before extraction (no absolute paths, no traversal, no subdirectories).
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($zip)
    try {
        $entries = @($archive.Entries)
        if (-not ($entries | Where-Object { $_.Name -eq $ExeName })) {
            Write-Error "archive does not contain $ExeName - pinned URL may be wrong"
            exit 1
        }
        foreach ($entry in $entries) {
            if ([string]::IsNullOrEmpty($entry.Name)) { continue }  # directory marker
            # The pinned archive is flat; anything else fails loudly instead
            # of silently reproducing a layout we have not audited.
            $rel = $entry.FullName
            if ($rel -match '[\\/]' -or $rel -match '(^|[\\/])\.\.([\\/]|$)') {
                Write-Error "archive entry is not a flat file: $rel - refusing to extract"
                exit 1
            }
            $dest = Join-Path $TargetDir $rel
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
        }
    } finally {
        $archive.Dispose()
    }
} finally {
    Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
}

& $TargetExe --version
Write-Host "installed: $TargetExe"
Write-Host "try: python -m syntara serve --model <path-to-model.gguf>"
