# Downloads the pinned SumatraPDF portable build used for silent check printing.
$ErrorActionPreference = 'Stop'
$version = '3.5.2'
$zipSha256 = '66CCB395C9184DCE6822DFBB9970C877383B3EAD6D9417B5106A844AAC512989'
$dest = Join-Path $PSScriptRoot '..\src-tauri\resources'
$target = Join-Path $dest 'SumatraPDF.exe'
if (Test-Path $target) { Write-Host "Already present: $target"; return }

New-Item -ItemType Directory -Force $dest | Out-Null
$zip = Join-Path $env:TEMP "sumatra-$version.zip"
Invoke-WebRequest "https://www.sumatrapdfreader.org/dl/rel/$version/SumatraPDF-$version-64.zip" -OutFile $zip
if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $zipSha256) { throw 'SumatraPDF checksum mismatch' }
$tmp = Join-Path $env:TEMP "sumatra-$version"
Expand-Archive $zip $tmp -Force
Move-Item (Join-Path $tmp "SumatraPDF-$version-64.exe") $target
Write-Host "Installed $target"
