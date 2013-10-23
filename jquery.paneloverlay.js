/*
 * jQuery panelOverlay
 * Version 0.1
 * http://russellbits.com/jquery-paneloverlay/
 *
 * jQuery Javascript plugin which takes an image map and overlays colored panels with coordinates.
 *
 * Copyright (c) 2013 Russell Warner (russellbits.com)
 * Dual licensed under the MIT and GPL licenses.
*/

;(function($) {
	
	var panelsObj = {};

	$.fn.panelOverlay = function() {
		
		this.find('area').each(function(i) {
			var coords = $(this).attr('coords');
			var coordsStrArray = coords.split(',');
			panelsObj[i] = [];
		
			// generate panels array in the panels object
			$.each(coordsStrArray, function(j) {
				panelsObj[i][j] = parseInt(this);
			});
		
			// Create divs for outlining each area tag in the map
			panelDiv = $('<div></div>');
			panelDiv.css({
				'position':'absolute',
				'top':panelsObj[i][1],
				'left':panelsObj[i][0],
				'width':panelsObj[i][2]-panelsObj[i][0],
				'height':panelsObj[i][3]-panelsObj[i][1]
			});
			panelDiv.addClass('panel');
			panelDiv.text(coords);
			panelDiv.mouseover(function() {
				$(this).addClass('panelHighlight');
			}).mouseleave(function() {
				$(this).removeClass('panelHighlight');
			});
			$('#comicOverlay').append(panelDiv);
		
		});
		return this;
	}

}( jQuery ));