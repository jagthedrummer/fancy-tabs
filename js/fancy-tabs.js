// Copyright (c) 2011 Jeremy Green

 if (typeof Effect == 'undefined')
  throw("You must have the script.aculo.us library to use FancyTabs. (https://github.com/jagthedrummer/fancy-tabs)");

  
function FancyTabs(tabContainer,options){
	
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
		this.tabFrame = new Element('div', {'class': 'clearfix fancy-tab-frame'});
		this.tabContainer.appendChild(this.tabFrame);
	};
	
	this.initContentFrame = function(){
		this.contentFrame = new Element('div', {'class': 'clearfix fancy-content-frame'});
		this.tabContainer.appendChild(this.contentFrame);
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
	
	/*pass in the elements/content to be used as the tab handle/content*/
	this.addTab = function(handle,content){
		var tab = new FancyTab(handle,content,this);
		this.tabFrame.appendChild(tab.handle_elem);
		this.contentFrame.appendChild(tab.content_elem);
		this.tabs.push(tab);
	};
	
	this.setActiveTab = function(tab){
		if(this.currentTab){
			this.currentTab.hideTab();
		}
		this.currentTab = tab;
		this.currentTab.showTab();
	};
	
	this.initTabFrame();
	this.initContentFrame();
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
		this.handle_elem.addClassName("active");
	};
	
	this.hideTab = function(){
		this.content_elem.removeClassName("active");
		this.handle_elem.removeClassName("active");
	};
	
	this.handle_elem = new Element('div', {'class': 'fancy-tab'}).update(this.handle);
	this.content_elem = new Element('div', {'class': 'fancy-content'}).update(this.content);
	this.handle_elem.observe(this.parent.options.onEvent,this.activateTab.bind(this));

}



