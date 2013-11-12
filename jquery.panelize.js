/*!
 * jQuery Panelize - v0.8.2 - 2013-11-01
 * Image navigation with image maps
 * 
 * (c) 2013 R.E. Warner @belovedleader
 * MIT Licensed.
 *
 * http://russellbits.github.io/panelize
 * http://github.com/russellbits/panelize
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
	
	var comic = $(settings.panelViewerID).find('img:first');

	/**
	* Start with full page option
	* 	The full scaled page will show, unless the user opts not to,
	* 	in which case, the first panel will zoom and show
	**/
	if(settings.fullImageStart) {
		var xOffset = 0;
		var yOffset = 0;
		
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
		console.log("Scaling to full scale image.");
		comic.css({transformOrigin:'0px 0px'})
			.animate({left:xOffset,top:yOffset,scale:scaleFactor});
		
		panels.panelIndex = 0;

	} else {
		panels.panelIndex = -1;
		transformPanel();
	}
	
	/**
	* MAIN TRANSFORM FUNCTION
	**/
	function transformPanel(dir) {
		// If previous, 
		if(dir=='prev') {
			panels.panelIndex -= 1;
		} else {
			panels.panelIndex += 1;
		}
		
		// Reset to first panel when index hits maximum
		if(panels.panelIndex == panels.panel.length || panels.panelIndex < 0) {
			panels.panelIndex = 0;
		}
		
		console.log('Current index: '+panels.panelIndex);

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
		
		// Perform the actual transformation
		var Xmove = -panelLeft+xOffset;
		var Ymove = -panelTop+yOffset;

		comic.css({transformOrigin:'0px 0px'})
			.animate({left:Xmove*scaleFactor,top:Ymove*scaleFactor,scale:scaleFactor});
		
	}

	/**
	* Interactive functions (UI)
	**/
	$(settings.showNextBtnID).click(function(event) {
		console.log('Next button activated');
		event.preventDefault();
		transformPanel('next');
	});
	
	$(settings.showPrevBtnID).click(function(event) {
		console.log('Previous button activated');
		event.preventDefault();
		transformPanel('prev');
	});
			
};