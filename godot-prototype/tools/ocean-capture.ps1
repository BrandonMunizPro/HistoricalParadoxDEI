param([string]$Stage='after',[switch]$Baseline,[switch]$Quick,[switch]$Sustain,[switch]$Ground,[switch]$Surface,[string]$Quality='balanced',[int]$Samples=0,[switch]$Freeze,[string]$Only='')
$ErrorActionPreference='Stop'
if($Stage -notmatch '^[a-z0-9-]+$'){throw 'Use a simple stage name'}
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project ('evidence/ocean-20261028/'+$Stage)
if(Test-Path -LiteralPath $folder){throw "Evidence already exists: $folder"}
New-Item -ItemType Directory -Path $folder|Out-Null
$arguments=@('--path',$project,'--resolution','1920x1080','--script','res://tools/ocean-profile.gd','--','--settlement-development','--settlement-identities','--automation-input-lock',('--output=res://evidence/ocean-20261028/'+$Stage))
if($Baseline){$arguments+='--legacy-ocean'}else{$arguments+=@('--reference-before=res://evidence/ocean-20261028/before/performance.json')}
if($Quick){$arguments+='--quick'}
if($Surface){$arguments+='--surface'}
$arguments+=('--ocean-quality='+$Quality)
if($Samples -gt 0){$arguments+=('--samples='+$Samples)}
if($Freeze){$arguments+='--freeze-ocean'}
if($Only){$arguments+=('--only='+$Only)}
if($Sustain){$arguments+='--sustain'}

$process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$handle=$process.Handle;$watch=[Diagnostics.Stopwatch]::StartNew();$peak=0L;$gpu=@()
while(-not $process.WaitForExit(1000)){
 $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
 $ids=@($process.Id)+@($children|Where-Object {$_.Name -like 'Godot*'}|ForEach-Object {[int]$_.ProcessId})
 $ram=(Get-Process -Id $ids -ErrorAction SilentlyContinue|Measure-Object WorkingSet64 -Sum).Sum;$peak=[Math]::Max($peak,[long]$ram)
 if(Get-Command nvidia-smi -ErrorAction SilentlyContinue){$gpu+=@{elapsedMs=$watch.ElapsedMilliseconds;deviceWideCsv=@(nvidia-smi --query-gpu=memory.used,utilization.gpu,temperature.gpu,clocks.gr,power.draw --format=csv,noheader)}}
 if($watch.Elapsed.TotalSeconds -gt 600){$process.Kill();throw 'Capture timed out'}
}
@{peakWorkingSetBytes=$peak;gpuScope='Device-wide';arguments=$arguments;elapsedMs=$watch.ElapsedMilliseconds;exitCode=$process.ExitCode;gpuSamples=$gpu}|ConvertTo-Json -Depth 6|Set-Content "$folder/process.json"
Get-Content "$folder/run.log" -Tail 7
if($process.ExitCode -ne 0){throw 'Capture failed'}
if(Select-String -LiteralPath "$folder/errors.log" -Pattern 'SCRIPT ERROR|^ERROR:'){Get-Content "$folder/errors.log" -Tail 20;throw 'Godot reported errors'}
