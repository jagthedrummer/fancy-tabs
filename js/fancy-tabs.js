// Copyright (c) 2011 Jeremy Green

 if (typeof Effect == 'undefined')
  throw("You must have the script.aculo.us library to use FancyTabs. (https://github.com/jagthedrummer/fancy-tabs)");

var FancyTabs = Class.create({
	
	
	/*
	 * Construct a new FancyTabs set
	 * tabContainer : the container on the page that will get the tabs
	 * options : options for the tabs
	 */
	initialize: function(tabContainer,options){
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
		this.otherTabSets = $A();
		this.currentTab = null;
		if(options != null){
			Object.extend(this.options,options);
		}
		this.initTabFrame();
		this.initContentFrame();
		this.initDroppables();
		this.initContainer();
		
	},
	
	/*
	 * Setup the container that will hold the actual tabs
	 */
	initTabFrame : function(){
		this.tabFrame = new Element('ul', {'class': 'clearfix fancy-tab-frame','id':this.id+'-tab-frame'});
		this.tabContainer.appendChild(this.tabFrame);
	},
	
	/*
	 * Setup the container that will hold the content panels
	 */
	initContentFrame : function(){
		this.contentFrame = new Element('div', {'class': 'clearfix fancy-content-frame','id':this.id+'-content-frame'});
		this.tabContainer.appendChild(this.contentFrame);
	},
	
	/*
	 * Setup the droppable areas on the sides that will trigger a SplitPane
	 */
	initDroppables : function(){
		this.droppableEast = new Element('div', {'class': 'fancy-droppable-east','id':this.id+'-droppable-east'});
		this.contentFrame.appendChild(this.droppableEast);
		
	},
	
	/*
	 * Pass in another tabSet so that tabs
	 * can be dragged from one to the other.
	 */
	addTabSet : function(tabSet){
		this.otherTabSets.push(tabSet);
		this.initDragsAndSorts();
	},
	
	/*
	 * Called periodically to updated
	 * the sortables and draggables to 
	 * respond to other tabSets or tabs.
	 */
	initDragsAndSorts: function(){
		Droppables.add(this.droppableEast,{hoverclass:'dropzone',containment:this.combinedDragTargets(),accept:'fancy-tab'})
		Sortable.create(this.tabFrame.id,{overlap:'horizontal',
										  constraint:false,
										  containment:this.combinedDragTargets(),
										  onChange : function(elem){},
										  onUpdate : this.sortUpdate.bind(this)
										  }
					    );
	},
	
	sortUpdate : function(list){
		//console.log("sortUpdate on  elem =" + list);
		var tabs = list.childElements(); 
		for(var i = 0; i< tabs.length; i ++){
			tab = tabs[i];
			if(tab.tab_set.id != this.id){
				//console.log("need to move for " + tab.innerHTML + " " + this.id + " - " + tab.tab_set.id)
				tab.tab_set.removeTabContent(tab.fancy_tab);
				this.insertTab(tab.fancy_tab);
			}
		}
	},
	
	initContainer : function(){
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
	},
	
	dragTargets : function(){
		var targets = [this.droppableEast,this.tabFrame];
		return targets;
	},
	
	combinedDragTargets : function(){
		var targets = this.dragTargets();
		//console.log("targets = " + targets);
		
		//targets.concat(["testing"]);
		this.otherTabSets.each(function(set){
			//console.log(targets);
			targets = targets.concat(set.dragTargets());
		}.bind(targets));
		//console.log("targets = " + targets);
		return targets;
	},
	
	/*pass in the elements/content to be used as the tab handle/content*/
	addTab : function(handle,content){
		var tab = new FancyTab(handle,content,this);
		this.tabFrame.appendChild(tab.tab_elem);
		this.insertTab(tab);
	},
	
	/*
	 * This is called to insert a FancyTab object into this set
	 */
	insertTab : function(tab){
		tab.setParent(this);
		
		this.contentFrame.appendChild(tab.content_elem);
		this.tabs.push(tab);
		this.setActiveTab(tab);
		this.initDragsAndSorts();
	},
	
	/*
	 * Removes tab content after a move or close
	 */
	removeTabContent : function(tab){
		this.contentFrame.removeChild(tab.content_elem);
		this.tabs = this.tabs.without(tab);
		if(this.tabs.length > 0){
			//console.log(this.tabs.length);
			var first_tab = this.tabs.first()
			//console.log(first_tab.handle_elem);	
			this.setActiveTab(first_tab);
		}else{
			this.setActiveTab(null);
		}
		this.initDragsAndSorts();
	},
	
	closeTab : function(tab){
		//console.log("removing on" + this.id + " for " + tab.handle_elem.innerHTML)
		this.tabFrame.removeChild(tab.tab_elem);
		this.removeTabContent(tab);
		
	},
	
	setActiveTab : function(tab){
		//console.log('activating ' + tab.handle_elem.innerHTML + " tabs.length = " + this.tabs.length);
		if(this.currentTab!=null){
			this.currentTab.hideTab();
		}
		this.currentTab = tab;
		if(this.currentTab!=null){
			this.currentTab.showTab();
		}
	}
	
});



/*
 * This class represents the tabs themselves.
 * This should not be used directly.
 * Once you've created a tab set you'd want to call
 * tabs.addTab("My new tab","Some content");
 */

var FancyTab = Class.create({
	/*
	 * Initialize a new tab
	 * handle : the text to go into the tab itself
	 * content : the content for the panel the tab represents
	 * parent : the FancyTabs object that creates this tab
	 */	
	initialize: function(handle, content, parent){
		this.handle = handle;
		this.content = content;	
		
		
		this.tab_elem = new Element('li', {'class': 'fancy-tab'})
		//a couple of hacks to let even passing work out right.		
		this.setParent(parent);
		this.tab_elem.fancy_tab = this;
		this.handle_elem = new Element('div', {'class': 'fancy-tab-handle'}).update(this.handle);
		this.closer_elem = new Element('a', {'class':'fancy-tab-close'})
		this.tab_elem.appendChild(this.handle_elem);
		this.tab_elem.appendChild(this.closer_elem);
		this.content_elem = new Element('div', {'class': 'fancy-content'}).update(this.content);
		this.tab_elem.observe(this.parent.options.onEvent,this.activateTab.bind(this));
		this.closer_elem.observe('click',this.closeTab.bind(this));
	},
	
	/*
	 * Convenience method for stashing the right
	 * references to the parent.
	 */
	setParent : function (parent){
		this.parent = parent;
		this.tab_elem.tab_set = parent;
	},
	
	/*
	 * Listens for a click and sets things in 
	 * motion with parent set of FancyTabs
	 */
	activateTab : function(){
		this.parent.setActiveTab(this);
	},
	
	
	/*
	 * Called by the parent to signal 
	 * this tab to activiate itself visually
	 */
	showTab : function(){
		this.content_elem.addClassName("active");
		this.tab_elem.addClassName("active");
	},
	
	/*
	 * Called by the parent to signal 
	 * this tab to deactiviate itself visually
	 */
	hideTab : function(){
		this.content_elem.removeClassName("active");
		this.tab_elem.removeClassName("active");
	},
	
	/*
	 * Listens for a click on the close button and 
	 * then notifies the parent.
	 */
	closeTab : function(event){
		this.parent.closeTab(this);
		//let's keep the tab from trying to activate itself after it's been removed.
		Event.stop(event);
	}
	
	
});




