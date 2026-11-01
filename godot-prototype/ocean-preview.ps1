param([ValidateSet('low','balanced','high')][string]$Quality='balanced',[double]$WindDirection=28)
$ErrorActionPreference='Stop'
& 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe' --path $PSScriptRoot --resolution 1920x1080 --script res://tools/ocean-preview.gd -- ("--ocean-quality="+$Quality) ("--ocean-wind="+$WindDirection)
