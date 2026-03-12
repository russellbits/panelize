# Panelize
#### Navigation for images based on HTML image maps

Panelize is a vanilla JS ES module for navigating web comics, presentations, or any large image using HTML image maps. It pans and zooms to each mapped area using CSS `transform` animation — no jQuery, no dependencies.

## Usage

Include the script as an ES module:

    <script type="module" src="panelize.js"></script>

Wrap your image in a container div with `data-panelize`. The `<map>` must be **inside** the container:

    <div data-panelize style="width: 800px; height: 600px;">
      <img src="yourImage.jpg" usemap="#panels" />
      <map name="panels">
        <area coords="0,0,400,300" />
        <area coords="400,0,800,300" />
        <area coords="0,300,800,600" />
      </map>
    </div>

    <button id="nextPanelBtn">Next</button>
    <button id="prevPanelBtn">Previous</button>

That's it — no JavaScript required for basic use.

## Settings

Configure with `data-*` attributes on the container:

| Attribute | Default | Description |
|---|---|---|
| `data-full-image-start` | `"true"` | Show full scaled image first; `"false"` to start at first panel |
| `data-next-btn` | `"#nextPanelBtn"` | CSS selector for the Next button |
| `data-prev-btn` | `"#prevPanelBtn"` | CSS selector for the Prev button |

## Programmatic API

    import { Panelize } from './panelize.js';

    const p = new Panelize(document.querySelector('#myViewer'), {
      fullImageStart: true,
      nextBtn: '#myNextBtn',
      prevBtn: '#myPrevBtn'
    });

## Panel Overlay (debug tool)

`paneloverlay.js` draws colored boxes over all image map areas for visual debugging.

    <script type="module" src="paneloverlay.js"></script>

    <div data-panel-overlay style="position: relative; display: inline-block;">
      <img src="yourImage.jpg" usemap="#panels" />
      <map name="panels">
        <area coords="0,0,400,300" />
      </map>
    </div>

Add CSS for the overlay boxes (the module does not inject these — you must provide them):

    .panel {
      position: absolute;
      border: 2px solid rgba(255, 0, 0, 0.5);
      background: rgba(255, 0, 0, 0.1);
      box-sizing: border-box;
    }
    .panelHighlight {
      background: rgba(255, 0, 0, 0.35);
    }

## Notes

- The `<map>` element must be **inside** the `data-panelize` or `data-panel-overlay` container.
- The container should have an explicit `width` and `height` set.
- `paneloverlay.js` requires the container to have `position: relative`.
- Areas with a `target` attribute are skipped by Panelize (they are treated as links, not panels).

## License

&copy; R. E. Warner. Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
