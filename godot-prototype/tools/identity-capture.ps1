param([string]$Stage='after',[switch]$Baseline,[switch]$SwapCheck)
$ErrorActionPreference='Stop'
if($Stage -notmatch '^[a-z0-9-]+$'){throw 'Use a simple evidence stage name'}
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project ('evidence/settlement-identities-20261028/'+$Stage)
if(Test-Path -LiteralPath $folder){throw "Evidence folder already exists: $folder"}
New-Item -ItemType Directory -Path $folder|Out-Null
$script=if($SwapCheck){'res://tools/identity-swap-profile.gd'}else{'res://tools/identity-profile.gd'}
$arguments=@('--path',$project,'--resolution','1920x1080','--script',$script,'--','--roma-showcase','--settlement-development','--automation-input-lock',('--output=res://evidence/settlement-identities-20261028/'+$Stage))
if(-not $Baseline){$arguments+='--settlement-identities'}
$process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$nativeHandle=$process.Handle;$watch=[Diagnostics.Stopwatch]::StartNew();$peak=0L;$gpu=@()
while(-not $process.WaitForExit(1000)){
 $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
 $ids=@($process.Id)+@($children|Where-Object {$_.Name -like 'Godot*'}|ForEach-Object {[int]$_.ProcessId})
 $bytes=(Get-Process -Id $ids -ErrorAction SilentlyContinue|Measure-Object WorkingSet64 -Sum).Sum;$peak=[Math]::Max($peak,[long]$bytes)
 if(Get-Command nvidia-smi -ErrorAction SilentlyContinue){$gpu+=@{elapsedMs=$watch.ElapsedMilliseconds;deviceWideCsv=@(nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu,clocks.gr,power.draw --format=csv,noheader)}}
 if($watch.Elapsed.TotalSeconds -gt 480){$process.Kill();throw 'Capture timed out'}
}
@{peakWorkingSetBytes=$peak;gpuScope='Device-wide, includes other applications';runtimeArguments=$arguments;elapsedMs=$watch.ElapsedMilliseconds;exitCode=$process.ExitCode;gpuSamples=$gpu}|ConvertTo-Json -Depth 6|Set-Content "$folder/process.json"
Get-Content "$folder/run.log" -Tail 17
if($process.ExitCode -ne 0){throw 'Capture failed'}
if(Select-String -LiteralPath "$folder/errors.log" -Pattern 'SCRIPT ERROR|^ERROR:'){Get-Content "$folder/errors.log" -Tail 20;throw 'Godot reported an error'}
