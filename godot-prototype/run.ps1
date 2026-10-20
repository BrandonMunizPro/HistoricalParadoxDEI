param([string]$View = 'overview', [string]$GodotPath = 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe')
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $GodotPath)) { throw 'Godot executable not found. Pass -GodotPath with your Godot 4 executable.' }
& $GodotPath --path $PSScriptRoot -- --view=$View
