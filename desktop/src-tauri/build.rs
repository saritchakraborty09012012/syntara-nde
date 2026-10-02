fn main() {
    tauri_build::build();
    embed_comctl32_v6_manifest_for_tests();
}

// `tauri_build` embeds the common-controls v6 manifest only into the final
// binary (via tauri-winres' resource.rc). Unit-test binaries get no resource
// section, so their static import of `TaskDialogIndirect` (pulled in by
// tauri-plugin-dialog) resolves against comctl32 v5, which does not export it,
// and the test harness dies with STATUS_ENTRYPOINT_NOT_FOUND before main().
// Embed the same manifest into test targets: link flags for MSVC, a
// windres-compiled resource object for GNU.
fn embed_comctl32_v6_manifest_for_tests() {
    let Ok(target_os) = std::env::var("CARGO_CFG_TARGET_OS") else {
        return;
    };
    if target_os != "windows" {
        return;
    }
    let target_env = std::env::var("CARGO_CFG_TARGET_ENV").unwrap_or_default();
    let out_dir = std::path::PathBuf::from(std::env::var_os("OUT_DIR").expect("OUT_DIR"));
    let manifest = out_dir.join("comctl32-v6.manifest");
    std::fs::write(&manifest, MANIFEST_XML).expect("write comctl32 v6 manifest");

    if target_env == "msvc" {
        println!("cargo::rustc-link-arg-tests=/MANIFEST:EMBED");
        println!(
            "cargo::rustc-link-arg-tests=/MANIFESTINPUT:{}",
            manifest.display()
        );
        return;
    }

    // GNU: compile the manifest as an RT_MANIFEST resource and link the object
    // into every test binary. Forward slashes keep the rc string portable.
    let rc = out_dir.join("test-manifest.rc");
    let obj = out_dir.join("test-manifest.o");
    let manifest_s = manifest.to_string_lossy().replace('\\', "/");
    std::fs::write(&rc, format!("1 24 \"{manifest_s}\"\n")).expect("write manifest rc");
    let rc_s = rc.to_string_lossy().into_owned();
    let obj_s = obj.to_string_lossy().into_owned();

    let mut last_err = String::new();
    for windres in ["windres", "x86_64-w64-mingw32-windres"] {
        let status = std::process::Command::new(windres)
            .args(["-i", rc_s.as_str(), "-O", "coff", "-o", obj_s.as_str()])
            .status();
        match status {
            Ok(s) if s.success() => {
                println!("cargo::rustc-link-arg-tests={}", obj.display());
                return;
            }
            Ok(s) => last_err = format!("{windres} exited with {s}"),
            Err(e) => last_err = format!("{windres} not runnable: {e}"),
        }
    }
    panic!(
        "cannot embed the comctl32 v6 manifest into test binaries ({last_err}); \
         install MinGW binutils (windres) or run tests with the MSVC toolchain"
    );
}

const MANIFEST_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <dependency>
    <dependentAssembly>
      <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
    </dependentAssembly>
  </dependency>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="asInvoker" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
"#;
