use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use base64::Engine;
use tauri::Manager;

const CREATE_NO_WINDOW: u32 = 0x0800_0000;
const MAX_PDF_BYTES: usize = 5 * 1024 * 1024;
const SUMATRA_TIMEOUT: Duration = Duration::from_secs(60);

// Watches the default printer's queue. No user input is interpolated into it.
// Emits one JSON line: {printer, status, detail}
// status: printed | queued | error | not_seen
const WATCH_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
try {
  $p = (Get-CimInstance Win32_Printer | Where-Object { $_.Default }).Name
  if (-not $p) { @{printer=$null;status='error';detail='No default printer'} | ConvertTo-Json -Compress; exit }
  $base = @(Get-PrintJob -PrinterName $p -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
  $seen = @{}
  $deadline = (Get-Date).AddSeconds(45)
  $status = 'not_seen'; $detail = ''
  while ((Get-Date) -lt $deadline) {
    $jobs = @(Get-PrintJob -PrinterName $p -ErrorAction SilentlyContinue | Where-Object { $base -notcontains $_.Id })
    foreach ($j in $jobs) { $seen[$j.Id] = "$($j.JobStatus)" }
    $bad = $jobs | Where-Object { "$($_.JobStatus)" -match 'Error|Offline|PaperOut|UserIntervention|Blocked' }
    if ($bad) { $status = 'error'; $detail = "$(($bad | Select-Object -First 1).JobStatus)"; break }
    if ($seen.Count -gt 0 -and $jobs.Count -eq 0) { $status = 'printed'; break }
    if ($seen.Count -gt 0) { $status = 'queued'; $detail = ($seen.Values | Select-Object -First 1) }
    Start-Sleep -Milliseconds 200
  }
  @{printer=$p;status=$status;detail=$detail} | ConvertTo-Json -Compress
} catch {
  @{printer=$null;status='error';detail="$($_.Exception.Message)"} | ConvertTo-Json -Compress
}
"#;

fn spawn_watcher() -> std::io::Result<Child> {
    Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", WATCH_SCRIPT])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
}

fn sumatra_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("resource dir: {e}"))?;
    let p = dir.join("resources").join("SumatraPDF.exe");
    if p.exists() {
        return Ok(p);
    }
    let p = dir.join("SumatraPDF.exe");
    if p.exists() {
        Ok(p)
    } else {
        Err("print engine missing".into())
    }
}

fn run_sumatra(exe: &PathBuf, pdf: &PathBuf) -> Result<(), String> {
    let mut child = Command::new(exe)
        .args(["-print-to-default", "-silent", "-exit-when-done"])
        .arg(pdf)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("start print engine: {e}"))?;
    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(st)) if st.success() => return Ok(()),
            Ok(Some(st)) => return Err(format!("print engine failed ({st})")),
            Ok(None) if start.elapsed() > SUMATRA_TIMEOUT => {
                let _ = child.kill();
                return Err("print engine timed out".into());
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(100)),
            Err(e) => return Err(format!("print engine: {e}")),
        }
    }
}

fn print_blocking(app: tauri::AppHandle, pdf_base64: String) -> Result<serde_json::Value, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(pdf_base64.trim())
        .map_err(|_| "invalid pdf data".to_string())?;
    if bytes.len() > MAX_PDF_BYTES || !bytes.starts_with(b"%PDF") {
        return Err("invalid pdf data".into());
    }

    let exe = sumatra_path(&app)?;
    let pdf = std::env::temp_dir().join(format!("kollel-check-{}.pdf", std::process::id()));
    std::fs::write(&pdf, &bytes).map_err(|e| format!("write temp file: {e}"))?;

    let mut watcher = spawn_watcher().map_err(|e| format!("spooler watcher: {e}"))?;
    let printed = run_sumatra(&exe, &pdf);
    let _ = std::fs::remove_file(&pdf);

    if let Err(e) = printed {
        let _ = watcher.kill();
        return Err(e);
    }

    let out = watcher
        .wait_with_output()
        .map_err(|e| format!("spooler watcher: {e}"))?;
    let text = String::from_utf8_lossy(&out.stdout);
    let line = text.lines().rev().find(|l| l.trim_start().starts_with('{'));
    match line.and_then(|l| serde_json::from_str::<serde_json::Value>(l).ok()) {
        Some(v) => Ok(v),
        None => Ok(serde_json::json!({"printer": null, "status": "not_seen", "detail": ""})),
    }
}

#[tauri::command]
pub async fn print_check(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    pdf_base64: String,
) -> Result<serde_json::Value, String> {
    if window.label() != "main" {
        return Err("forbidden".into());
    }
    tauri::async_runtime::spawn_blocking(move || print_blocking(app, pdf_base64))
        .await
        .map_err(|e| e.to_string())?
}
