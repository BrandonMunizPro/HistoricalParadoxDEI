$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$evidenceRoot=Join-Path $projectRoot 'evidence/streaming-optimization'
$enginePath='C:/Users/brand/tools/godot/4.7.2-stable/Godot_v4.7.2-stable_win64_console.exe'
$runtimePath=Join-Path $projectRoot 'regional_scenery.gd'
$optimizedSource=[IO.File]::ReadAllBytes($runtimePath)
try {
    foreach($stageName in @('before','after')) {
        if($stageName -eq 'before') {
            [IO.File]::WriteAllBytes($runtimePath,[IO.File]::ReadAllBytes((Join-Path $evidenceRoot 'before-regional_scenery.gd.txt')))
        } else {[IO.File]::WriteAllBytes($runtimePath,$optimizedSource)}
        $outputPath=Join-Path $evidenceRoot ($stageName+'-transition')
        New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
        $capture=Start-Process -FilePath $enginePath -ArgumentList @('--path',$projectRoot,'--resolution','1920x1080','--script','res://tools/streaming-transition-capture.gd','--',('--stage='+$stageName)) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $outputPath 'run.log') -RedirectStandardError (Join-Path $outputPath 'errors.log')
        $capture.WaitForExit()
        Get-Content (Join-Path $outputPath 'run.log') -Tail 3
        if(-not (Test-Path (Join-Path $outputPath 'capture.json'))){throw "Missing captures: $stageName"}
        if(Select-String -Path (Join-Path $outputPath 'errors.log') -Pattern 'SCRIPT ERROR|^ERROR:'){throw "Native errors: $stageName"}
    }
} finally {[IO.File]::WriteAllBytes($runtimePath,$optimizedSource)}
