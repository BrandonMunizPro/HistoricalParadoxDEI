$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project 'evidence/visual-reset-20261028/baseline'
New-Item -ItemType Directory -Force -Path $folder|Out-Null
$arguments=@('--path',$project,'--resolution','1920x1080','--script','res://tools/reset-profile.gd')
$process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$nativeHandle=$process.Handle
$peak=0L;$gpu=@();$watch=[Diagnostics.Stopwatch]::StartNew()
while(-not $process.WaitForExit(500)){
 $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
 $ids=@($process.Id)+@($children|Where-Object {$_.Name -like 'Godot*'}|ForEach-Object {[int]$_.ProcessId})
 $bytes=(Get-Process -Id $ids -ErrorAction SilentlyContinue|Measure-Object WorkingSet64 -Sum).Sum
 $peak=[Math]::Max($peak,[long]$bytes)
 if(Get-Command nvidia-smi -ErrorAction SilentlyContinue){$gpu+=@{elapsedMs=$watch.ElapsedMilliseconds;csv=@(nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu,clocks.gr,power.draw --format=csv,noheader)}}
 if($watch.Elapsed.TotalSeconds -gt 240){$process.Kill();throw 'Audit capture timed out'}
}
@{peakWorkingSetBytes=$peak;scope='Console wrapper and direct Godot child';gpuScope='Device-wide, includes desktop and other applications; not process VRAM';gpuSamples=$gpu;elapsedMs=$watch.ElapsedMilliseconds;exitCode=$process.ExitCode}|ConvertTo-Json -Depth 6|Set-Content "$folder/process.json"
Get-Content "$folder/errors.log"
Get-Content "$folder/run.log" -Tail 5
if($process.ExitCode -ne 0){throw 'Audit capture failed'}
