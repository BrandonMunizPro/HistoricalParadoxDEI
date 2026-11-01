param([switch]$Baseline)
$ErrorActionPreference='Stop'
$arguments=@('--path',$PSScriptRoot,'--resolution','1920x1080','--script','res://tools/development-preview.gd','--','--roma-showcase')
if(-not $Baseline){$arguments+='--settlement-development'}
& 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe' @arguments
