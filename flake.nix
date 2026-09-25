{
  description = "Syntara — run large MoE models (GLM-5.2, OLMoE, DeepSeek V4 Flash) on a consumer machine";

  # flake.lock (committed) pins these branch inputs to exact commit SHAs,
  # so builds are reproducible; refresh with `nix flake update`.
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};

        # Python with the packages needed by the offline converter tools
        pythonEnv = pkgs.python3.withPackages (
          ps:
            with ps; [
              torch
              safetensors
              huggingface-hub
              numpy
              tokenizers
              datasets
            ]
        );

        isDarwin = pkgs.stdenv.hostPlatform.isDarwin;

        # Real version from the engine's single source of truth (c/version.py).
        syntaraVersion = let
          m = builtins.match ''.*__version__ = "([^"]+)".*'' (builtins.readFile ./c/version.py);
        in
          if m == null
          then "0"
          else builtins.head m;

        # Apple clang has no OpenMP runtime and the Makefile only finds libomp via
        # `brew`, absent here; expose omp.h + libomp as OMPDIR or macOS goes single-threaded.
        syntaraOmp = pkgs.symlinkJoin {
          name = "syntara-openmp";
          paths = [pkgs.llvmPackages.openmp pkgs.llvmPackages.openmp.dev];
        };

        # Portable default per arch — never -mcpu=native, which would pin a
        # distributed binary to the builder's core and break substitution.
        archBaseline =
          if pkgs.stdenv.hostPlatform.isx86_64
          then "x86-64-v3"
          else if isDarwin
          then "" # arm64 macOS: NEON is baseline
          else "armv8-a";

        # Build args: portable ARCH, plus (on macOS) OpenMP via OMPDIR and the
        # Metal backend — Apple clang provides neither on its own.
        buildArgs =
          "ARCH=${archBaseline}"
          + pkgs.lib.optionalString isDarwin " OMPDIR=${syntaraOmp} METAL=1";

        syntara = pkgs.stdenv.mkDerivation {
          pname = "syntara";
          version = syntaraVersion;
          src = ./.;

          nativeBuildInputs = with pkgs; [makeWrapper];

          # Compiler comes from stdenv (clang on Darwin, gcc on Linux); these add
          # only the extra build/runtime libs each platform needs.
          buildInputs = with pkgs;
            lib.optionals stdenv.hostPlatform.isDarwin [
              llvmPackages.openmp # libomp runtime for the OpenMP build
              apple-sdk_15 # SDK 15 headers enable the Metal residency-set path
            ]
            ++ lib.optionals stdenv.hostPlatform.isLinux [
              stdenv.cc.cc.lib # libgomp.so.1 in the runtime closure
            ];

          buildPhase = ''
            runHook preBuild
            # `make install` builds and stages every engine it produces —
            # the GLM engine (built as `glm` on POSIX, under the Makefile's
            # ENGINE_REAL), olmoe, and deepseek_v4 where SYNTARA_V4_SUPPORTED —
            # under $out/lib/syntara so the launcher's HERE-relative engine_for()
            # finds each (inkling/kimi_k3 aren't in `install` yet).
            make -C c install ${buildArgs} \
              DESTDIR=$out PREFIX= BINDIR=/bin LIBEXECDIR=/lib/syntara
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            # `make install` handled the engines, syntara and the support
            # modules; two fixups remain:

            # 1. `make install`'s file lists miss two things packaged Python
            #    needs: v4_dsml.py (openai_server.py imports it unconditionally,
            #    so `syntara serve` / `syntara web` would ModuleNotFoundError) and
            #    tools/iq3xxs_grid.json (iq3_pack.py loads it for `syntara convert
            #    --xbits e8`, with no fallback). Back them in — each guard
            #    defers to a future `make install` that stages them itself.
            [ -e "$out/lib/syntara/v4_dsml.py" ] || \
              install -m 644 c/v4_dsml.py "$out/lib/syntara/"
            [ -e "$out/lib/syntara/tools/iq3xxs_grid.json" ] || \
              install -m 644 c/tools/iq3xxs_grid.json "$out/lib/syntara/tools/"

            # 2. The launcher dispatches relative to its own dir, so it must sit
            #    beside the engines; that also frees $out/bin/syntara for the
            #    wrapper. On POSIX the GLM engine was installed as $out/lib/syntara/glm
            #    (the extensionless `syntara` path is the launcher), so moving the
            #    launcher next to it cannot overwrite anything.
            mv $out/bin/syntara $out/lib/syntara/syntara
            ln -s ../lib/syntara/syntara $out/bin/syntara

            # Wrap syntara through pythonEnv. SYNTARA_ENGINE is deliberately NOT set:
            # c/syntara's engine_for() routes EVERY model to GLM whenever
            # SYNTARA_ENGINE is present, defeating per-model dispatch. Left unset,
            # syntara resolves each engine beside itself (syntara / olmoe /
            # deepseek_v4 under $out/lib/syntara). PYTHONPATH makes `import
            # openai_server` / `resource_plan` / `doctor` / `v4_dsml` resolve.
            makeWrapper ${pythonEnv}/bin/python $out/bin/syntara \
              --add-flags "$out/lib/syntara/syntara" \
              --set PYTHONPATH "$out/lib/syntara:${pythonEnv}/${pkgs.python3.sitePackages}"
            runHook postInstall
          '';

          # `make test-c` isn't hermetic in a sandbox (test_ssd_probe timing,
          # Linux test_uring/io_uring); installCheckPhase validates instead.
          doCheck = false;

          # Offline verification that the multi-engine layout is correct: the
          # engines reached $out, the backfilled convert data asset is present,
          # the wrapper starts (`syntara --version` argparse-exits before any model
          # load), and the serve import surface (openai_server -> v4_dsml)
          # resolves. Not versionCheckHook: syntara's version string is
          # unrelated to this derivation's `version`.
          doInstallCheck = true;
          installCheckPhase = ''
            runHook preInstallCheck
            # An install check must not mutate $out; block the .pyc these imports write.
            export PYTHONDONTWRITEBYTECODE=1
            test -x $out/lib/syntara/syntara
            test -x $out/lib/syntara/glm
            test -x $out/lib/syntara/olmoe
            test -f $out/lib/syntara/tools/iq3xxs_grid.json
            $out/bin/syntara --version
            PYTHONPATH=$out/lib/syntara ${pythonEnv}/bin/python -c 'import openai_server'
            runHook postInstallCheck
          '';

          meta = with pkgs.lib; {
            description = "Run large MoE models (GLM-5.2, OLMoE, DeepSeek V4 Flash) in pure C, experts streamed from disk";
            homepage = "https://github.com/NoirDemons/Syntara";
            license = licenses.asl20;
            platforms = with platforms; linux ++ darwin;
            mainProgram = "syntara";
          };
        };
      in {
        packages = {
          default = syntara;
          inherit syntara;
        };

        apps = {
          default = {
            type = "app";
            program = pkgs.lib.getExe syntara;
          };
          # `nix run .#engine` runs the GLM engine binary directly, skipping the
          # launcher. The artifact is `glm` on POSIX (Makefile ENGINE_REAL).
          # Named "engine", not "syntara", so it doesn't shadow packages.syntara
          # (whose mainProgram is syntara).
          engine = {
            type = "app";
            program = "${syntara}/lib/syntara/glm";
          };
        };

        formatter = pkgs.alejandra;

        devShells.default = pkgs.mkShell {
          inputsFrom = [syntara];

          packages = with pkgs; [
            pythonEnv
            gcc
            gnumake
            clang-tools # clangd / clang-tidy for IDE support
            pkg-config
          ];

          shellHook = ''
            echo "🐦 Syntara dev shell"
            echo "  gcc: $(gcc --version | head -1)"
            echo "  python: $(python3 --version)"
            echo ""
            echo "Build the engine:   make -C c syntara"
            echo "Run the converter:  python c/syntara convert --model /path/to/glm52_i4"
            echo "Chat:               SYNTARA_MODEL=/path/to/glm52_i4 ./c/syntara ..."
          '';
        };
      }
    );
}
