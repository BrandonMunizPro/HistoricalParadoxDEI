$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$assetFolder=Join-Path $project 'assets/roma-showcase'
New-Item -ItemType Directory -Force -Path $assetFolder|Out-Null
$manifest=@();$budget=0L
foreach($definition in @(@('stone_wall_02','stone'),@('rough_wood','timber'),@('aerial_grass_rock','ground'))){
 foreach($map in @(@('diff','color'),@('nor_gl','normal'),@('rough','roughness'))){
  $url='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/'+$definition[0]+'/'+$definition[0]+'_'+$map[0]+'_2k.jpg'
  $file=$definition[1]+'-'+$map[1]+'.jpg';$target=Join-Path $assetFolder $file
  if(-not(Test-Path -LiteralPath $target)){Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $target}
  $bytes=(Get-Item -LiteralPath $target).Length;$budget+=$bytes
  if($budget -gt 50MB){throw 'Selective material budget exceeded'}
  $manifest+=@{file=$file;source=$url;asset='https://polyhaven.com/a/'+$definition[0];license='CC0-1.0';licenseSource='https://polyhaven.com/license';bytes=$bytes;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLower()}
 }
}
$manifest|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $assetFolder 'manifest.json')
Write-Output "Material maps=$($manifest.Count) bytes=$budget"
