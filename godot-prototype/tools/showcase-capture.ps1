param([ValidateSet('before','after','after-final','navigation','navigation-final','before-rendered','after-rendered','navigation-before-rendered','navigation-after-rendered','before-controlled','after-controlled','navigation-before-controlled','navigation-after-controlled','precinct-before','precinct-after','navigation-precinct-before','navigation-precinct-after','precinct-final','navigation-precinct-final','precinct-optimized','navigation-precinct-optimized')][string]$Stage='precinct-optimized')
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project ('evidence/roma-showcase-20261028/'+$Stage)
if(Test-Path -LiteralPath $folder){throw "Evidence folder already exists: $folder"}
New-Item -ItemType Directory -Path $folder|Out-Null
$script=if($Stage.StartsWith('navigation')){'res://tools/showcase-navigation.gd'}else{'res://tools/showcase-profile.gd'}
$arguments=@('--path',$project,'--resolution','1920x1080','--script',$script,'--','--automation-input-lock',('--output=res://evidence/roma-showcase-20261028/'+$Stage))
if(-not $Stage.Contains('before')){$arguments+='--roma-showcase'}
$process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$nativeHandle=$process.Handle;$watch=[Diagnostics.Stopwatch]::StartNew();$peak=0L;$gpu=@()
while(-not $process.WaitForExit(500)){
 $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
 $ids=@($process.Id)+@($children|Where-Object {$_.Name -like 'Godot*'}|ForEach-Object {[int]$_.ProcessId})
 $bytes=(Get-Process -Id $ids -ErrorAction SilentlyContinue|Measure-Object WorkingSet64 -Sum).Sum;$peak=[Math]::Max($peak,[long]$bytes)
 if(Get-Command nvidia-smi -ErrorAction SilentlyContinue){$gpu+=@{elapsedMs=$watch.ElapsedMilliseconds;deviceWideCsv=@(nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu,clocks.gr,power.draw --format=csv,noheader)}}
 if($watch.Elapsed.TotalSeconds -gt 300){$process.Kill();throw 'Capture timed out'}
}
@{peakWorkingSetBytes=$peak;scope='Console wrapper and direct Godot child';gpuScope='Device-wide, includes desktop and other applications';runtimeArguments=$arguments;elapsedMs=$watch.ElapsedMilliseconds;exitCode=$process.ExitCode;gpuSamples=$gpu}|ConvertTo-Json -Depth 6|Set-Content "$folder/process.json"
Get-Content "$folder/run.log" -Tail 5
if($process.ExitCode -ne 0){Get-Content "$folder/errors.log";throw 'Capture failed'}
if(Select-String -LiteralPath "$folder/errors.log" -Pattern 'SCRIPT ERROR|^ERROR:') {throw 'Godot reported an error; inspect errors.log'}
