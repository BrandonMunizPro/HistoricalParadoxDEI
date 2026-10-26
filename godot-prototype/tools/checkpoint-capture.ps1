param(
 [Parameter(Mandatory=$true)][string]$Stage,
 [string[]]$Views=@('greece','anatolia','egypt','east','alps','apennines','sicily'),
 [string[]]$Profiles=@(),
 [string[]]$Scales=@('overview','strategic','close'),
 [string]$SourceManifest='',
 [switch]$StaticWater,
 [switch]$ReferenceShaders,
 [switch]$NoTerrainShadows,
 [switch]$NoOverlap,
 [string]$ProfileFile='data/visual-views.json'
)
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$relative="evidence/repair-20261026/$Stage"
$folder=Join-Path $project $relative
if(Test-Path -LiteralPath $folder){throw "Evidence already exists: $folder"}
New-Item -ItemType Directory -Path $folder | Out-Null
Set-Content -LiteralPath (Join-Path $folder '.gdignore') -Value ''
$jobs=@()
foreach($view in $Views){$jobs+=@{name="production-$view";arguments=@('--production',"--view=$view")}}
foreach($captureRegion in $Profiles){foreach($scale in $Scales){$jobs+=@{name="profile-$captureRegion-$scale";arguments=@("--region=$captureRegion","--scale=$scale")}}}
foreach($job in $jobs){
 $name=$job.name
 $arguments=@('--path',$project,'--resolution','1920x1080','--script','res://tools/visual-capture.gd','--',"--capture=$name","--output=res://$relative")+$job.arguments
 if($StaticWater){$arguments+='--static-water'}
 if($ReferenceShaders){$arguments+='--reference-shaders'}
 if($NoTerrainShadows){$arguments+='--no-terrain-shadows'}
 if($NoOverlap){$arguments+='--no-overlap'}
 $arguments+="--profile-file=$ProfileFile"
 if($SourceManifest){$arguments+="--source-manifest=$SourceManifest"}
 $process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/$name-run.log" -RedirectStandardError "$folder/$name-errors.log" -PassThru
 $nativeHandle=$process.Handle
 if($nativeHandle -eq 0){throw "Could not acquire capture process handle: $name"}
 $watch=[Diagnostics.Stopwatch]::StartNew();$peak=0L
 while(-not $process.WaitForExit(250)){
  $children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"
  $ids=@($process.Id)+@($children | Where-Object {$_.Name -like 'Godot*'} | ForEach-Object {[int]$_.ProcessId})
  $bytes=(Get-Process -Id $ids -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum
  $peak=[Math]::Max($peak,[long]$bytes)
  if($watch.Elapsed.TotalSeconds -gt 180){$process.Kill();throw "Capture timed out: $name"}
  Start-Sleep -Milliseconds 250
 }
 $errors=Get-Content -LiteralPath "$folder/$name-errors.log"
 if($null -eq $process.ExitCode -or $process.ExitCode -ne 0 -or $errors){throw "Capture failed: $name $errors"}
 $metrics=Get-Content -Raw -LiteralPath "$folder/godot-$name.json" | ConvertFrom-Json
 if(-not $metrics.sceneryReadiness.ready){throw "Incomplete scenery: $name"}
 $expectedPath=if($name.StartsWith('production-')){'production'}else{'capture-profile'}
 if($metrics.cameraPath -ne $expectedPath){throw "Incorrect camera resolver: $name"}
 if(-not(Test-Path -LiteralPath "$folder/godot-$name.png")){throw "Missing image: $name"}
 @{sampledPeakWorkingSetBytes=$peak;intervalMs=250;scope='Console wrapper and direct Godot child';evidence=$metrics.evidence} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$folder/process-$name.json"
 Write-Output "$name completed; scenery=$($metrics.sceneryReadiness.instances)"
}
