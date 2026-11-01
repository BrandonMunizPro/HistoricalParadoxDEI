extends RefCounted
## Original vector game symbols. These are not copied game flags or attested
## historical national emblems. Source motifs and monograms live in faction data.
static func svg(faction,index):
	var motif=faction.emblem.motif;var shape=""
	match motif:
		"standard":shape='<path d="M23 18H42V31H23Z M26 33H38 M32 31V49 M24 49H40"/>'
		"tanit":shape='<circle cx="32" cy="21" r="5"/><path d="M21 30H43 M32 29L21 46H43Z"/>'
		"star","sun","rosette","wheel":
			shape='<circle cx="32" cy="32" r="7"/>'
			for i in (12 if motif=="star" else 8):
				var a=TAU*i/(12. if motif=="star" else 8.)
				shape+='<path d="M%.2f %.2fL%.2f %.2f"/>'%[32+cos(a)*10,32+sin(a)*10,32+cos(a)*18,32+sin(a)*18]
		"spiral":shape='<path d="M32 32C14 29 17 13 30 19C39 23 34 30 32 32C40 17 54 27 44 38C38 44 33 36 32 32C45 43 31 55 24 43C20 35 28 32 32 32Z"/>'
		"horse":shape='<path d="M19 43L24 31L30 28L32 19L42 23L45 31L39 33L35 29L34 38L40 44 M23 37H36 M23 43L21 49 M35 40L34 49 M20 33L15 28"/>'
		"meander":shape='<path d="M16 21H47V44H21V27H40V38H28V33H34"/>'
		"ship":shape='<path d="M15 38L22 47H42L50 38Z M31 16V38 M31 18L45 34H31 M28 21L19 34H28"/>'
		"lotus":shape='<path d="M32 43C14 37 16 25 18 23C24 24 28 29 32 37C36 29 40 24 46 23C48 25 50 37 32 43Z M32 43C23 32 26 21 32 17C38 21 41 32 32 43Z M24 47H40"/>'
		"pyramid":shape='<path d="M15 46L29 21L43 46Z M32 46L41 31L50 46Z"/><circle cx="43" cy="21" r="5"/>'
		"fire":shape='<path d="M23 43H41L38 49H26Z M32 40C16 35 31 24 30 16C43 27 47 34 32 40Z"/>'
		"mountain":shape='<path d="M13 46L27 22L41 46Z M31 46L43 29L53 46Z M23 30L27 34L31 30"/>'
		"oak","wreath":shape='<path d="M31 48V19 M31 40C15 42 15 30 26 33 M33 33C47 34 47 23 36 26 M31 28C18 28 20 18 29 20 M33 43C47 46 49 34 38 36"/>'
	var dots=""
	for i in 6:
		if (index+1)&(1<<i):dots+='<circle cx="%s" cy="54" r="1.2" fill="#f4e7c7"/>'%(22+i*4)
	return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M8 7H56V34Q54 49 32 60Q10 49 8 34Z" fill="%s" stroke="#241e24" stroke-width="3"/><path d="M12 11H52V34Q50 46 32 55Q14 46 12 34Z" fill="none" stroke="#ddc896" stroke-width="1.3"/><g fill="none" stroke="#f4e7c7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">%s</g>%s</svg>'%[faction.color,shape,dots]
