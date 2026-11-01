$ErrorActionPreference='Stop'
& "$PSScriptRoot/../../tools/checkpoint-capture.ps1" -Stage roma-final3 -Views @() -Profiles @('roma') -Scales @('strategic','close') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final3-source.json
& "$PSScriptRoot/../../tools/checkpoint-capture.ps1" -Stage roma-final3-detail -Views @() -Profiles @('roma-east','roma-west','roma-layout') -Scales @('strategic') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final3-source.json
& "$PSScriptRoot/../../tools/checkpoint-capture.ps1" -Stage roma-final3-architecture -Views @() -Profiles @('roma-east','roma-west') -Scales @('regional') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final3-source.json

