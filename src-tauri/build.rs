use tauri_build::{AppManifest, Attributes};

fn main() {
    println!("cargo:rerun-if-env-changed=KIOSK_EXIT_PASSWORD_HASH");

    // A release build without an exit password hash would be impossible to close.
    if std::env::var("PROFILE").as_deref() == Ok("release")
        && std::env::var("KIOSK_EXIT_PASSWORD_HASH").is_err()
    {
        panic!(
            "KIOSK_EXIT_PASSWORD_HASH must be set for release builds. \
             Generate one with: cargo run --bin hash-password -- <password>"
        );
    }

    // Only the commands listed here exist as permissions; the capability file
    // grants them to specific windows only.
    tauri_build::try_build(
        Attributes::new().app_manifest(AppManifest::new().commands(&["verify_exit"])),
    )
    .expect("failed to run tauri-build");
}
