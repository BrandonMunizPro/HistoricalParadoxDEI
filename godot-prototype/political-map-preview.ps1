param([string]$View='campaign',[switch]$GeographicOnly)
$ErrorActionPreference='Stop'
$arguments=@('--path',$PSScriptRoot,'--resolution','1920x1080','--',('--view='+$View))
if($GeographicOnly){$arguments+='--geographic-only'}
& 'C:\Users\brand\tools\godot\4.7.2-stable\Godot_v4.7.2-stable_win64.exe' @arguments
