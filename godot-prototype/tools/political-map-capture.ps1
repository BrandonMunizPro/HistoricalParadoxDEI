param([Parameter(Mandatory=$true)][string]$Stage,[switch]$Native)
$ErrorActionPreference='Stop'
if($Stage -notmatch '^[a-z0-9-]+$'){throw 'Invalid stage'}
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project ('evidence/political-map-20261029/'+$Stage)
if(Test-Path -LiteralPath $folder){throw 'Evidence stage exists'}
New-Item -ItemType Directory -Path $folder|Out-Null
$script='res://tools/political-map-profile.gd';$resolution='1920x1080'
if($Native){$script='res://tools/political-map-validate.gd';$resolution='960x540'}
$arguments=@('--path',$project,'--resolution',$resolution,'--script',$script,'--','--automation-input-lock',('--output=res://evidence/political-map-20261029/'+$Stage))
if($Stage -ne 'before'){$arguments+='--reference=res://evidence/political-map-20261029/before/performance.json'}
$p=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$handle=$p.Handle;$watch=[Diagnostics.Stopwatch]::StartNew();$peak=0L;$gpu=@()
while(-not $p.WaitForExit(1000)){
 $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($p.Id)"
 $ids=@($p.Id)+@($children|Where-Object {$_.Name -like 'Godot*'}|ForEach-Object {[int]$_.ProcessId})
 $ram=(Get-Process -Id $ids -ErrorAction SilentlyContinue|Measure-Object WorkingSet64 -Sum).Sum;$peak=[Math]::Max($peak,[long]$ram)
 $gpu+=@{elapsedMs=$watch.ElapsedMilliseconds;deviceWideCsv=@(nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu,clocks.gr,power.draw --format=csv,noheader)}
 if($watch.Elapsed.TotalSeconds -gt 600){$p.Kill();throw 'Timed out'}
}
@{peakWorkingSetBytes=$peak;gpuScope='Device-wide';arguments=$arguments;elapsedMs=$watch.ElapsedMilliseconds;exitCode=$p.ExitCode;gpuSamples=$gpu}|ConvertTo-Json -Depth 6|Set-Content "$folder/process.json"
Get-Content "$folder/run.log" -Tail 4
if($p.ExitCode -ne 0 -or (Select-String -LiteralPath "$folder/errors.log" -Pattern 'SCRIPT ERROR|^ERROR:|SHADER ERROR')){Get-Content "$folder/errors.log" -Tail 16;throw 'Capture failed'}
