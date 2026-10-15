#[cfg(windows)]
mod print;

use argon2::password_hash::{PasswordHash, PasswordVerifier};
use argon2::Argon2;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

const EXIT_WINDOW: &str = "exit";
const MAX_FAILURES_BEFORE_LOCKOUT: u32 = 5;

// Compiled in at build time; never shipped to the frontend.
const EXIT_PASSWORD_HASH: Option<&str> = option_env!("KIOSK_EXIT_PASSWORD_HASH");

#[derive(Default)]
struct AttemptState {
    failures: u32,
    locked_until: Option<Instant>,
}

#[tauri::command]
fn verify_exit(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    password: String,
    state: tauri::State<Mutex<AttemptState>>,
) -> Result<(), String> {
    // Defense in depth: only the exit prompt may call this.
    if window.label() != EXIT_WINDOW {
        return Err("forbidden".into());
    }

    let mut s = state.lock().map_err(|_| "internal error".to_string())?;
    if let Some(until) = s.locked_until {
        let now = Instant::now();
        if now < until {
            return Err(format!("locked:{}", (until - now).as_secs() + 1));
        }
        s.locked_until = None;
    }

    let ok = EXIT_PASSWORD_HASH
        .and_then(|h| PasswordHash::new(h).ok())
        .map(|parsed| {
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok()
        })
        .unwrap_or(false);

    if ok {
        s.failures = 0;
        drop(s);
        app.exit(0);
        return Ok(());
    }

    s.failures += 1;
    if s.failures >= MAX_FAILURES_BEFORE_LOCKOUT {
        let over = s.failures - MAX_FAILURES_BEFORE_LOCKOUT;
        let secs = 30u64.saturating_mul(1u64 << over.min(6)).min(900);
        s.locked_until = Some(Instant::now() + Duration::from_secs(secs));
        return Err(format!("locked:{secs}"));
    }
    Err("invalid".into())
}

fn show_exit_prompt(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window(EXIT_WINDOW) {
        let _ = w.set_focus();
        return;
    }
    let Some(main) = app.get_webview_window("main") else {
        return;
    };
    let built = WebviewWindowBuilder::new(app, EXIT_WINDOW, WebviewUrl::App("kiosk-exit.html".into()))
        .title("Exit")
        .inner_size(380.0, 220.0)
        .resizable(false)
        .minimizable(false)
        .maximizable(false)
        .always_on_top(true)
        .center()
        .parent(&main)
        .and_then(|b| b.build());
    if let Err(e) = built {
        eprintln!("failed to open exit prompt: {e}");
    }
}

pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AttemptState::default()))
        .invoke_handler({
            #[cfg(windows)]
            {
                tauri::generate_handler![verify_exit, print::print_check]
            }
            #[cfg(not(windows))]
            {
                tauri::generate_handler![verify_exit]
            }
        })
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_process::init())?;
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Closing the prompt just dismisses it. The main window requires the
                // exit password whenever a hash was compiled in (always in release;
                // in dev only if KIOSK_EXIT_PASSWORD_HASH is set).
                if window.label() != EXIT_WINDOW && EXIT_PASSWORD_HASH.is_some() {
                    api.prevent_close();
                    show_exit_prompt(window.app_handle());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
