extends VBoxContainer
## Shared encyclopedia article for the sidebar and wider reading window.
const Design=preload("res://ui/campaign_theme.gd")
var ui
var entry={}
var sources={}
var headings={}
var references={}
var numbered={}
var wide=false
func setup(controller,record,registry,culture,reader=false):
	ui=controller;entry=record;sources=registry;wide=reader;size_flags_horizontal=Control.SIZE_EXPAND_FILL
	var scroller=get_parent()
	while scroller!=null and not scroller is ScrollContainer:scroller=scroller.get_parent()
	if scroller!=null:scroller.follow_focus=true
	var info="SPRING 278 BCE · "+str(int(entry.get("readingMinutes",1)))+" MIN READ"
	ui.label(self,info,false,Design.GOLD).add_theme_font_size_override("font_size",14)
	ui.label(self,entry.text).add_theme_font_size_override("font_size",18 if wide else 16)
	add_child(HSeparator.new())
	for item in [["HOMELAND",entry.get("homeland","")],["POLITICAL SETTING",entry.get("politicalForm","")],["CULTURAL IDENTITY",culture]]:
		if item[1]=="":continue
		ui.label(self,item[0],false,Design.GOLD).add_theme_font_size_override("font_size",13)
		ui.label(self,item[1]).add_theme_font_size_override("font_size",16)
	if entry.get("sections",[]).is_empty():return
	ui.label(self,"CONTENTS",false,Design.GOLD)
	var contents=GridContainer.new();contents.columns=2;contents.size_flags_horizontal=Control.SIZE_EXPAND_FILL;add_child(contents)
	var short_titles={"origins":"Origins & history","homeland":"Homeland & society","internal":"Internal affairs","external":"External relations","opening":"The 278 BCE opening"}
	for section in entry.sections:
		var button=ui.button(contents,short_titles.get(section.id,section.title),jump_to.bind(section.id));button.tooltip_text=section.title;button.custom_minimum_size=Vector2(0,34);button.clip_text=true;button.size_flags_horizontal=Control.SIZE_EXPAND_FILL;button.add_theme_font_size_override("font_size",14)
	var reference_button=ui.button(contents,"References",jump_to.bind("references"));reference_button.custom_minimum_size=Vector2(0,34);reference_button.size_flags_horizontal=Control.SIZE_EXPAND_FILL;reference_button.add_theme_font_size_override("font_size",14)
	for i in entry.sourceKeys.size():numbered[entry.sourceKeys[i]]=i+1
	for section in entry.sections:
		add_child(HSeparator.new())
		var title=ui.label(self,section.title,true);title.add_theme_font_size_override("font_size",23 if wide else 20);title.focus_mode=Control.FOCUS_ALL;headings[section.id]=title
		for p in section.text.split("\n\n",false):ui.label(self,p).add_theme_font_size_override("font_size",18 if wide else 16)
		var numbers=[]
		for key in section.sourceKeys:numbers.append(str(numbered.get(key,"?")))
		var cite=ui.button(self,"References ["+", ".join(numbers)+"]",jump_reference.bind(section.sourceKeys[0]));cite.custom_minimum_size.y=28;cite.add_theme_font_size_override("font_size",13);cite.size_flags_horizontal=Control.SIZE_SHRINK_BEGIN
	add_child(HSeparator.new());var refs=ui.label(self,"References",true);refs.add_theme_font_size_override("font_size",23 if wide else 20);refs.focus_mode=Control.FOCUS_ALL;headings.references=refs
	for key in entry.sourceKeys:
		var source=sources.get(key,{})
		var title=ui.label(self,"["+str(numbered[key])+"] "+str(source.get("title",source.get("citation",key))),false,Design.GOLD);title.focus_mode=Control.FOCUS_ALL;references[key]=title
		ui.label(self,str(source.get("url",""))).add_theme_font_size_override("font_size",14)
		var note=source.get("evidence",source.get("role",""))
		if note!="":ui.label(self,note).add_theme_font_size_override("font_size",14)
	if entry.get("researchFile","")!="":ui.label(self,"Further project research: "+entry.researchFile).add_theme_font_size_override("font_size",14)
func reveal(target):
	var parent=get_parent()
	while parent!=null and not parent is ScrollContainer:parent=parent.get_parent()
	if parent!=null:
		parent.ensure_control_visible(target);target.grab_focus()
func jump_to(id):
	if headings.has(id):reveal(headings[id])
func jump_reference(key):
	if references.has(key):reveal(references[key])
