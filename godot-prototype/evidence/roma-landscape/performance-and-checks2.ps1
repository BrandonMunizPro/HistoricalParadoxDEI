$ErrorActionPreference='Stop'
$project=(Resolve-Path "$PSScriptRoot/../..").Path
$g='C:/Users/brand/tools/godot/4.7.2-stable/Godot_v4.7.2-stable_win64_console.exe'
foreach($mode in @('baseline','landscape')) {
 $folder=Join-Path $PSScriptRoot "navigation2-$mode"
 if(Test-Path -LiteralPath $folder){throw "Evidence already exists: $folder"}
 New-Item -ItemType Directory -Path $folder | Out-Null
 Set-Content -LiteralPath "$folder/.gdignore" ''
 $argsList=@('--path',$project,'--resolution','1920x1080','--script','res://tools/roma-profile.gd','--',"--output=res://evidence/roma-landscape/navigation2-$mode",'--source-manifest=res://evidence/roma-landscape/final2-source.json')
 if($mode -eq 'baseline'){$argsList+='--roma-landscape-baseline'}
 $gpuBefore=@(nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,clocks.gr,power.draw --format=csv)
 $p=Start-Process $g -ArgumentList $argsList -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
 $handle=$p.Handle; $peak=0L; $clock=[Diagnostics.Stopwatch]::StartNew()
 while(-not $p.WaitForExit(250)){
  $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($p.Id)"
  $ids=@($p.Id)+@($children | Where-Object {$_.Name -like 'Godot*'} | ForEach-Object {[int]$_.ProcessId})
  $bytes=(Get-Process -Id $ids -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum
  $peak=[Math]::Max($peak,[long]$bytes)
  if($clock.Elapsed.TotalSeconds -gt 300){$p.Kill();throw "Navigation timed out: $mode"}
 }
 $gpuAfter=@(nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,clocks.gr,power.draw --format=csv)
 @{sampledPeakWorkingSetBytes=$peak;scope='Console wrapper and direct Godot child';sampleInterval='250 ms wait plus CIM/process query overhead';gpuAtStart=$gpuBefore;gpuAtEnd=$gpuAfter} | ConvertTo-Json -Depth 5 | Set-Content "$folder/process.json"
 if($p.ExitCode -ne 0 -or (Get-Item "$folder/errors.log").Length){throw "Navigation failed: $mode"}
 if(-not(Test-Path "$folder/navigation.json")){throw 'Missing navigation results'}
 Write-Output "Roma navigation completed: $mode"
}
& "$PSScriptRoot/run-checks2.ps1"
if($LASTEXITCODE -ne 0){throw 'Godot validation failed'}




