param([string]$GodotPath = 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe')
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
foreach ($view in @('overview','sicily','etna','catana')) {
    $process = Start-Process -FilePath $GodotPath -ArgumentList @('--path', $project, '--resolution', '1920x1080', '--', "--capture=$view") -WindowStyle Hidden -RedirectStandardOutput "$project\evidence\$view-run.log" -RedirectStandardError "$project\evidence\$view-errors.log" -PassThru
    $peakBytes = 0L
    while (-not $process.HasExited) {
        $process.Refresh()
        $engineBytes = (Get-Process -Name 'Godot_v4.7.2-stable_win64*' -ErrorAction SilentlyContinue | Measure-Object -Property WorkingSet64 -Sum).Sum
        $peakBytes = [Math]::Max($peakBytes, [long]$engineBytes)
        Start-Sleep -Milliseconds 200
    }
    if ($process.ExitCode -and $process.ExitCode -ne 0) { throw "Godot failed: $view" }
    @{ sampledPeakWorkingSetBytes = $peakBytes; intervalMs = 200; view = $view; scope = 'Godot runtime plus console wrapper; sum of process working sets' } | ConvertTo-Json | Set-Content -LiteralPath "$project\evidence\process-$view.json"
    Get-Content -LiteralPath "$project\evidence\$view-run.log" -Tail 2
    $errors = Get-Content -LiteralPath "$project\evidence\$view-errors.log"
    if ($errors) { Write-Output $errors }
}
