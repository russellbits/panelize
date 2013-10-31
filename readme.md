# [jQuery Panelize](http://russellbits.com/jquery.panelize)
#### Navigation for images based on HTML image maps

jQuery Panelize is a plugin built largely to assist in navigating web comics, although it can additionally be used for presentations, interactive maps, and SVG.

Refer to the [jQuery Panelize website](http://russellbits.github.io/panelize/) for live example.

Usage
-----

Include the panelize script after your jQuery request. Requires jQuery 1.4+.

```html
<script src='jquery.js'></script>
<script src='jquery.panelize.js'></script>  
```

Intially setting up the panelize area requires a call to the plugin. Wrap your image with a div tag with the "panelViewer" id, like so

```html
<div id="panelViewer"><img src="yourImage" usemap="#yourMapName"/></div>
```

add your image map information below that and call panelize anywhere in the document, after the DOM has loaded:

```javascript
$(document).ready(function() {
	$('panelViewer').panelize();
});
```

Setting up next and previous buttons
---------------
Simply use the HTML id `showNextPanel` on any anchor element to create a link that will advance the plugin navigation, e.g.

```html
<div><a href="#" id="showNextPanel">Next</a></div>
```

Settings
--------
Default settings in panelize can be changed when the plugin is first called. The code below illustrates how the settings can be changed from their defaults.

```javascript
$('panelViewer').panelize({
    fullPageStart: false,
    showNextBtnID : '#yourNextButtonName',
	showPrevBtnID : '#yourPreviousButtonName',
});
```

+ `fullPageStart` is a boolean value. If set to `false` (the default) then panelize will zoom and pan to the first panel. A value of `true` will scale the entire image to fit inside the defined view space. The default value is `true`.

+ `showNextBtnID` allows you to manually set what HTML item is the button that progresses panelize. The default ID is _#nextPanelBtn_. If you set this to 'showNextPanel', you will need to create a matching anchor element (or button) with that ID, e.g. `<div><a href="#" id="showNextPanel">Next</a></div>`. The `showPrevBtnID` operates in the same fashion, but is used for setting up a previous button that will reverse the panelize zoom/pan.

Acknowledgements
----------------
&copy; 2013 R. E. Warner. Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).

jQuery Panelize is authored and maintained by [R. E. Warner](http://russellbits.com) with help from [contributors](http://github.com/russellbits/panelize/contributors) on Github.

+ [My Home Page](http://russellbits.com)
+ [Github profile](http://github.com/russellbits/)
+ Twitter handle: [@belovedleader](http://twitter.com/belovedleader)