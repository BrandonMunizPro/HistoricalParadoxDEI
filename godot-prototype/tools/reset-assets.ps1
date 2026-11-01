$ErrorActionPreference='Stop'
$assetRoot=Join-Path (Split-Path -Parent $PSScriptRoot) 'evidence/visual-reset-20261028/source-evaluation'
$assetBase='https://raw.githubusercontent.com/0ad/0ad/master/binaries/data/mods/public/art/'
$paths=@('LICENSE.txt','meshes/structural/roman_house_a.dae','meshes/structural/roman_house_b.dae','meshes/structural/roman_house_c.dae','meshes/structural/roman_house_d.dae','textures/skins/structural/rome_struct_2.png','textures/skins/structural/rome_struct_2_norm.png','textures/skins/structural/rome_struct_2_spec.png')
foreach($variant in @('a','b','c','d')){$paths+='textures/skins/structural/ao/rome_house_'+$variant+'.png'}
$downloadBytes=0L
$manifest=@()
foreach($assetPath in $paths){
 $file=Split-Path -Leaf $assetPath
 $target=Join-Path $assetRoot $file
 if(-not(Test-Path -LiteralPath $target)){Invoke-WebRequest -UseBasicParsing -Uri ($assetBase+$assetPath) -OutFile $target}
 $size=(Get-Item -LiteralPath $target).Length
 $downloadBytes+=$size
 if($downloadBytes -gt 40MB){throw 'Evaluation download budget exceeded'}
 $manifest+=@{file=$file;source=$assetBase+$assetPath;author='Wildfire Games and 0 A.D. contributors';license='CC-BY-SA-3.0';bytes=$size;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLower();status='Evaluation only; not integrated'}
}
$manifest|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $assetRoot 'download-manifest.json')
Write-Output "Evaluation files=$($manifest.Count) bytes=$downloadBytes"
