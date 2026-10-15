# Windows Kiosk (Tauri) – How to use

The `student_portal` Nuxt app can be wrapped as a Windows kiosk app with Tauri 2 (Rust).
The Tauri project lives in `student_portal/src-tauri/`. The normal browser workflow is unchanged.

The wrapped app talks to the existing backend using the same API endpoints and token authentication.
Rust makes no API calls and holds no API credentials.

If there is no internet connection, the installed app still loads because the frontend is bundled into
the executable. It shows an offline banner and keeps retrying automatically while the network is down.

## Browser development (unchanged)

```bash
npm run dev        # http://localhost:3000, SSR as before
npm run build      # normal web build
npm run generate   # normal static web build
```

Tauri is never involved in these commands.

## How the kiosk build differs

| | Browser | Kiosk (Tauri) |
|---|---|---|
| Rendering | SSR (default) | SPA, `ssr: false` only when `KIOSK_BUILD=1` |
| Dev command | `npm run dev` | `npm run tauri dev` |
| Production | Any web host | `.output/public` bundled into the exe |

`KIOSK_BUILD=1` is set only by the `kiosk:dev` and `kiosk:generate` scripts, which Tauri calls for you.

## Prerequisites (build machine)

- Windows 10/11 x64
- Node.js and `npm install` done in `student_portal`
- Rust (stable) via rustup
- Visual Studio Build Tools with "Desktop development with C++"
- WebView2 Runtime (included in Windows 11; the installer also handles it on Windows 10)
- SumatraPDF print engine: run `powershell -File scripts\fetch-sumatra.ps1` once (downloads a pinned, checksum-verified copy into `src-tauri\resources\`, which is git-ignored). Required for `tauri dev` and `tauri build`.

If `cargo` fails with `CRYPT_E_NO_REVOCATION_CHECK` on a restricted network, set
`$env:CARGO_HTTP_CHECK_REVOKE = "false"` for that session.

## Check printing and print confirmation

In the kiosk, generated checks are printed **silently to the Windows default printer** (no print dialog) by the bundled SumatraPDF (GPLv3, run as a separate program). The app then watches the printer's Windows spooler queue and shows one of:

- **Sent to the printer** – the job reached the spooler and finished leaving the queue.
- **In the printer queue** – the job is queued but not finished (e.g. printer busy).
- **Failure / not confirmed** – printer error/offline/paper, no default printer, or no spooler job was seen. The user is asked whether to print again (the check is already generated, so the same PDF is reprinted).

"Sent to the printer" means the Windows spooler handed the job to the printer; Windows cannot confirm the paper physically came out. In a normal browser (`npm run dev`) the old print dialog is used, followed by a "Did the check print correctly?" prompt.

Set the intended printer as the Windows **default printer** on every kiosk. Only the main window may call the native `print_check` command.

## API URL

The API URL is `API_URL`, read in `nuxt.config.ts`. It defaults to `https://api.kollelsys.com/api`.
It is fixed at build time:

```powershell
$env:API_URL = "https://your-server.example/api"
```

If you change the API host, also update the `connect-src` and `img-src` origins in
`src-tauri/tauri.conf.json`, otherwise the app's CSP will block the requests.

## Run in development

```bash
npm run tauri dev
```

Starts the kiosk-mode Nuxt dev server and opens it in a Tauri window. If `KIOSK_EXIT_PASSWORD_HASH` is
not set, the window closes normally. If it is set, the exit password is enforced in dev too.

## Exit password

When a password hash is compiled in (always for release builds), the window cannot be closed normally. A close attempt (Alt+F4 and similar) opens a
password prompt. The correct password exits the app.

- The password is verified in Rust against an Argon2 hash compiled into the exe.
- The password and hash are never in the Vue bundle.
- After 5 wrong attempts the prompt locks out for 30 seconds, doubling on each further failure up to 15 minutes.
- Only the prompt window may call the verification command. The main window has no Tauri permissions.

### 1. Generate the hash

```powershell
cd student_portal\src-tauri
cargo run -q --bin hash-password -- "YourRealPassword"
```

It prints a string starting with `$argon2id$...`.

### 2. Build with the hash

Use single quotes so PowerShell does not expand the `$` characters:

```powershell
$env:KIOSK_EXIT_PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$...'
```

A release build fails if this variable is missing.
Changing the password means rebuilding and reinstalling.

## Build the installer

```powershell
cd student_portal
$env:KIOSK_EXIT_PASSWORD_HASH = '<your hash>'
$env:TAURI_SIGNING_PRIVATE_KEY = 'C:\Users\<you>\.tauri\kollel-student-kiosk.key'
npm run tauri build
```

Output: `src-tauri\target\release\bundle\nsis\KollelSys Student Kiosk_<version>_x64-setup.exe`

- The installer is per-machine, so installing needs administrator rights.
- The build also emits `KollelSys Student Kiosk_<version>_x64-setup.exe.sig`, which is the updater signature for the installer.
- The updater signing public key is embedded in `src-tauri/tauri.conf.json`.
- The private key is **not** in git. It was generated locally at `C:\Users\FizzData\.tauri\kollel-student-kiosk.key`. Keep it secret and back it up securely. If you lose it, existing installed apps will no longer trust future updates.
- The installer is not Authenticode code-signed yet. Windows SmartScreen will warn until it is signed with a Windows code-signing certificate.
- Bump `version` in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` for each release.

## Automatic updater

The Windows app now checks for updates on startup when it is running inside Tauri and there is an
internet connection.

- If the backend says an update is available, the app prompts the user to install it.
- If the user accepts, the installer is downloaded, verified against the embedded public key and installed.
- The app then restarts itself.
- If the update endpoint returns `404` or another non-2xx status, the app silently skips the update.

Configured endpoint template:

```text
https://api.kollelsys.com/api/student-portal/desktop-updates/{{target}}/{{arch}}/{{current_version}}
```

Expected variables:

- `{{target}}` → `windows`
- `{{arch}}` → `x86_64` on current Windows builds
- `{{current_version}}` → current app version, for example `0.1.0`

See [update-endpoint-spec.md](./update-endpoint-spec.md) for the backend response format.

## Data stored on the device

The org PIN, token cookie and other values are stored by the WebView2 profile exactly as in a browser
(`localStorage` and cookies). This data is separate from the browser's. It lives under the app's data
folder in `%LOCALAPPDATA%\com.kollelsys.student.kiosk` and should survive restarts (not yet verified).

## Lockdown: what the app does and what it does not

The app is fullscreen, has no window chrome, asks for a password to close, and exposes almost no native
commands. **This does not stop a user from using Alt+Tab, Ctrl+Alt+Del, the Windows key and so on.**
Real lockdown must come from Windows itself.

Requirements for a locked-down device:

- **Windows 10/11 Pro, Enterprise or Education.** Assigned Access is not available on Home.
- Administrator access to provision the device.
- A dedicated standard (non-admin) local account for the kiosk.

Recommended manual setup (no scripts are provided yet):

1. Install the app as an administrator.
2. Create a standard local user, for example `kiosk`.
3. Settings > Accounts > Other users > Set up a kiosk. Choose that user and the
   "KollelSys Student Kiosk" app.
4. Test that the kiosk user cannot reach the desktop, Task Manager or Settings.

Not implemented, and needs separate approval before being added:

- Registry or Group Policy changes (disabling Task Manager, Win-key shortcuts and so on)
- Automatic sign-in
- Shell Launcher configuration scripts

## Not included yet

- Android build and Lock Task Mode
- Windows code signing

## Troubleshooting

| Problem | Fix |
|---|---|
| Release build panics about `KIOSK_EXIT_PASSWORD_HASH` | Set the variable (see above) |
| Cannot exit the app | The password does not match the hash compiled in. Rebuild with the right hash |
| Blank window or blocked requests | Check the API origin against the CSP in `tauri.conf.json` |
| App never offers an update | Check that the endpoint returns HTTP 200 with the JSON described in `update-endpoint-spec.md` and that the installer `.sig` file content is copied into the response |
| `cargo` network or certificate errors | Set `CARGO_HTTP_CHECK_REVOKE=false` for the session |
| Port 3000 busy when running `tauri dev` | Stop the other dev server, because `devUrl` expects `localhost:3000` |
