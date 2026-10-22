param([string]$Stage='before', [string[]]$Views=@('alps','po','apennines','south','sicily','etna'))
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$folder=Join-Path $project "evidence\regional-$Stage"
New-Item -ItemType Directory -Force -Path $folder | Out-Null
Set-Content -LiteralPath (Join-Path $folder '.gdignore') -Value ''
foreach($view in $Views){
 $arguments=@('--path',$project,'--resolution','1920x1080','--',"--capture=$view","--output=res://evidence/regional-$Stage")
 if($Stage -eq 'diagnostic'){$arguments+='--diagnostic'}
 if($Stage -eq 'after'){$arguments+='--match-baseline'}
 if($Stage -eq 'quality-after'){$arguments+=@('--match-baseline','--baseline-folder=evidence/regional-quality-before')}
 if($Stage -eq 'global-after'){$arguments+=@('--match-baseline','--baseline-folder=evidence/regional-global-before')}
 if($Stage -eq 'global-diagnostic'){$arguments+=@('--river-diagnostic','--match-baseline','--baseline-folder=evidence/regional-global-before')}
 if($Stage -eq 'global-regression'){$arguments+=@('--match-baseline','--baseline-folder=evidence/regional-quality-after')}
 $process=Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput "$folder\$view-run.log" -RedirectStandardError "$folder\$view-errors.log" -PassThru
 $peak=0L
 $runtimeIds=@($process.Id)
 while(-not $process.HasExited){
  if($runtimeIds.Count -eq 1){$children=Get-CimInstance Win32_Process -Filter "ParentProcessId = $($process.Id)"; $runtimeIds+=@($children | Where-Object { $_.Name -like 'Godot*' } | ForEach-Object { [int]$_.ProcessId })}
  $bytes=(Get-Process -Id $runtimeIds -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum
  $peak=[Math]::Max($peak,[long]$bytes)
  Start-Sleep -Milliseconds 200
 }
 if($process.ExitCode -and $process.ExitCode -ne 0){throw "Godot capture failed: $view"}
 $errors=Get-Content -LiteralPath "$folder\$view-errors.log"
 if($errors){throw ($errors -join "`n")}
 @{view=$view;sampledPeakWorkingSetBytes=$peak;intervalMs=200;processIds=$runtimeIds;scope='Launched console wrapper and its direct Godot child only'}|ConvertTo-Json|Set-Content "$folder\process-$view.json"
 Get-Content "$folder\$view-run.log" -Tail 2
}
