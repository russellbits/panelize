# Panelize — Vanilla JS + CSS Animation Rewrite

**Date:** 2026-03-11
**Status:** Approved

## Overview

Remove the jQuery dependency from Panelize and rewrite both `jquery.panelize.js` and `jquery.paneloverlay.js` as vanilla JavaScript ES modules. Replace jQuery's `.animate()` with CSS `transform` and `transition` for all movement and zooming.

## Goals

- Zero jQuery dependency
- ES module exports (`import` / `export`)
- All pan/zoom animation done via CSS `transform: translate() scale()`
- `data-*` attribute API for zero-JS setup
- Programmatic API still available for advanced use
- Both files converted: main plugin and overlay debug tool

## Non-Goals

- No build step, bundler, or transpilation
- No new features beyond what already exists
- No TypeScript

---

## Architecture

Two separate ES module files:

### `panelize.js`
- Exports `Panelize` class as default and named export
- Auto-initializes on `DOMContentLoaded` for any `[data-panelize]` element found in the DOM

### `paneloverlay.js`
- Exports `PanelOverlay` class as default and named export
- Auto-initializes on `DOMContentLoaded` for any `[data-panel-overlay]` element found in the DOM

These files are independent — `paneloverlay.js` is optional and only included when the debug overlay is needed.

---

## Data Attributes API

### `panelize.js`

Place `data-panelize` on the viewer container div:

```html
<div data-panelize
     data-full-image-start="true"
     data-next-btn="#nextPanelBtn"
     data-prev-btn="#prevPanelBtn">
  <img src="yourComic.jpg" usemap="#panels" />
</div>

<map name="panels">
  <area coords="0,0,300,200" />
  <area coords="300,0,600,200" />
</map>

<button id="nextPanelBtn">Next</button>
<button id="prevPanelBtn">Previous</button>
```

Supported `data-*` attributes (all optional):

| Attribute | Default | Description |
|---|---|---|
| `data-full-image-start` | `"true"` | Start with full image scaled to fit |
| `data-next-btn` | `"#nextPanelBtn"` | CSS selector for next button |
| `data-prev-btn` | `"#prevPanelBtn"` | CSS selector for prev button |

### Programmatic API

```js
import { Panelize } from './panelize.js';

const viewer = document.querySelector('#myViewer');
const p = new Panelize(viewer, {
  fullImageStart: true,
  nextBtn: '#nextPanelBtn',
  prevBtn: '#prevPanelBtn'
});
```

### `paneloverlay.js`

Place `data-panel-overlay` on the container wrapping the image:

```html
<div data-panel-overlay>
  <img src="yourComic.jpg" usemap="#panels" />
</div>
```

Programmatic:
```js
import { PanelOverlay } from './paneloverlay.js';
const overlay = new PanelOverlay(document.querySelector('#myContainer'));
```

---

## CSS Animation

All movement and zooming use a single CSS `transform` property on the `<img>` element:

```css
[data-panelize] img {
  position: absolute;
  transform-origin: 0 0;
  transition: transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

The transition is set via a stylesheet (or injected by the module). Each transform update in JS is a single property assignment:

```js
img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
```

No `left`/`top` CSS positioning — pure transform, GPU-accelerated, no layout reflow.

**Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` at `400ms` — snappy fast-out, ease-to-stop.

---

## Transform Logic

The panel coordinate math is unchanged from the original. Only the application of the result changes.

**Before (jQuery):**
```js
comic.css({ transformOrigin: '0px 0px' })
     .animate({ left: Xmove * scaleFactor, top: Ymove * scaleFactor, scale: scaleFactor });
```

**After (vanilla CSS):**
```js
img.style.transform = `translate(${Xmove * scaleFactor}px, ${Ymove * scaleFactor}px) scale(${scaleFactor})`;
```

The `scaleFactor` calculation, `xOffset`/`yOffset` centering logic, and panel index cycling all remain identical to the original implementation.

---

## PanelOverlay Rewrite

jQuery calls map directly to vanilla DOM:

| jQuery | Vanilla JS |
|---|---|
| `$(this).attr('coords')` | `el.getAttribute('coords')` |
| `$.each(array, fn)` | `array.forEach(fn)` |
| `$('<div></div>')` | `document.createElement('div')` |
| `.css({...})` | `el.style.property = value` |
| `.addClass('panel')` | `el.classList.add('panel')` |
| `.mouseover(fn)` | `el.addEventListener('mouseover', fn)` |
| `.mouseleave(fn)` | `el.addEventListener('mouseleave', fn)` |
| `$('#comicOverlay').append(div)` | `container.appendChild(div)` |

---

## Files Changed

| Action | File |
|---|---|
| Create | `panelize.js` |
| Create | `paneloverlay.js` |
| Delete | `jquery.panelize.js` |
| Delete | `jquery.paneloverlay.js` |
| Delete | `panelize.jquery.json` |
| Update | `readme.md` |

---

## Success Criteria

- No reference to `jQuery` or `$` in any JS file
- `panelize.js` and `paneloverlay.js` work when loaded as `<script type="module">`
- Auto-init works with only `data-panelize` on the HTML element
- Pan/zoom transitions use CSS `transform` and `transition`
- Existing panel coordinate math produces identical results to the original
