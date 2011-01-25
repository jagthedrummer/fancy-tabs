// Copyright (c) 2011 Jeremy Green

 if (typeof Effect == 'undefined')
  throw("You must have the script.aculo.us library to use FancyTabs. (https://github.com/jagthedrummer/fancy-tabs)");


function FancyTabs(tabContainer,options){
	this.id = "fancy-tabs-" + Math.floor(Math.random()*1000);
	this.tabContainer = $(tabContainer);
	this.options = {
		classNames : {
			handle : 'handle',
			content : 'content'
		},
		onEvent : 'click'
	};
	this.tabs = $A();
	
	this.currentTab = null;
	if(options != null){
		Object.extend(this.options,options);
	}
	
	
	this.initTabFrame = function(){
		this.tabFrame = new Element('ul', {'class': 'clearfix fancy-tab-frame','id':this.id+'-tab-frame'});
		this.tabContainer.appendChild(this.tabFrame);
	};
	
	this.initContentFrame = function(){
		this.contentFrame = new Element('div', {'class': 'clearfix fancy-content-frame','id':this.id+'-content-frame'});
		this.tabContainer.appendChild(this.contentFrame);
	};
	
	this.initDroppables = function(){
		this.droppableEast = new Element('div', {'class': 'fancy-droppable-east','id':this.id+'-droppable-east'});
		this.contentFrame.appendChild(this.droppableEast);
		Droppables.add(this.droppableEast,{hoverclass:'dropzone'})
	};
	
	
	this.initContainer = function(){
		handles = this.tabContainer.select("." + this.options.classNames.handle);
		contents = this.tabContainer.select("." + this.options.classNames.content);
		if(handles.length != contents.length){
			throw("The number of handle divs ("+handles.length+") vs. content divs ("+contents.length+") does not match up.");
			return;
		}
		for(var i=0; i<handles.length; i++){
			this.addTab(handles[i],contents[i])
		}
		this.setActiveTab(this.tabs.first());
	}
	
	this.dragTargets = function(){
		return [this.droppableEast,this.tabFrame]
	}
	
	/*pass in the elements/content to be used as the tab handle/content*/
	this.addTab = function(handle,content){
		var tab = new FancyTab(handle,content,this);
		this.tabFrame.appendChild(tab.tab_elem);
		this.contentFrame.appendChild(tab.content_elem);
		this.tabs.push(tab);
		this.setActiveTab(tab);
		Sortable.create(this.tabFrame.id,{overlap:'horizontal',constraint:false,containment:this.dragTargets()});
	};
	
	this.closeTab = function(tab){
		console.log("removing for " + tab.handle_elem.innerHTML)
		this.tabFrame.removeChild(tab.tab_elem);
		this.contentFrame.removeChild(tab.content_elem);
		this.tabs = this.tabs.without(tab);
		if(this.tabs.length > 0){
			console.log(this.tabs.length);
			var first_tab = this.tabs.first()
			console.log(first_tab.handle_elem);	
			this.setActiveTab(first_tab);
		}else{
			this.setActiveTab(null);
		}
	};
	
	this.setActiveTab = function(tab){
		console.log('activating ' + tab.handle_elem.innerHTML + " tabs.length = " + this.tabs.length);
		if(this.currentTab!=null){
			this.currentTab.hideTab();
		}
		this.currentTab = tab;
		if(this.currentTab!=null){
			this.currentTab.showTab();
		}
	};
	
	this.initTabFrame();
	this.initContentFrame();
	this.initDroppables();
	this.initContainer();
}

/*This class represents the tabs themselves */
function FancyTab(handle, content, parent){
	this.handle = handle;
	this.content = content;	
	this.parent = parent;
	
	this.activateTab = function(){
		parent.setActiveTab(this);
	};
	
	this.showTab = function(){
		this.content_elem.addClassName("active");
		this.tab_elem.addClassName("active");
	};
	
	this.closeTab = function(event){
		parent.closeTab(this);
		//let's keep the tab from trying to activate itself after it's been removed.
		Event.stop(event);
	};
	
	this.hideTab = function(){
		this.content_elem.removeClassName("active");
		this.tab_elem.removeClassName("active");
	};
	this.tab_elem = new Element('li', {'class': 'fancy-tab'})
	this.handle_elem = new Element('div', {'class': 'fancy-tab-handle'}).update(this.handle);
	this.closer_elem = new Element('a', {'class':'fancy-tab-close'})
	this.tab_elem.appendChild(this.handle_elem);
	this.tab_elem.appendChild(this.closer_elem);
	this.content_elem = new Element('div', {'class': 'fancy-content'}).update(this.content);
	this.tab_elem.observe(this.parent.options.onEvent,this.activateTab.bind(this));
	this.closer_elem.observe('click',this.closeTab.bind(this));

}



