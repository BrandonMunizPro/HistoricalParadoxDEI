param(
 [Parameter(Mandatory=$true)][string]$Stage,
 [string[]]$Regions=@('alps','apennines','sicily','pyrenees','greece','anatolia','egypt','atlas','zagros','east'),
 [string[]]$Scales=@('overview','strategic','close'),
 [switch]$StaticWater
)
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project "evidence\visual-$Stage"
if(Test-Path -LiteralPath $folder){throw "Use a new stage name; evidence already exists: $folder"}
New-Item -ItemType Directory -Path $folder | Out-Null
Set-Content -LiteralPath (Join-Path $folder '.gdignore') -Value ''
foreach($region in $Regions){foreach($scale in $Scales){
 $name="$region-$scale"
 $arguments=@('--path',$project,'--resolution','1920x1080','--script','res://tools/visual-capture.gd','--',"--capture=$name","--region=$region","--scale=$scale","--output=res://evidence/visual-$Stage")
 if($StaticWater){$arguments+='--static-water'}
 $process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder\$name-run.log" -RedirectStandardError "$folder\$name-errors.log" -PassThru
 $peak=0L
 $watch=[Diagnostics.Stopwatch]::StartNew()
 while(-not $process.HasExited){
  $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
  $ids=@($process.Id)+@($children | Where-Object {$_.Name -like 'Godot*'} | ForEach-Object {[int]$_.ProcessId})
  $bytes=(Get-Process -Id $ids -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum
  $peak=[Math]::Max($peak,[long]$bytes)
  if($watch.Elapsed.TotalSeconds -gt 150){$process.Kill();throw "Capture timed out: $name"}
  Start-Sleep -Milliseconds 250
 }
 $process.Refresh()
 $errors=Get-Content -LiteralPath "$folder\$name-errors.log"
 if(($null -ne $process.ExitCode -and $process.ExitCode -ne 0) -or $errors){throw "Capture failed: $name $errors"}
 if(-not(Test-Path -LiteralPath "$folder\godot-$name.png")){throw "Missing image: $name"}
 @{sampledPeakWorkingSetBytes=$peak;scope='Console wrapper and direct Godot child';intervalMs=250}|ConvertTo-Json|Set-Content "$folder\process-$name.json"
 Get-Content -LiteralPath "$folder\$name-run.log" -Tail 1
}}
