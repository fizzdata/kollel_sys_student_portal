# Windows updater endpoint spec

The kiosk app uses the Tauri 2 updater plugin on Windows. On startup it requests:

```text
GET https://api.kollelsys.com/api/student-portal/desktop-updates/{{target}}/{{arch}}/{{current_version}}
```

Example with current values:

```text
GET https://api.kollelsys.com/api/student-portal/desktop-updates/windows/x86_64/0.1.0
```

## Request semantics

- `target` is `windows`
- `arch` is usually `x86_64`
- `current_version` is the installed app version from `src-tauri/tauri.conf.json`

If there is **no update**, return a non-2xx status such as `204` or `404`.
The Tauri updater only continues to the next endpoint when it receives a non-2xx response, so a
non-2xx response is the correct "no update" signal for this single-endpoint setup.

If there **is** an update, return HTTP `200` with JSON in this shape:

```json
{
  "version": "0.1.1",
  "notes": "Optional release notes shown to the user.",
  "pub_date": "2026-10-15T00:45:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://api.kollelsys.com/storage/kiosk/KollelSys Student Kiosk_0.1.1_x64-setup.exe",
      "signature": "<contents of the .sig file>"
    }
  }
}
```

## Required fields

- `version`: valid semver, for example `0.1.1`
- `platforms.windows-x86_64.url`: HTTPS URL to the installer
- `platforms.windows-x86_64.signature`: the exact text contents of the generated `.sig` file

`notes` and `pub_date` are optional but recommended.

## Version comparison

Tauri compares semver normally.

- `0.1.1` updates `0.1.0`
- `0.1.0` does not update `0.1.0`
- downgrades are ignored unless a custom server-side flow is added later

For the first version, keep normal ascending semver and do not attempt rollback logic yet.

## Artifact generation

Build with:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = 'C:\Users\<you>\.tauri\kollel-student-kiosk.key'
$env:KIOSK_EXIT_PASSWORD_HASH = '<argon2 hash>'
$env:API_URL = 'https://api.kollelsys.com/api'
npm run tauri build
```

The build currently emits:

- `src-tauri\target\release\bundle\nsis\KollelSys Student Kiosk_<version>_x64-setup.exe`
- `src-tauri\target\release\bundle\nsis\KollelSys Student Kiosk_<version>_x64-setup.exe.sig`

The backend should publish the `.exe` at the `url` and copy the raw `.sig` file content into
`platforms.windows-x86_64.signature`.

## Signature verification

- The app embeds the updater public key in `src-tauri/tauri.conf.json`
- The installer is downloaded over HTTPS
- Tauri verifies the installer against the embedded public key before installation
- If signature verification fails, the update is rejected

Do not modify or re-sign the installer after the `.sig` file is created. The signature must match the
exact bytes served to the app.
