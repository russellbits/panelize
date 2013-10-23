// Create closure.
;(function($) {
    // Convenience vars for accessing elements
    
    var $body = $('body'),
        $panelize = $('#panelize');
	
	var defaults = {
			container: this,
	};

	var settings = $.extend( {}, defaults );

	var panels = {
		panelIndex: 0,
		panel: [],
		viewerWidth: $('#panelViewer').width(),
		viewerHeight: $('#panelViewer').height()
	};
	console.log(panels);
	function Panel(top, left, width, height) {
		this.top = top;
		this.left = left;
		this.width = width;
		this.height = height;
	}
	 
    // Plugin definition.
    $.fn.panelize = function( settings ) {
    	console.log('definition occurring.');
        $(this).find('area').each(function(i) {
			var coords = $(this).attr('coords');
			var coordsStrArray = coords.split(',');
			panels.panel.push(new Panel(
				coordsStrArray[1],
				coordsStrArray[0],
				coordsStrArray[2],
				coordsStrArray[3]
				));
		});
		console.log(panels.panel);
    };
 
    // Private function for debugging.
    function debug( $obj ) {
        if ( window.console && window.console.log ) {
            window.console.log( "hilight selection count: " + $obj.size() );
        }
    }
	
	$.panelize = function() {
	}
	
	$.panelize.next = function( callback ) {
    	console.log('next function activated');
    	
    	if(panels.panelIndex == panels.panel.length) {
			panels.panelIndex = 0;
		}
		
		var panelTop = panels.panel[panels.panelIndex].top;
		var panelLeft = panels.panel[panels.panelIndex].left;
		var panelWidth = panels.panel[panels.panelIndex].width-panels.panel[panels.panelIndex].left;
		var panelHeight = panels.panel[panels.panelIndex].height-panels.panel[panels.panelIndex].top;
		console.log("Transforming to: "+panelTop+','+panelLeft+','+panelWidth+','+panelHeight);
		
		if(panelWidth > panelHeight){
			var origin = panels.viewerWidth;
			var scaleNorm = panelWidth;
		} else { 
			var origin = panels.viewerHeight;
			var scaleNorm = panelHeight;
		}
		var scaleFactor = origin/scaleNorm;	
		console.log('making factor: '+scaleFactor);
		$('#comicOverlay').find('img')
			.css({transformOrigin:'0px 0px'})
			.transition({scale:scaleFactor})
			.transition({x:-panelLeft,y:-panelTop});

		console.log("Transformed to: "+panelTop+','+panelLeft+','+panelWidth+','+panelHeight);
		panels.panelIndex += 1;
    }
	
// End of closure.
 
})( jQuery );