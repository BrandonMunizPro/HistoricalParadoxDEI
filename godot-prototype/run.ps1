param([string]$View = 'campaign', [string]$GodotPath = 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe', [switch]$StaticWater, [switch]$Headless, [string[]]$RuntimeArguments=@())
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $GodotPath)) { throw 'Godot executable not found. Pass -GodotPath with your Godot 4 executable.' }
$arguments=@('--path',$PSScriptRoot,'--',"--view=$View")
if($Headless){$arguments=@('--headless')+$arguments}
if($StaticWater){$arguments+='--static-water'}
$arguments+=$RuntimeArguments
& $GodotPath @arguments
