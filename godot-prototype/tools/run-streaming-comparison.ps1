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
        foreach($regionName in @('italy','gaul')) {
            $outputPath=Join-Path $evidenceRoot ($stageName+'-'+$regionName)
            New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
            $profile=Start-Process -FilePath $enginePath -ArgumentList @('--path',$projectRoot,'--resolution','1920x1080','--script','res://tools/streaming-optimization-profile.gd','--',('--stage='+$stageName),('--region='+$regionName)) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $outputPath 'run.log') -RedirectStandardError (Join-Path $outputPath 'errors.log')
            $profile.WaitForExit()
            Get-Content (Join-Path $outputPath 'run.log') -Tail 4
            if(-not (Test-Path (Join-Path $outputPath 'profile.json'))){throw "Missing profile: $stageName $regionName"}
            if(Select-String -Path (Join-Path $outputPath 'errors.log') -Pattern 'SCRIPT ERROR|^ERROR:'){throw "Native errors: $stageName $regionName"}
        }
    }
} finally {[IO.File]::WriteAllBytes($runtimePath,$optimizedSource)}
