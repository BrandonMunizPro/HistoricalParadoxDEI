param([Parameter(Mandatory=$true)][string]$Stage,[string]$Only='',[int]$Samples=300,[switch]$StrategicOff,[switch]$Native)
$ErrorActionPreference='Stop'
if($Stage -notmatch '^[a-z0-9-]+$'){throw 'Invalid stage name'}
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project ('evidence/strategic-ocean-20261029/'+$Stage)
if(Test-Path -LiteralPath $folder){throw "Evidence exists: $folder"}
New-Item -ItemType Directory -Path $folder|Out-Null
$arguments=@('--path',$project,'--resolution','1920x1080','--script','res://tools/strategic-ocean-profile.gd','--','--settlement-development','--settlement-identities','--automation-input-lock',('--output=res://evidence/strategic-ocean-20261029/'+$Stage),('--samples='+$Samples))
if($Native){$arguments[3]='960x540';$arguments[5]='res://tools/strategic-ocean-review.gd'}
if($Only){$arguments+=('--only='+$Only)}
if($StrategicOff){$arguments+='--strategic-off'}
if($Stage -ne 'before'){$arguments+='--reference=res://evidence/strategic-ocean-20261029/before/performance.json'}
$process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$handle=$process.Handle;$watch=[Diagnostics.Stopwatch]::StartNew();$peak=0L;$gpu=@()
while(-not $process.WaitForExit(1000)){
 $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
 $ids=@($process.Id)+@($children|Where-Object {$_.Name -like 'Godot*'}|ForEach-Object {[int]$_.ProcessId})
 $ram=(Get-Process -Id $ids -ErrorAction SilentlyContinue|Measure-Object WorkingSet64 -Sum).Sum;$peak=[Math]::Max($peak,[long]$ram)
 $gpu+=@{elapsedMs=$watch.ElapsedMilliseconds;deviceWideCsv=@(nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu,clocks.gr,power.draw --format=csv,noheader)}
 if($watch.Elapsed.TotalSeconds -gt 600){$process.Kill();throw 'Capture timeout'}
}
@{peakWorkingSetBytes=$peak;gpuScope='Device-wide';arguments=$arguments;elapsedMs=$watch.ElapsedMilliseconds;exitCode=$process.ExitCode;gpuSamples=$gpu}|ConvertTo-Json -Depth 6|Set-Content "$folder/process.json"
Get-Content "$folder/run.log" -Tail 4
if($process.ExitCode -ne 0 -or (Select-String -LiteralPath "$folder/errors.log" -Pattern 'SCRIPT ERROR|^ERROR:|SHADER ERROR')){Get-Content "$folder/errors.log" -Tail 20;throw 'Capture failed'}
