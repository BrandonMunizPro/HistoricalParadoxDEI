param([ValidateSet('low','balanced','high')][string]$Quality='balanced')
$ErrorActionPreference='Stop'
# This launcher is an interactive preview: the user needs its game window.
Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe' -ArgumentList @('--path', $PSScriptRoot, '--resolution', '1920x1080', '--', '--view=pellaro', "--ocean-quality=$Quality")
