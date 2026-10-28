$ErrorActionPreference='Stop'
$project=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$repo=Split-Path -Parent $project
$g='C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64_console.exe'
$results=[Collections.Generic.List[object]]::new()
$manifest='res://evidence/roma/final-source.json'
function Check-Godot($name,$script,$headless,$expected=0,$extra=@()) {
 $argsList=@('--path',$project,'--script',"res://tools/$script")
 if($headless){$argsList+= '--headless'}else{$argsList+=@('--resolution','1920x1080')}
 $argsList+=@('--',"--output=res://evidence/roma/check-$name","--source-manifest=$manifest")+$extra
 $begin=[DateTime]::UtcNow
 $p=Start-Process -FilePath $g -ArgumentList $argsList -WindowStyle Hidden -RedirectStandardOutput "$PSScriptRoot/$name.stdout.log" -RedirectStandardError "$PSScriptRoot/$name.stderr.log" -PassThru
 $handle=$p.Handle
 if($handle -eq 0){throw "Missing process handle: $name"}
 $timedOut=-not $p.WaitForExit(300000)
 if($timedOut){$p.Kill();$p.WaitForExit()}
 $errors=[IO.File]::ReadAllText("$PSScriptRoot/$name.stderr.log")
 $passed=(-not $timedOut) -and ($p.ExitCode -eq $expected) -and [string]::IsNullOrWhiteSpace($errors)
 $results.Add(@{name=$name;command=@($g)+$argsList;expectedExit=$expected;exitCode=$p.ExitCode;timedOut=$timedOut;passed=$passed;startedAtUtc=$begin.ToString('o');endedAtUtc=[DateTime]::UtcNow.ToString('o');stderr=$errors})
 $results | ConvertTo-Json -Depth 8 | Set-Content "$PSScriptRoot/checks.json"
 Write-Output "$name passed=$passed exit=$($p.ExitCode) expected=$expected"
}
Check-Godot 'parse' 'parse-scripts.gd' $true
Check-Godot 'navigation-resolver' 'navigation-test.gd' $true
Check-Godot 'environment' 'environment-validate.gd' $false
Check-Godot 'habitat' 'habitat-validate.gd' $false
Check-Godot 'art' 'art-validate.gd' $false
Check-Godot 'foundation' 'na-validate.gd' $false
Check-Godot 'settlement-population' 'foundation-validate.gd' $false
Check-Godot 'water' 'visual-validate.gd' $false
Check-Godot 'global' 'global-validate.gd' $false
Check-Godot 'regional' 'regional-validate.gd' $false
Check-Godot 'timeout-negative' 'global-validate.gd' $false 1 @('--timeout-seconds=0.001')
if($results.Where({-not $_.passed}).Count){exit 1}







Check-Godot 'roma' 'roma-validate.gd' $false
if($results.Where({-not $_.passed}).Count){exit 1}

