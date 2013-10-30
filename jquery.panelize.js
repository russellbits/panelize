/*!
 * jQuery Panelize - image navigation with image maps
 * (c) 2013 R.E. Warner <rewarner@russellbits.com>
 * MIT Licensed.
 *
 * http://russellbits.github.io/panelize
 * http://github.com/russellbits/panelize

 * TDODs
 * + Previous button
 * + Create transitions without transit.js dependency
 * + Create alternate area for link w/out pan/zoom
 * + Needs a pre-loading function for large images
*/

jQuery.fn.panelize = function( options ) {
	
	var defaults = {
		container: this, // this should be used as opposed to explicit jquery references
		fullPageStart: true,
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
	// Assign area tag coordinates to the panels object
	$(this).find('area').each(function(i) {
		var coords = $(this).attr('coords');
		var coordsStrArray = coords.split(',');
		panels.panel.push(new Panel(
			coordsStrArray[0],
			coordsStrArray[1],
			coordsStrArray[2],
			coordsStrArray[3]
		));
	});
	
	console.log(panels);
	
	/**
	* Start with full page option
	* 	The full scaled page will show, unless the user opts not to,
	* 	in which case, the first panel will zoom and show
	**/
	if(settings.fullPageStart) {
		var xOffset = 0;
		var yOffset = 0;
		comic = $(settings.panelViewerID).find('img');
		if(comic.width() > comic.height()) {
			scaleFactor = panels.viewerWidth/comic.width();
			yOffset = Math.floor(((panels.viewerHeight-(comic.height()*scaleFactor))/2));
			console.log('yOffset: '+yOffset);
			console.log('Comic is '+comic.width()+' wide');
		} else {
			scaleFactor = panels.viewerHeight/comic.height();
			xOffset = Math.floor(((panels.viewerWidth-(comic.width()*scaleFactor))/2));
			console.log('xOffset: '+xOffset);
			console.log('Comic is '+comic.height()+'  tall');
		}
		$('#comicOverlay')
			.css({transformOrigin:'0px 0px'})
			.transition({x:xOffset,y:yOffset})
			.transition({scale:scaleFactor});
	} else {
		transformPanel();
	}
	
	/**
	* MAIN TRANSFORM FUNCTION
	**/
	function transformPanel() {
		// Reset to first panel when index hits maximum
		if(panels.panelIndex == panels.panel.length-1) {
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
		
		console.log("Panel location\ntop:"+panelTop+
			'\nleft:'+panelLeft+
			'\nbottom: '+panelBottom+
			'\nright:'+panelRight+
			'\nwidth: '+panelWidth+
			'\nheight: '+panelHeight+
			'\nscalefactor: '+scaleFactor);
		console.log('Using a width offset of '+xOffset+' given width of '+scaledPanelHeight+'.');
		console.log('Using a height offset of '+yOffset+' given height of '+scaledPanelWdith+'.');
		
		// Perform the actual transformation
		$(settings.panelViewerID).find('img')
			.css({transformOrigin:'0px 0px'})
			.transition({scale:scaleFactor})
			.transition({x:-panelLeft+xOffset,y:-panelTop+yOffset});
			

		panels.panelIndex += 1;
	}
	// Set the initial panel up
	// NOTE: This is redundant to the next button and previous button functions; how to re-factor?
	/* var panelTop = panels.panel[panels.panelIndex].y1;
	var panelLeft = panels.panel[panels.panelIndex].x1;
	var panelWidth = panels.panel[panels.panelIndex].width;
	var panelHeight = panels.panel[panels.panelIndex].height;
	
	if(panelWidth > panelHeight){
		var origin = panels.viewerWidth;
		var scaleNorm = panelWidth;
	} else {
		var origin = panels.viewerHeight;
		var scaleNorm = panelHeight;
	}
	var scaleFactor = origin/scaleNorm;	
	
	$('#comicOverlay')
		.css({transformOrigin:'0px 0px'})
		.transition({scale:scaleFactor})
		.transition({x:-panelLeft,y:-panelTop});

	panels.panelIndex = 1;*/
	
	// Set the first panel (or not--should be a setting

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
		
	});
	
};