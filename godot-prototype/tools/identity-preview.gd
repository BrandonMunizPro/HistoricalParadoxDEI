extends "res://tools/development-preview.gd"
func run():
	super.run()
	# Match the sustained presentation check; reduce heat, not asset quality.
	if not OS.get_cmdline_user_args().has("--identity-uncapped"):Engine.max_fps=60
