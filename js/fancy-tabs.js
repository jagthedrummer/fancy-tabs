// Copyright (c) 2011 Jeremy Green

 if (typeof Effect == 'undefined')
  throw("You must have the script.aculo.us library to use FancyTabs. (https://github.com/jagthedrummer/fancy-tabs)");




var FancyTabs = Class.create({
	/*
	 * Construct a new FancyTabs object
	 * tabContainer : the container on the page that will get the tabs
	 * options : options for the tabs
	 */
	initialize: function(tabContainer,options){
		this.id = "fancy-tabs-" + Math.floor(Math.random()*100000);
		this.tabContainer = $(tabContainer);
		this.options = {
			classNames : {
				handle : 'handle',
				content : 'content',
				tabSet : 'tab-set'
			},
			parseContainer : true,
			onEvent : 'click',
			splitPane : null,
			splitCol : null,
			primary : true, //conrols whether it automatially goes away when the last tab is closed
		};
		
		this.tabSets = $A();
		this.otherFancyTabs = $A();
		
		this.currentTab = null;
		if(options != null){
			Object.extend(this.options,options);
		}
		this.initSplitPane();
		//this.splitPane = this.options.splitPane;
		//this.splitCol = this.options.splitCol;
		
		//this.initTabSet();
		//this.initTabFrame();
		//this.initContentFrame();
		//this.initDroppables();
		if(this.options.parseContainer){
			this.parseContainer();
		}	
	},
	
	parseContainer : function(){
		sets = this.tabContainer.select("." + this.options.classNames.tabSet);
		if (sets.length == 0) {
			this.parseBasicContainer();
		}else{
			this.parseSplitContainer(sets);
		}
	},
	
	/*
	 * Parse markup with pre built splits
	 */
	parseSplitContainer : function(sets){
		
		sets.each(function(set){
			this.addNewSplitCol();
			handles = set.select("." + this.options.classNames.handle);
			contents = set.select("." + this.options.classNames.content);
			if(handles.length != contents.length){
				throw("The number of handle divs ("+handles.length+") vs. content divs ("+contents.length+") does not match up.");
				return;
			}
			for(var i=0; i<handles.length; i++){
				this.addTab(handles[i],contents[i],handles[i].hasClassName('permanent'));
			}
			//
		}.bind(this));
		
	},
	
	parseBasicContainer : function(){
		handles = this.tabContainer.select("." + this.options.classNames.handle);
		contents = this.tabContainer.select("." + this.options.classNames.content);
		if(handles.length != contents.length){
			throw("The number of handle divs ("+handles.length+") vs. content divs ("+contents.length+") does not match up.");
			return;
		}
		for(var i=0; i<handles.length; i++){
			this.addTab(handles[i],contents[i],handles[i].hasClassName('permanent'));
		}
		//this.setActiveTab(this.tabs.first());
	},
	
	initSplitPane : function(){
		
		// First create a div that will be the parent for our new SplitPane
		this.splitPane = new Element('div', {'class': 'clearfix fancy-split-pane'});
		this.splitPane.panes = $A(); //This will hold all of the split panes that get created
		this.tabContainer.insert( this.splitPane );
		//this.splitCol = new Element('div', {'class': 'fancy-split-col','id': 'col1'  });
		//this.splitCol.setStyle( {'width' : '100%', 'left':'0%'});
		
		//this.splitPane.insert(this.splitCol);
		//Now add the split pane to the markup right before our existing tab set
		
		//Now move the tab container into the first column
		//this.splitCol.insert(this.tabContainer);
	},
	
	/*
	 * Add other FancyTabs objects that we shoudl 
	 * cooperate with
	 */
	addFancyTabs : function(otherTabs){
		this.otherFancyTabs.push(otherTabs);
		this.splitCols().each(function(splitCol){
			splitCol.fancyTabSet.stopDragsAndSorts();
			splitCol.fancyTabSet.initDragsAndSorts();
		});
		
	},
	
	
	/*
	 * All drag targets for this set of tabs
	 */
	allDragTargets : function(){
		targets = this.otherDragTargets();
		targets = targets.concat(this.allLocalDragTargets());
		return targets;
	},
	
	/*
	 * Targest coming from exernally created
	 * additiona FancyTabs objects
	 */
	otherDragTargets : function() {
		targets = $A();
		this.otherFancyTabs.each(function(tabs){
			//console.log(targets);
			targets = targets.concat(tabs.allLocalDragTargets());
		}.bind(targets));
		//console.log(targets)
		return targets;
	},
	
	/*
	 * These are targets associated with the current
	 * FancyTabs Object (in any FancyTabSet)
	 */
	allLocalDragTargets : function() {
		var targets = $A();
		//console.log("getting localDragTargets from sets : " + this.tabSets.length)
		this.tabSets.each(function(set){
			//console.log(targets);
			targets = targets.concat(set.dragTargets());
		}.bind(targets));
		return targets;
	},
	
	addNewSplitCol : function(afterCol){
		this.unSplit();
		var splitCol = new Element('div', {'class': 'fancy-split-col','id': 'col1'  });
		
		if(afterCol == null){
			afterCol = this.splitCols().last();
		}
		if (afterCol != null) {
			origWidth = this.parsePercent(afterCol.style.width);
			origLeft = this.parsePercent(afterCol.style.left);
			newWidth = origWidth/2 - 0.1; //need to subtract just a little to keep things sane.  Why is this happening?
			newLeft = origLeft + newWidth;
			afterCol.setStyle({'width' : newWidth + "%" })
			splitCol.setStyle({'width' : newWidth + "%", 'left' : newLeft + "%" })
		} else {
			splitCol.setStyle({'width': '100%','left': '0%'});
		}
		//this.splitCols.push(splitCol);
		var newTabs = new FancyTabSet(this,splitCol);
		this.tabSets.push(newTabs);
		splitCol.fancyTabSet = newTabs;
		//splitCol.insert(newTabs.tabSet);
		if (afterCol != null) {
			afterCol.insert({ 'after' : splitCol });
		} else {
			this.splitPane.insert(splitCol);
		}
		this.setIdealHeight();
		this.reSplit();
		return splitCol;
	},
	
	
	removeSplitCol : function(oldCol){
		this.unSplit();
		this.tabSets = this.tabSets.without(oldCol.fancyTabSet);
		var prevCol = oldCol.previous();
		if (prevCol != null) {
			//console.log("we found a previous element")
			origWidth = this.parsePercent(prevCol.style.width);
			oldWidth = this.parsePercent(oldCol.style.width);
			newWidth = Math.floor(origWidth + oldWidth);
			prevCol.setStyle({'width': newWidth + "%"});
		}else{
			var nextCol = oldCol.next();
			if(nextCol != null){
				//console.log("we fould a next() element");
				origWidth = this.parsePercent(nextCol.style.width);
				oldWidth = this.parsePercent(oldCol.style.width);
				oldLeft = this.parsePercent(oldCol.style.left);
				newWidth = Math.floor(origWidth + oldWidth);
				newLeft = Math.floor(oldLeft - oldWidth);
				nextCol.setStyle({'width': newWidth + "%", 'left' : newLeft + "%" });
			}
		}
		oldCol.fancyTabSet.stopDragsAndSorts();
		//Sortable.destroy(oldCol.tabFrame);
		oldCol.parentNode.removeChild(oldCol);
		this.setIdealHeight();
		this.reSplit();
	},
	
	splitCols : function(){
		var cols = this.splitPane.select(".fancy-split-col");
		//console.log(this.id + " " + cols.length)
		return cols 
	},
	
	/*
	 * Get the max height of any tab sets
	 */
	getMaxHeight : function(){
		var maxHeight = 0;
		this.splitCols().each(function(splitCol){
			var height = splitCol.fancyTabSet.getMaxHeight();
			if(height > maxHeight){
				maxHeight = height;
			}
		}.bind(maxHeight));
		
		//console.log("maxHeight = " + maxHeight);
		return maxHeight;
	},
	
	/*
	 * setContentHeight
	 * height : an integer (pixels)
	 */
	setContentHeight : function(height){
		this.splitCols().each(function(splitCol){
			splitCol.fancyTabSet.setContentHeight(height);
		});
	},
	
	/*
	 * Set the ideal height for all content
	 */
	setIdealHeight : function(){
		var height = this.getMaxHeight();
		//console.log("setting idealHeight of " + height);
		this.setContentHeight(height);
	},
	
	reSplit : function(){
		var cols = this.splitCols();
		if(cols.length > 1){
			for(var c = 0; c < cols.length -1; c++ ){ //only go to next to last one since we're pulling them in pairs
				//var width = 100/cols.length;
				//var offset = i * width;
				var col1 = cols[c];
				var col2 = cols[c+1];
				//console.log("col1 " + col1.style.width + " " + col1.style.left );
				//console.log("col2 " + col2.style.width + " " + col2.style.left );
				var newPane = new SplitPane(col1, col1.style.width, col2, col2.style.left, col2.style.width, { active: true, onEnd : this.setIdealHeight.bind(this) });
				newPane.set();
				this.splitPane.panes.push(newPane);
			}
		}
		
	},
	
	unSplit : function(){
		this.splitPane.panes.each(function(pane){ pane.dispose(); });
		this.splitPane.panes = $A();
		
	},
	
	moveTabAfterCol : function(fancyTab,afterCol){
		var newCol = this.addNewSplitCol(afterCol);
		fancyTab.parent.removeTabContent(fancyTab);
		newCol.fancyTabSet.addFancyTab(fancyTab);
		newCol.fancyTabSet.setActiveTab(fancyTab);
		afterCol.fancyTabSet.setActiveTab(afterCol.fancyTabSet.tabs.first());
	},
	
	/*pass in the elements/content to be used as the tab handle/content*/
	addTab : function(handle,content,permanent){
		if(this.splitCols().length == 0){
			this.addNewSplitCol();
		}
		this.splitCols().last().fancyTabSet.addTab(handle,content,permanent);
		this.setIdealHeight();
	},
	
	parsePercent : function(percentString){
		regex = /(\d+\.?\d*)\%/
		return parseFloat(regex.exec(percentString)[1]);
	}
	
});




/*
 * This class represents a single 'pane' of 
 * sortable/closeable tabs.
 */
	
var FancyTabSet = Class.create({

	/*
	 * Construct a new FancyTabSet
	 * fancyTabs : The main FancyTabs object that controls this set
	 */
	initialize: function(fancyTabs,splitCol){
		this.id = "fancy-tab-set-" + Math.floor(Math.random()*100000);
		this.fancyTabs = fancyTabs;
		this.splitCol = splitCol;
		this.splitCol.fancyTabSet = this; 
		this.tabs = $A();
		
		this.otherTabSets = $A();
		this.currentTab = null;
		
		
		
		this.initTabSet();
		this.initTabFrame();
		this.initContentFrame();
		this.initDroppables();
		/*if(this.options.parseContainer){
			this.initContainer();
		}*/	
	},
	
	
	
	/*
	 * Setup the main container that will hold everything together
	 */
	initTabSet : function(){
		this.tabSet = new Element('div', {'class': 'clearfix fancy-tab-set','id':this.id+'-tab-set'});
		this.splitCol.appendChild(this.tabSet);
		//this.tabContainer.appendChild(this.tabSet);
	},
	
	/*
	 * Setup the container that will hold the actual tabs
	 */
	initTabFrame : function(){
		this.tabFrame = new Element('ul', {'class': 'clearfix fancy-tab-frame','id':this.id+'-tab-frame'});
		this.tabSet.appendChild(this.tabFrame);
	},
	
	/*
	 * Setup the container that will hold the content panels
	 */
	initContentFrame : function(){
		this.contentFrame = new Element('div', {'class': 'clearfix fancy-content-frame','id':this.id+'-content-frame'});
		this.tabSet.appendChild(this.contentFrame);
	},
	
	/*
	 * Setup the droppable areas on the sides that will trigger a SplitPane
	 */
	initDroppables : function(){
		this.droppableEast = new Element('div', {'class': 'fancy-droppable-east','id':this.id+'-droppable-east'});
		this.contentFrame.appendChild(this.droppableEast);
		
	},
	
	
	/*
	 * Get's the height of the tallest content div in the tab set
	 */
	getMaxHeight : function(){
		var maxHeight = 0;
		this.tabs.each(function(tab){
			var height =  tab.contentHeight();
			//console.log("  a tab height = " + height);
			if(height > maxHeight){
				maxHeight = height;
			}
		}.bind(maxHeight));
		//console.log(" in FancyTabSet the maxHeight = " + maxHeight);
		return maxHeight;
	},
	
	/*
	 * setContentHeight on all tabs
	 * height : an integer (pixels)
	 */
	setContentHeight : function(height){
		this.tabs.each(function(tab){
			tab.setContentHeight(height);
		});
	},
	
	/*
	 * Pass in another tabSet so that tabs
	 * can be dragged from one to the other.
	 */
	/*addTabSet : function(tabSet){
		this.otherTabSets.push(tabSet);
		this.initDragsAndSorts();
	},*/
	
	
	stopDragsAndSorts : function(){
		Droppables.remove(this.droppableEast);
	},
	
	/*
	 * Called periodically to updated
	 * the sortables and draggables to 
	 * respond to other tabSets or tabs.
	 */
	initDragsAndSorts: function(){
		Droppables.add(this.droppableEast,{hoverclass:'dropzone',
										   containment:this.fancyTabs.allDragTargets(),
										   accept:'fancy-tab',
										   onDrop: this.eastDrop.bind(this)
										   }
					  );
					  
		Sortable.create(this.tabFrame,{hoverclass:'dropzone',
										  overlap:'horizontal',
										  constraint:false,
										  ghosting : true,
										  revert : false,
										  dropOnEmpty : true,
										  containment:this.fancyTabs.allDragTargets(),
										  onChange : function(elem){},
										  onUpdate : this.sortUpdate.bind(this)
										  }
					    );
	},
	
	eastDrop : function(tab){
		//console.log(tab);
		var col = this.splitCol;
		this.fancyTabs.moveTabAfterCol(tab.fancy_tab,col);
		
		/*
		if (this.splitPane == null) {
			this.initSplitPane();
		}else{
			this.unSplit();
		}	
		
		var col1 = this.splitCol;
						
		
		origWidth = this.parsePercent(col1.style.width);
		origLeft = this.parsePercent(col1.style.left);
		
		newWidth = origWidth/2;
		newLeft = origLeft + newWidth;
		
		col1.setStyle({'width' : newWidth + "%" })
			 
		//create our new column that goes on the right
		var newCol = new Element('div', {'class': 'fancy-split-col','id': 'col2'});
		newCol.setStyle({'width' : newWidth + "%", 'left' : newLeft + "%" })
		this.splitCol.insert({after: newCol});
		// Create a new tab container div in col2
		var newTabDiv = new Element('div', {'class': 'clearfix'});
		newCol.insert(newTabDiv);
		
		var newTabs = new FancyTabs(newTabDiv, {splitPane : this.splitPane, splitCol : newCol, primary : false } );
				
		tab.fancy_tab.parent.removeTabContent(tab.fancy_tab);
		newTabs.addFancyTab(tab.fancy_tab);
		newTabs.addTabSet(this);
		this.addTabSet(newTabs);
		
		this.reSplit();
				
		
		//SplitPane.setAll(); 
		*/
		
	},
	
	
	
	/*
	removeFromSplitPane : function(){
		this.unSplit();
		var prevCol = this.splitCol.previous();
		if(prevCol != null){
			origWidth = this.parsePercent(prevCol.style.width);
			myWidth = this.parsePercent(this.splitCol.style.width);
			newWidth = origWidth + myWidth;
			prevCol.setStyle({'width': newWidth + "%"});
		}else{
			//console.log("we don't have a previous col!");
		}
		this.splitCol.parentNode.removeChild(this.splitCol);
		this.reSplit();
	},
	*/
	
	
	sortUpdate : function(list){
		//console.log("sortUpdate on  elem =" + list);
		var tabs = list.childElements(); 
		for(var i = 0; i< tabs.length; i ++){
			tab = tabs[i];
			if(tab.tab_set.id != this.id){
				//console.log("need to move for " + tab.innerHTML + " " + this.id + " - " + tab.tab_set.id)
				tab.tab_set.removeTabContent(tab.fancy_tab);
				this.insertTab(tab.fancy_tab);
				this.fancyTabs.setIdealHeight();
			}
		}
	},
	
		
	
	dragTargets : function(){
		var targets = [this.droppableEast,this.tabFrame];
		return targets;
	},
	
	/*
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
	*/
	
	/*pass in the elements/content to be used as the tab handle/content*/
	addTab : function(handle,content,permanent){
		var tab = new FancyTab(handle,content,permanent,this);
		this.addFancyTab(tab);
	},
	
	/*
	 * For passing in a pre built tab
	 */
	addFancyTab : function(tab){
		//console.log(tab.tab_elem)
		//console.log(tab)
		//console.log(this.tabFrame)
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
			this.fancyTabs.removeSplitCol(this.splitCol);
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
	initialize: function(handle, content, permanent, parent){
		this.handle = handle;
		this.content = content;	
		this.permanent = permanent;
		
		this.tab_elem = new Element('li', {'class': 'fancy-tab'})
		if(this.permanent){
			this.tab_elem.addClassName('permanent');
		}
		//a couple of hacks to let even passing work out right.		
		this.setParent(parent);
		this.tab_elem.fancy_tab = this;
		this.handle_elem = new Element('div', {'class': 'fancy-tab-handle'}).update(this.handle);
		this.closer_elem = new Element('a', {'class':'fancy-tab-close'})
		this.tab_elem.appendChild(this.handle_elem);
		this.tab_elem.appendChild(this.closer_elem);
		this.content_holder_elem = new Element('div', {'class': 'fancy-content-holder'}).update(this.content);
		this.content_elem = new Element('div', {'class': 'fancy-content'}).update(this.content_holder_elem);
		this.tab_elem.observe(this.parent.fancyTabs.options.onEvent,this.activateTab.bind(this));
		this.closer_elem.observe('click',this.closeTab.bind(this));
	},
	
	/*
	 * Return the calculated height
	 * of the content in this tab
	 */
	contentHeight : function(){
		var isActive = true;
		if(!this.content_elem.hasClassName("active")){
			isActive = false;
			this.content_elem.addClassName("active");
		}
		var height =  this.content_holder_elem.getHeight();
		//console.log("    in FancyTab the height = " + height);
		if(!isActive){
			this.content_elem.removeClassName("active");
		}
		return height;
	},
	
	
	/*
	 * Set the content height
	 * height : an integer (pixels)
	 */
	setContentHeight : function(height){
		this.content_elem.setStyle({'height':height+'px'});
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




