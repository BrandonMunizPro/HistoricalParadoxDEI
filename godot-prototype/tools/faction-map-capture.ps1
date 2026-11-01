param([string]$Stage='before',[string[]]$Only=@(),[switch]$Native)
$ErrorActionPreference='Stop'
if($Stage -notmatch '^[a-z0-9-]+$'){throw 'Invalid stage'}
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project ('evidence/factions-20261030/'+$Stage)
if(Test-Path -LiteralPath $folder){throw 'Stage exists'}
New-Item -ItemType Directory -Path $folder | Out-Null
$arguments=@('--path',$project,'--resolution','1920x1080','--script','res://tools/faction-map-profile.gd','--','--automation-input-lock',('--output=res://evidence/factions-20261030/'+$Stage))
if($Native){$arguments[5]='res://tools/faction-map-validate.gd'}
if($Stage -ne 'before'){$arguments+='--reference=res://evidence/factions-20261030/before/views.json'}
if($Only.Count -gt 0){$arguments+=('--only='+($Only -join ','))}
$p=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder/run.log" -RedirectStandardError "$folder/errors.log" -PassThru
$handle=$p.Handle
if(-not $p.WaitForExit(600000)){$p.Kill();throw 'Audit timeout'}
@{exitCode=$p.ExitCode;arguments=$arguments}|ConvertTo-Json -Depth 4|Set-Content "$folder/process.json"
Get-Content "$folder/run.log" -Tail 4
if($p.ExitCode -ne 0 -or (Select-String -LiteralPath "$folder/errors.log" -Pattern 'SCRIPT ERROR|^ERROR:|SHADER ERROR')){Get-Content "$folder/errors.log" -Tail 15;throw 'Audit failed'}

