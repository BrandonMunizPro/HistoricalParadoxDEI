param([ValidateSet('tarquinii','dover','corsica','estuary','fjord','india','pellaro','anatolia','hispania','brittany','aegean','delta','levant','tunisia','arabia')][string]$Coast='pellaro',[ValidateSet('low','balanced','high')][string]$Quality='balanced')
$ErrorActionPreference='Stop'
# Interactive launcher: keep the game window available for normal navigation.
Start-Process -FilePath 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe' -ArgumentList @('--path', ('"'+$PSScriptRoot+'"'), '--resolution', '1920x1080', '--script', 'res://tools/world-coast-preview.gd', '--', "--coast-view=$Coast", "--ocean-quality=$Quality")
