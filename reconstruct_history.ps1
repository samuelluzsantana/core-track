$historyPath = ".history"
$files = Get-ChildItem -Path $historyPath -Recurse -File
$fileData = @()
foreach ($f in $files) {
    if ($f.Name -match '_(\d{14})') {
        $origPath = ($f.FullName.Substring((Resolve-Path $historyPath).Path.Length + 1)) -replace '_(\d{14})',''
        $fileData += [PSCustomObject]@{
            Path = $f.FullName
            Timestamp = $matches[1]
            OrigRelPath = $origPath
        }
    }
}
$fileData = $fileData | Sort-Object Timestamp

$oldestFiles = @{}
foreach ($item in $fileData) {
    if (-not $oldestFiles.ContainsKey($item.OrigRelPath)) {
        $oldestFiles[$item.OrigRelPath] = $item.Path
    }
}
foreach ($key in $oldestFiles.Keys) {
    $dir = Split-Path $key
    if ($dir -ne "" -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Copy-Item $oldestFiles[$key] -Destination $key -Force
}

git init
git config user.name "Antigravity"
git config user.email "bot@antigravity.google"
git add .
git commit -m "v0: Initial base from oldest history files"

$version = 1
foreach ($item in $fileData) {
    Copy-Item $item.Path -Destination $item.OrigRelPath -Force
    git add $item.OrigRelPath
    if ((git status --porcelain) -ne "") {
        git commit -m "v${version}: Update $($item.OrigRelPath) at $($item.Timestamp)"
        $version++
    }
}

$backupFiles = @('tailwind.config.js', 'src/index.css', 'src/pages/Home.tsx', 'src/App.tsx', '.cursorrules', '.github/chatmodes/frontend-design.chatmode.md')
foreach ($f in $backupFiles) {
    $src = Join-Path ".history_backup" (Split-Path $f -Leaf)
    if (Test-Path $src) { Copy-Item $src -Destination $f -Force }
}
git add .
if ((git status --porcelain) -ne "") {
    git commit -m "v${version}: Latest state"
}
