extends RefCounted
## Original redrawing; historical evidence and dates are in presentation.json.
static func svg(faction,index):
	var motif=faction.emblem.motif;var shape=""
	match motif:
		"anchor":shape='<circle cx="32" cy="17" r="4"/><path d="M32 21V46 M23 27H41 M18 35C18 48 46 48 46 35 M18 35L15 39 M18 35L22 38 M46 35L42 38 M46 35L49 39" stroke-width="3.4"/>'
		"wolf_twins":shape='<path fill="url(#gold)" d="M13 27L18 23L20 17L24 22L38 22L47 18L48 24L53 27L50 31L43 30L42 40L38 40L37 31L26 32L24 40L20 40L20 31L15 31L12 37L10 35L12 28Z"/><path d="M19 27Q30 30 42 26 M27 43L25 48 M27 43L31 48 M36 43L33 48 M36 43L40 48"/><circle cx="28" cy="39" r="2.5" fill="url(#gold)"/><circle cx="35" cy="39" r="2.5" fill="url(#gold)"/><circle cx="47" cy="26" r="1" fill="#251c1b" stroke="none"/>'
		"eagle":shape='<path fill="url(#gold)" d="M23 16Q31 11 37 18L40 21L35 23L34 29Q48 34 46 46L39 42L35 48L26 45L20 50L20 43Q19 29 28 25L29 20L23 20Z"/><path d="M29 29Q39 32 39 43 M27 33L34 40 M26 38L31 43" stroke="#483322" stroke-width="1.8"/><path d="M14 50H49 M19 47L16 53 M44 47L48 53"/>'
		"owl":shape='<path fill="url(#gold)" d="M21 18L27 20L37 20L43 18L42 29Q48 48 32 50Q16 48 22 29Z"/><circle cx="27" cy="28" r="5" fill="#2c2730"/><circle cx="37" cy="28" r="5" fill="#2c2730"/><circle cx="27" cy="28" r="1.5" fill="#f3dfaa" stroke="none"/><circle cx="37" cy="28" r="1.5" fill="#f3dfaa" stroke="none"/><path d="M30 33L32 37L34 33 M25 36L23 43L29 46 M39 36L41 43L35 46 M28 49V52 M36 49V52" stroke="#46382b" stroke-width="1.6"/>'
		"rose":shape='<path d="M32 35V51 M32 44Q18 45 20 38Q28 37 32 44 M32 40Q45 38 44 31"/><path fill="url(#gold)" d="M32 18C19 13 15 25 24 29C20 40 34 42 36 32C48 33 51 20 40 19C38 12 32 13 32 18Z"/><circle cx="33" cy="26" r="4" fill="#493629"/><path d="M43 32L39 27L46 26Z" fill="url(#gold)"/>'
		"dolphin_rider":shape='<path fill="url(#gold)" d="M13 40Q30 29 46 34L51 32L49 39L43 40Q28 37 21 45L13 47L16 42Z"/><circle cx="31" cy="18" r="3" fill="url(#gold)"/><path d="M30 22L27 30L35 34L39 33 M28 25L39 23 M28 30L22 35 M14 51Q20 47 26 51Q32 55 38 51Q44 47 50 51"/>'
		"tripod":shape='<path d="M18 23H46L42 32H22Z M23 32L19 50 M41 32L45 50 M32 32V50 M15 51H23 M28 51H36 M41 51H49 M19 22Q13 13 21 13Q27 13 23 22 M41 22Q37 13 43 13Q51 13 45 22"/>'
		"boar":shape='<path fill="url(#gold)" d="M13 29L19 24L21 19L25 22L28 17L32 21L36 17L39 22L43 21L46 27L52 30L50 36L43 37L41 46H37L37 36L27 36L24 46H20L21 35L15 35Z"/><path d="M14 30Q8 23 12 20 M46 36L49 40L53 36"/><circle cx="46" cy="30" r="1.2" fill="#282025" stroke="none"/>'
		"torc":shape='<path d="M21 42A18 18 0 1 1 43 42" stroke-width="6"/><circle cx="20" cy="42" r="4" fill="url(#gold)"/><circle cx="44" cy="42" r="4" fill="url(#gold)"/><path d="M18 16L22 20 M13 26L18 28 M45 17L41 21 M50 28L45 29" stroke="#4e3928" stroke-width="1.6"/>'
		"helmet":shape='<path fill="url(#gold)" d="M17 31Q17 13 34 15Q47 15 48 30L39 31L39 43L34 48L29 35L21 36L21 42L17 42Z"/><path d="M19 28Q32 23 47 28 M29 35L34 31 M23 14Q38 5 48 19" stroke="#473126"/><path d="M21 13Q39 4 50 20" stroke-width="4"/>'
		"spear":shape='<path fill="url(#gold)" d="M32 12L38 25L32 30L26 25Z"/><path d="M32 30V51 M22 44L43 23 M16 28L41 49 M15 25L19 25L19 29 M40 46L45 46L45 51"/>'
		"standard":shape='<path d="M23 18H42V31H23Z M26 33H38 M32 31V49 M24 49H40"/>'
		"tanit":shape='<circle cx="32" cy="19" r="5" fill="url(#gold)"/><path d="M19 29H45 M32 29L20 47H44Z" stroke-width="3.3"/><path d="M25 50H39 M19 27L16 22 M45 27L48 22"/>'
		"star","sun","rosette","wheel":
			shape='<circle cx="32" cy="32" r="7"/>'
			for i in (12 if motif=="star" else 8):
				var a=TAU*i/(12. if motif=="star" else 8.)
				shape+='<path d="M%.2f %.2fL%.2f %.2f"/>'%[32+cos(a)*10,32+sin(a)*10,32+cos(a)*18,32+sin(a)*18]
		"spiral":shape='<path d="M32 32C14 29 17 13 30 19C39 23 34 30 32 32C40 17 54 27 44 38C38 44 33 36 32 32C45 43 31 55 24 43C20 35 28 32 32 32Z"/>'
		"horse":shape='<path fill="url(#gold)" d="M15 37L21 28L29 28L31 18L37 14L44 21L48 24L45 29L37 26L35 33L40 38L39 48H35L34 40L28 37L23 42L21 49H17L19 39L14 43L11 42Z"/><path d="M18 30L12 26 M39 18L35 23"/>'
		"meander":shape='<path d="M16 21H47V44H21V27H40V38H28V33H34" stroke-width="3.3"/>'
		"ship":shape='<path fill="url(#gold)" d="M14 38L22 47H42L50 38Z"/><path d="M31 15V38 M31 17L45 34H31 M27 22L19 34H27 M14 51Q22 47 30 51Q38 55 48 50"/>'
		"lotus":shape='<path d="M32 43C14 37 16 25 18 23C24 24 28 29 32 37C36 29 40 24 46 23C48 25 50 37 32 43Z M32 43C23 32 26 21 32 17C38 21 41 32 32 43Z M24 47H40"/>'
		"pyramid":shape='<path d="M15 46L29 21L43 46Z M32 46L41 31L50 46Z"/><circle cx="43" cy="21" r="5"/>'
		"fire":shape='<path d="M23 43H41L38 49H26Z"/><path fill="url(#gold)" d="M32 40C16 35 31 24 30 16C43 27 47 34 32 40Z"/>'
		"mountain":shape='<path d="M13 46L27 22L41 46Z M31 46L43 29L53 46Z M23 30L27 34L31 30"/>'
		"oak","wreath":shape='<path d="M31 48V19 M31 40C15 42 15 30 26 33 M33 33C47 34 47 23 36 26 M31 28C18 28 20 18 29 20 M33 43C47 46 49 34 38 36"/>'
	var beads=""
	for i in 24:
		var a=TAU*i/24.
		beads+='<circle cx="%.2f" cy="%.2f" r=".65"/>'%[32+cos(a)*27.2,32+sin(a)*27.2]
	var dark=Color(faction.color).darkened(.5).to_html(false)
	var light=Color(faction.color).lightened(.12).to_html(false)
	var ornament=""
	if faction.emblem.basis=="original_design":
		var angle=(index%4)*45
		ornament='<path d="M12 32H52 M32 12V52" transform="rotate(%s 32 32)" stroke="#e4cc91" stroke-width="1" opacity=".18"/>'%angle
	return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="field" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#%s"/><stop offset="1" stop-color="#%s"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff0ba"/><stop offset=".5" stop-color="#dcc286"/><stop offset="1" stop-color="#ad8546"/></linearGradient></defs><circle cx="32" cy="33" r="30.5" fill="#13141a"/><circle cx="32" cy="31.5" r="28.8" fill="url(#field)" stroke="url(#gold)" stroke-width="2.3"/><g fill="#d7b777">%s</g><circle cx="32" cy="31.5" r="24.8" fill="none" stroke="#d7b777" stroke-width=".8" opacity=".8"/>%s<g fill="none" stroke="url(#gold)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">%s</g></svg>'%[light,dark,beads,ornament,shape]
