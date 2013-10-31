/*!
 * jQuery Panelize - v0.8b - 2013-10-29
 * Image navigation with image maps
 * 
 * (c) 2013 R.E. Warner <rewarner@russellbits.com>
 * MIT Licensed.
 *
 * http://russellbits.github.io/panelize
 * http://github.com/russellbits/panelize

 * TDODs
 * + DONE? Work out index bug
 * + DONE! Create full image option
 * + Previous button - any button - current structure returns only next function
 * + DONE! YAY! Create transitions without transit.js dependency
 * + DONE YAY! Create alternate area for link w/out pan/zoom
 * + Needs a pre-loading function for large images
*/

jQuery.fn.panelize = function( options ) {
	
	var defaults = {
		container: this, // this should be used as opposed to explicit jquery references
		fullImageStart: true,
		panelViewerID : '#panelViewer',
		showNextBtnID : '#nextPanelBtn',
		showPrevBtnID : '#prevPanelBtn',
		resetBtnID: '#resetBtn'
	};

	var settings = $.extend( {}, defaults, options );

	var panels = {
		panelIndex: 0,
		panel: [],
		viewerWidth: this.width(),
		viewerHeight: this.height()
	};
	
	function Panel(x1, y1, x2, y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.width = this.x2 - this.x1;
		this.height = this.y2 - this.y1;
	}

	console.log('Viewer: '+panels.viewerWidth+', '+panels.viewerHeight);
	
	// Intialize the panels in the comic
	// Assign area tag coordinates to the panels object (left,top,right,bottom)
	$(this).find('area').each(function(i) {
		if($(this).attr("target")!=null||$(this).attr("target")=="") {}
		else {
			var coords = $(this).attr('coords');
			var coordsStrArray = coords.split(',');
			panels.panel.push(new Panel(
				coordsStrArray[0],
				coordsStrArray[1],
				coordsStrArray[2],
				coordsStrArray[3]
			));
		}
	});
	
	var comic = $(settings.panelViewerID).find('img');

	/**
	* Start with full page option
	* 	The full scaled page will show, unless the user opts not to,
	* 	in which case, the first panel will zoom and show
	**/
	if(settings.fullImageStart) {
		var xOffset = 0;
		var yOffset = 0;
		comic = $(settings.panelViewerID).find('img');
		
		// Add additional coordinates to return to full image
		panels.panel.unshift(new Panel(
			0,
			0,
			comic.width(),
			comic.height()
		));
		
		if(comic.width() > comic.height()) {
			scaleFactor = panels.viewerWidth/comic.width();
			yOffset = Math.floor(((panels.viewerHeight-(comic.height()*scaleFactor))/2));
		} else {
			scaleFactor = panels.viewerHeight/comic.height();
			xOffset = Math.floor(((panels.viewerWidth-(comic.width()*scaleFactor))/2));
		}
		comic.css({transformOrigin:'0px 0px'})
			.animate({left:xOffset,top:yOffset,scale:scaleFactor});
		
		panels.panelIndex = 1;

	} else {
		transformPanel();
	}
	
	/**
	* MAIN TRANSFORM FUNCTION
	**/
	function transformPanel() {
		// Reset to first panel when index hits maximum
		if(panels.panelIndex == panels.panel.length) {
			panels.panelIndex = 0;
		}
		// Undo full page transform
		if(settings.fullPageStart && panels.panelIndex == 0) {
			console.log('Returning to initial scale and position');
			//$('#comicOverlay').css({transformOrigin:'0px 0px'}).transition({x:0,y:0}).transition({scale:1});
		}
		// Assign local variables
		var panelTop = panels.panel[panels.panelIndex].y1;
		var panelLeft = panels.panel[panels.panelIndex].x1;
		var panelWidth = panels.panel[panels.panelIndex].width;
		var panelHeight = panels.panel[panels.panelIndex].height;
		var panelBottom = panels.panel[panels.panelIndex].y2;
		var panelRight = panels.panel[panels.panelIndex].x2;
		var offsetIsX;
		var yOffset = 0;
		var xOffset = 0;
		var portraitMode = true;
		
		// Check if we are dealing with a portrait or landscape viewer
		if(panels.viewerWidth > panels.viewerHeight) {
			portraitMode = true;
		} else {
			portraitMode = false;
		}
		
		if(panelWidth > panelHeight || portraitMode==false) {
			var usingWidthAsMax = true;
			scaleFactor = panels.viewerWidth/panelWidth;
			offsetIsX = true;
		} else { 
			var usingWidthAsMax = false;
			scaleFactor = panels.viewerHeight/panelHeight;
			offsetIsX = false;
		}
		
		var scaledPanelHeight = Math.floor(panelHeight*scaleFactor);
		var scaledPanelWdith = Math.floor(panelWidth*scaleFactor);
		
		// need to divide the offest by the scalefactor?
		if(offsetIsX) {
			yOffset = Math.floor((panels.viewerHeight-scaledPanelHeight)/2);
		} else {
			xOffset = Math.floor((panels.viewerWidth-scaledPanelWdith)/2);
		}
		
		console.log("Panel location: top:"+panelTop+
			', left:'+panelLeft+
			', bottom: '+panelBottom+
			', right:'+panelRight+
			', width: '+panelWidth+
			', height: '+panelHeight+
			', scalefactor: '+scaleFactor);
		console.log('Using a width offset of '+xOffset+' given width of '+scaledPanelHeight+'.');
		console.log('Using a height offset of '+yOffset+' given height of '+scaledPanelWdith+'.');
		console.log(panels.panel[panels.panelIndex]);
		console.log('Current index: '+panels.panelIndex);
		console.log('Panel length: '+panels.panel.length);
		
		// Perform the actual transformation
		var Xmove = -panelLeft+xOffset;
		var Ymove = -panelTop+yOffset;

		comic.css({transformOrigin:'0px 0px'})
			.animate({left:Xmove*scaleFactor,top:Ymove*scaleFactor,scale:scaleFactor});
		
		// Update location in panels object
		panels.panelIndex += 1;
	}

	/**
	* Interactive functions (UI)
	**/
	return this.each(function() {
		
		/*return $(settings.resetBtnID).click(function() {
			console.log('reset function activated');
			panels.panelIndex = 0;
			$('#comic').transition({x:0,y:0}).transition({scale:1});
		});*/
		
		return $(settings.showNextBtnID).click(function(event) {
			console.log('Next button activated');
			event.preventDefault();
			transformPanel();
		});
		
		return $(settings.showPrevBtnID).click(function(event) {
			console.log('Previous button activated');
			event.preventDefault();
			transformPanel();
		});
		
	});
	
};