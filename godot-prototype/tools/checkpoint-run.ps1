param([string]$RunName='final')
$ErrorActionPreference='Stop'
if($RunName -notmatch '^[a-zA-Z0-9_-]+$'){throw 'RunName must be a simple folder name'}
$project=Split-Path -Parent $PSScriptRoot
$repo=Split-Path -Parent $project
$relative="evidence/repair-20261026/$RunName"
$folder=Join-Path $project $relative
if(Test-Path -LiteralPath $folder){throw "Use a new RunName; evidence already exists: $folder"}
New-Item -ItemType Directory -Path $folder | Out-Null
Set-Content -LiteralPath (Join-Path $folder '.gdignore') -Value ''
$manifest="res://$relative/source.json"
$godot='C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe'
$steps=[System.Collections.Generic.List[object]]::new()
function Record-Step([string]$Name,[string]$Command,[int]$Code,[int]$Expected=0){
 $steps.Add(@{name=$Name;command=$Command;exitCode=$Code;expectedExitCode=$Expected;passed=($Code -eq $Expected);recordedAtUtc=[DateTime]::UtcNow.ToString('o')})
 $source=Get-Content -Raw -LiteralPath (Join-Path $folder 'source.json') | ConvertFrom-Json
 @{status='review-pending';accepted=$false;sourceRevision=$source.sourceRevision;steps=$steps.ToArray()} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $folder 'checks.json')
 if($Code -ne $Expected){throw "Check failed: $Name (exit $Code, expected $Expected)"}
 Write-Output "CHECK_OK $Name"
}
function Invoke-Check([string]$Name,[string]$Command,[scriptblock]$Action){
 $global:LASTEXITCODE=0
 & $Action *> (Join-Path $folder "$Name.log")
 Record-Step $Name $Command $LASTEXITCODE
}
function Invoke-Engine([string]$Name,[string]$Script,[string]$Output,[switch]$Gpu,[string[]]$Extra=@(),[int]$Expected=0){
 $arguments=@('--path',$project,'--resolution','1920x1080','--script',"res://tools/$Script",'--',"--output=res://$relative/$Output","--source-manifest=$manifest")+$Extra
 if(-not $Gpu){$arguments=@('--headless')+$arguments}
 $process=Start-Process -FilePath $godot -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/$Name.log" -RedirectStandardError "$folder/$Name-errors.log" -PassThru
 # Windows PowerShell must acquire the handle while the process is alive or
 # ExitCode can remain null after WaitForExit, including for a failed validator.
 $nativeHandle=$process.Handle
 if($nativeHandle -eq 0){throw "Could not acquire process handle: $Name"}
 $watch=[Diagnostics.Stopwatch]::StartNew()
 while(-not $process.WaitForExit(200)){
  if($watch.Elapsed.TotalSeconds -gt 600){$process.Kill();throw "Engine validation timeout: $Name"}
  Start-Sleep -Milliseconds 200
 }
 $errors=Get-Content -Raw -LiteralPath "$folder/$Name-errors.log"
 $code=$process.ExitCode
 if($null -eq $code){throw "Missing process exit code: $Name"}
 Record-Step $Name "$godot $($arguments -join ' ')" $code $Expected
 if($Expected -eq 0 -and $errors){throw "Engine errors in $Name : $errors"}
}
Push-Location $repo
try{
 & node godot-prototype/tools/checkpoint-source.mjs snapshot (Join-Path $folder 'source.json')
 if($LASTEXITCODE -ne 0){throw 'Source snapshot failed'}
 Invoke-Check 'npm-validate' 'npm.cmd run validate' { & npm.cmd run validate }
 Invoke-Check 'lint-scope' 'node --test godot-prototype/tools/lint-scope.test.mjs' { & node --test godot-prototype/tools/lint-scope.test.mjs }
 Invoke-Engine -Name parse -Script parse-scripts.gd -Output parse
 Invoke-Engine -Name navigation-regression -Script navigation-test.gd -Output navigation-regression
 Invoke-Check 'launcher-greece' '.\godot-prototype\run.ps1 -View greece -Headless -RuntimeArguments --validate' { & "$project/run.ps1" -View greece -GodotPath $godot -Headless -RuntimeArguments @('--validate') }
 if(-not(Select-String -LiteralPath "$folder/launcher-greece.log" -Pattern 'PRODUCTION_VIEW_RESOLVED greece distance=95')){throw 'Launcher did not resolve production Greece'}
 Invoke-Engine -Name global -Script global-validate.gd -Output navigation
 Invoke-Engine -Name regional -Script regional-validate.gd -Output navigation
 Invoke-Engine -Name negative-timeout -Script global-validate.gd -Output negative-timeout -Extra @('--timeout-seconds=0') -Expected 1
 $negative=Get-Content -Raw -LiteralPath "$folder/negative-timeout/global-navigation.json" | ConvertFrom-Json
 if($negative.passed -or $negative.failure -notlike '*Timed out*'){throw 'Timeout did not report an explicit failure'}
 Invoke-Check 'global-geography' 'node godot-prototype/tools/global-verify.mjs' { & node godot-prototype/tools/global-verify.mjs }
 Invoke-Check 'regional-geography' 'node godot-prototype/tools/regional-verify.mjs' { & node godot-prototype/tools/regional-verify.mjs }
 Invoke-Check 'integrity' "node godot-prototype/tools/checkpoint-integrity.mjs $RunName" { & node godot-prototype/tools/checkpoint-integrity.mjs $RunName }
 Invoke-Check 'production-captures' "checkpoint-capture.ps1 -Stage $RunName/production -Views greece,anatolia,egypt,east,alps,apennines,sicily,campaign,overview" { & "$PSScriptRoot/checkpoint-capture.ps1" -Stage "$RunName/production" -Views greece,anatolia,egypt,east,alps,apennines,sicily,campaign,overview -SourceManifest $manifest }
 Invoke-Check 'profile-captures' "checkpoint-capture.ps1 -Stage $RunName/profiles -Views @() -Profiles alps,apennines,sicily,greece,anatolia,egypt,zagros,east" { & "$PSScriptRoot/checkpoint-capture.ps1" -Stage "$RunName/profiles" -Views @() -Profiles alps,apennines,sicily,greece,anatolia,egypt,zagros,east -SourceManifest $manifest }
 Invoke-Check 'reference-captures' "checkpoint-capture.ps1 -Stage $RunName/reference -ReferenceShaders -Profiles anatolia,zagros -Scales overview,strategic" { & "$PSScriptRoot/checkpoint-capture.ps1" -Stage "$RunName/reference" -Views @() -Profiles anatolia,zagros -Scales overview,strategic -ReferenceShaders -SourceManifest $manifest }
 Invoke-Check 'repeat-captures' "checkpoint-capture.ps1 -Stage $RunName/repeat -Profiles anatolia,zagros -Scales overview,strategic" { & "$PSScriptRoot/checkpoint-capture.ps1" -Stage "$RunName/repeat" -Views @() -Profiles anatolia,zagros -Scales overview,strategic -SourceManifest $manifest }
 Invoke-Check 'edge-shadow-control' "checkpoint-capture.ps1 -Stage $RunName/no-shadows -Views campaign -NoTerrainShadows" { & "$PSScriptRoot/checkpoint-capture.ps1" -Stage "$RunName/no-shadows" -Views campaign -NoTerrainShadows -SourceManifest $manifest }
 Invoke-Check 'edge-overlap-control' "checkpoint-capture.ps1 -Stage $RunName/no-overlap -Views campaign -NoOverlap" { & "$PSScriptRoot/checkpoint-capture.ps1" -Stage "$RunName/no-overlap" -Views campaign -NoOverlap -SourceManifest $manifest }
 Invoke-Engine -Name water -Script visual-validate.gd -Output water -Gpu
 Invoke-Engine -Name approach -Script navigation-profile.gd -Output approach -Gpu
 Invoke-Check 'source-verify' "node godot-prototype/tools/checkpoint-source.mjs verify $folder/source.json" { & node godot-prototype/tools/checkpoint-source.mjs verify "$folder/source.json" }
 Invoke-Check 'report' "node godot-prototype/tools/checkpoint-report.mjs $RunName" { & node godot-prototype/tools/checkpoint-report.mjs $RunName }
}finally{Pop-Location}
