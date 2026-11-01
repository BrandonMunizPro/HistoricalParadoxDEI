$ErrorActionPreference='Stop'
& "$PSScriptRoot/../../tools/checkpoint-capture.ps1" -Stage roma-final -Views @() -Profiles @('roma') -Scales @('strategic','close') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final-source.json
& "$PSScriptRoot/../../tools/checkpoint-capture.ps1" -Stage roma-final-detail -Views @() -Profiles @('roma-east','roma-west','roma-layout') -Scales @('strategic') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final-source.json
& "$PSScriptRoot/../../tools/checkpoint-capture.ps1" -Stage roma-final-architecture -Views @() -Profiles @('roma-east','roma-west') -Scales @('regional') -ProfileFile data/roma-views.json -SourceManifest res://evidence/roma/final-source.json
