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
- Auto-initializes on `DOMContentLoaded`: calls `querySelectorAll('[data-panelize]')` and creates one independent `Panelize` instance per element, each stored on the element as `el._panelize`

### `paneloverlay.js`
- Exports `PanelOverlay` class as default and named export
- Auto-initializes on `DOMContentLoaded`: calls `querySelectorAll('[data-panel-overlay]')` and creates one independent `PanelOverlay` instance per element

These files are independent — `paneloverlay.js` is optional and only included when the debug overlay is needed.

### `Panelize` Class Interface

```js
class Panelize {
  constructor(containerEl, options = {})  // initializes panels, binds buttons, applies first transform
  transformPanel(dir)                     // 'next' (default) or 'prev'; advances panel index and transforms
  showFullImage()                         // scales full image to fit viewer; called when panelIndex is 0 and fullImageStart is true
}
```

`showFullImage()` and `transformPanel()` are internal methods (not part of the public API) but must be separate, since they use different scaling formulas.

### `<map>` Location Requirement

Both `Panelize` and `PanelOverlay` locate `<area>` elements via `container.querySelectorAll('area')`. This requires the `<map>` element to be a **descendant of the container** element. The HTML `usemap` attribute links by name, but `querySelectorAll('area')` only searches within the container's subtree. If the `<map>` is outside the container, no panels will be found. The `readme.md` must document this requirement.

---

## Data Attributes API

### `panelize.js`

Place `data-panelize` on the viewer container div:

```html
<div data-panelize
     data-full-image-start="true"
     data-next-btn="#nextPanelBtn"
     data-prev-btn="#prevPanelBtn"
     style="width: 600px; height: 400px;">
  <img src="yourComic.jpg" usemap="#panels" />
  <map name="panels">
    <area coords="0,0,300,200" />
    <area coords="300,0,600,200" />
  </map>
</div>

<button id="nextPanelBtn">Next</button>
<button id="prevPanelBtn">Previous</button>
```

**Note:** The `<map>` must be inside the `data-panelize` container. `<area>` elements are located via `container.querySelectorAll('area')`, which only searches within the container's subtree.

Supported `data-*` attributes (all optional):

| Attribute | Default | Description |
|---|---|---|
| `data-full-image-start` | `"true"` | Start with full image scaled to fit |
| `data-next-btn` | `"#nextPanelBtn"` | CSS selector for next button |
| `data-prev-btn` | `"#prevPanelBtn"` | CSS selector for prev button |

**Boolean attribute parsing:** `dataset.fullImageStart` is a string. Parse it as `dataset.fullImageStart !== 'false'` — any value other than the string `"false"` (including absent/default) is treated as `true`.

**Dropped options:** `panelViewerID` (the container is now the element with `data-panelize`), `resetBtnID` (defined in original but had no handler — intentionally dropped), and `nonsense` (test artifact).

The `<img>` element is located via `container.querySelector('img')`. It is expected to be a descendant of the `[data-panelize]` container.

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

The constructor adds the `data-panelize` attribute to the container element if it is not already present, so the injected CSS applies regardless of whether the element was configured via HTML or JS.

The constructor completes the full initialization including applying the initial transform state (full image view or first panel, depending on `fullImageStart`). No additional method call is needed after construction.

### `paneloverlay.js`

Place `data-panel-overlay` on the container wrapping the image:

```html
<div data-panel-overlay style="position: relative;">
  <img src="yourComic.jpg" usemap="#panels" />
</div>
```

Overlay divs are appended directly to the passed container element (not to a hardcoded `#comicOverlay` selector as in the original). This makes `PanelOverlay` self-contained without requiring a specific ID in the DOM.

Programmatic:
```js
import { PanelOverlay } from './paneloverlay.js';
const overlay = new PanelOverlay(document.querySelector('#myContainer'));
```

---

## CSS Animation

All movement and zooming use a single CSS `transform` property on the `<img>` element. No `left`/`top` CSS positioning is used.

On first instantiation, `panelize.js` injects a `<style>` tag into `<head>` (idempotent — checks for an existing tag with `id="panelize-styles"` before injecting):

```css
[data-panelize] {
  position: relative;
  overflow: hidden;
}
[data-panelize] img {
  position: absolute;
  transform-origin: 0 0;
  transition: transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

Because the constructor adds `data-panelize` to the element when instantiated programmatically (see Programmatic API section), this CSS selector applies in all cases.

Each transform update in JS is a single property assignment:

```js
img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
```

**Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` at `400ms` — snappy fast-out, ease-to-stop.

---

## Transform Logic

### Coordinate Space

The original jQuery code positioned the image using CSS `left`/`top` (screen pixels) combined with `transform: scale()` from `transform-origin: 0 0`. The rewrite replaces both with a single CSS `transform: translate(tx, ty) scale(s)`.

**Coordinate space rule:**
- Image-space values (panel coordinates like `panelLeft`, `panelTop`) must be multiplied by `scaleFactor` to convert to screen pixels.
- Screen-space values (centering offsets `xOffset`, `yOffset`, calculated in pixels) must **not** be multiplied by `scaleFactor`.

**In `transformPanel()`:** The original code computes `Xmove = -panelLeft + xOffset` then multiplies the whole thing by `scaleFactor`, which incorrectly scales the already-screen-space `xOffset`. The rewrite preserves this original behavior exactly to avoid visual regressions:

```js
// Preserve original formula (xOffset/yOffset get multiplied by scaleFactor, matching original)
img.style.transform = `translate(${Xmove * scaleFactor}px, ${Ymove * scaleFactor}px) scale(${scaleFactor})`;
```

**In `showFullImage()`:** The original passes `xOffset`/`yOffset` directly as `left`/`top` without multiplying, so they are already in screen space:

```js
// showFullImage: offsets are screen-space, passed directly (no * scaleFactor)
img.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(${scaleFactor})`;
```

These two formulas intentionally differ. Do not "fix" `transformPanel()` to match `showFullImage()` — preserve the original behavior in each path.

### `scaleFactor` Scoping

The original code used an implicit global `scaleFactor`. ES modules are strict mode by default, which would throw a `ReferenceError`. In the rewrite, `scaleFactor` is a class property (`this.scaleFactor`) and set within each transform method.

### Coords Parsing

The original `jquery.panelize.js` passes raw coordinate strings to the `Panel` constructor and relies on JS type coercion. In the rewrite, explicitly parse with `parseInt()` when constructing `Panel` objects to avoid coercion surprises in strict mode:

```js
panels.push(new Panel(
  parseInt(coordsArray[0], 10),
  parseInt(coordsArray[1], 10),
  parseInt(coordsArray[2], 10),
  parseInt(coordsArray[3], 10)
));
```

### Image Rendered Size

The original uses jQuery's `.width()` and `.height()`, which return the element's **rendered** (layout) dimensions — not the intrinsic pixel size. The rewrite must match this behavior using `img.offsetWidth` and `img.offsetHeight`. This matters when CSS or HTML attributes constrain the image's displayed size.

Initialization sequence (guarded against double-init with `this._initialized`):

```js
if (img.complete && img.offsetWidth > 0) {
  this._init();
} else {
  img.addEventListener('load', () => this._init(), { once: true });
  if (img.complete) this._init(); // fallback if 'load' already fired
}

_init() {
  if (this._initialized) return;
  this._initialized = true;
  // ... build panels, apply initial transform
}
```

Auto-init instances (not created via `new`) store the created instance on the element as `el._panelize` so it remains accessible after deferred initialization.

### `area` Filtering

jQuery's `attr('target')` returns `undefined` (not `null`) when the attribute is absent. The original condition:

```js
if($(this).attr("target") != null || $(this).attr("target") == "") {}
```

- Absent: `undefined != null` is `false` (loose equality); `undefined == ""` is `false` → condition `false` → goes to `else` → **processed**
- `target=""`: `"" != null` is `true` → condition `true` → empty body → **skipped**
- `target="something"`: `"something" != null` is `true` → **skipped**

**Intended behavior:** process only areas where the `target` attribute is entirely absent. Equivalent vanilla implementation:

```js
if (area.getAttribute('target') !== null) return; // skip if attribute exists, even if empty
```

`getAttribute('target')` returns `null` when absent and `""` or a string when present, so `!== null` correctly matches the original behavior.

### `transformPanel(dir)` Signature

The refactored method keeps the same direction parameter:

```js
transformPanel(dir) {
  if (dir === 'prev') {
    this.panelIndex -= 1;
  } else {
    this.panelIndex += 1;
  }
  // boundary check and transform follow...
}
```

When called from the `fullImageStart: false` initialization path, it is called with no argument (equivalent to `'next'`), incrementing from `-1` to `0`.

### Panel Index Boundary Behavior

The original uses a single boundary check that resets to `0` in both directions:

```js
if (panelIndex == panels.length || panelIndex < 0) {
  panelIndex = 0;
}
```

- **Next (upper boundary):** When `panelIndex` reaches `panels.length` (past the last panel), it resets to `0` — cycling back to the first panel.
- **Prev (lower boundary):** When `panelIndex` drops below `0` (before the first panel), it also resets to `0` — staying at the first panel without wrapping to the last.

The result: Next cycles continuously through all panels; Prev stops at the first panel rather than cycling backwards. This is the original behavior and must be preserved.

### Portrait/Landscape Logic

The original code sets `portraitMode = true` when `viewerWidth > viewerHeight` — i.e., when the viewer is **landscape**. The variable name is therefore misleading. The downstream condition uses `portraitMode == false` as one branch, making the overall logic work correctly via double-inversion.

**Preserve this exactly as written — do not rename or fix the logic:**

```js
let portraitMode;
if (viewerWidth > viewerHeight) {
  portraitMode = true;   // misleadingly named; viewer is actually landscape
} else {
  portraitMode = false;
}
// ...
if (panelWidth > panelHeight || portraitMode == false) {
  // scale to width (usingWidthAsMax)
} else {
  // scale to height
}
```

### `fullImageStart: true` — Full Image View

When `fullImageStart` is `true`:
1. A synthetic `Panel(0, 0, img.offsetWidth, img.offsetHeight)` is unshifted to the front of the panels array as index `0`. (Uses rendered dimensions — `img.offsetWidth`/`img.offsetHeight` — matching jQuery's `.width()`/`.height()`.)
2. `panelIndex` is set to `0`.
3. `showFullImage()` is called. It does **not** modify `panelIndex`. It computes the full-image transform using `img.offsetWidth` and `img.offsetHeight`:
   - If `img.offsetWidth > img.offsetHeight`: `scaleFactor = viewerWidth / img.offsetWidth`; `yOffset = Math.floor((viewerHeight - img.offsetHeight * scaleFactor) / 2)`; `xOffset = 0`
   - Else: `scaleFactor = viewerHeight / img.offsetHeight`; `xOffset = Math.floor((viewerWidth - img.offsetWidth * scaleFactor) / 2)`; `yOffset = 0`
   - Applies: `translate(${xOffset}px, ${yOffset}px) scale(${scaleFactor})`

When the user first presses Next, `transformPanel('next')` increments `panelIndex` from `0` to `1`, moving to the first real panel.

When pressing Prev from the first real panel (index `1`), `panelIndex` decrements to `0` — the synthetic full-image panel. At this point `transformPanel()` detects `panelIndex === 0` and `fullImageStart === true` and calls `showFullImage()` instead of the regular panel transform formula. Similarly, when cycling wraps from the last panel back to index `0`, `showFullImage()` is called. **`transformPanel()` must check: if `panelIndex === 0 && this.options.fullImageStart`, call `showFullImage()` and return.**

### `fullImageStart: false` Path

When `fullImageStart` is `false`, the constructor sets `panelIndex = -1` and calls `transformPanel()` (no argument, increments to `0`), zooming to the first panel immediately.

### Button Event Handlers

Both next and prev button handlers call `event.preventDefault()` before invoking `transformPanel()`. If the configured button selector resolves to `null` via `document.querySelector()`, the binding is silently skipped — no error is thrown.

---

## PanelOverlay Rewrite

Overlay divs are appended to the container element passed to the constructor. `PanelOverlay` iterates **all** `<area>` elements found within the container — it does **not** apply the `target`-attribute filtering that `Panelize` uses. This matches the original `paneloverlay.js` behavior and is intentional: the overlay is a debug tool that shows all defined areas regardless of whether they are linked.

`PanelOverlay` does not interact with the `<img>` element — no image dimensions are needed.

If no `<area>` elements are found, the constructor silently does nothing.

**Container positioning:** Overlay divs use `position: absolute`. The container must have `position: relative` (or another non-static value) for the overlays to be positioned correctly. `PanelOverlay` does not inject this CSS — it is the user's responsibility. The `readme.md` must document this requirement.

jQuery calls map directly to vanilla DOM:

| jQuery | Vanilla JS |
|---|---|
| `$(this).attr('coords')` | `el.getAttribute('coords')` |
| `$.each(array, fn)` | `array.forEach(fn)` |
| `$('<div></div>')` | `document.createElement('div')` |
| `.css({ top: y })` | `el.style.top = y + 'px'` |
| `.css({ left: x })` | `el.style.left = x + 'px'` |
| `.css({ width: w })` | `el.style.width = w + 'px'` |
| `.css({ height: h })` | `el.style.height = h + 'px'` |
| `.addClass('panel')` | `el.classList.add('panel')` |
| `.text(coords)` | `el.textContent = coords` |
| `.mouseover(fn)` | `el.addEventListener('mouseover', fn)` |
| `.mouseleave(fn)` | `el.addEventListener('mouseleave', fn)` |
| `$('#comicOverlay').append(div)` | `container.appendChild(div)` |

### PanelOverlay CSS Classes

The `.panel` and `.panelHighlight` CSS classes are **not** injected by the module — they must be provided by the user's stylesheet, exactly as in the original. The `readme.md` must document this requirement with example CSS.

---

## Error Handling

- **Missing `<img>` in container:** Constructor logs `console.warn` and returns without initializing.
- **No `<area>` elements found in `Panelize`:** Panels array is empty; next/prev buttons do nothing silently.
- **No `<area>` elements found in `PanelOverlay`:** Constructor silently does nothing.
- **Missing button selector:** Silently skipped — no `TypeError` thrown.
- **Image not yet loaded at construction time:** Constructor defers to `img` `'load'` event (see Image Natural Size section).
- **Malformed `coords` attribute:** `parseInt` returns `NaN`; behavior is undefined for malformed input, same as original.

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
- Auto-init works with only `data-panelize` on the HTML element, no JS required
- Pan/zoom transitions use CSS `transform` and `transition` — no `left`/`top` animation
- `scaleFactor` is a class property, not an implicit global
- Coordinates are parsed with `parseInt` in both modules
- Constructor adds `data-panelize` attribute to element when instantiated programmatically
- `area` elements are skipped if the `target` attribute is present (even if empty)
- `portraitMode` is set to `true` when `viewerWidth > viewerHeight` (inverted name preserved as-is)
- `data-full-image-start="false"` correctly disables full-image start (parsed as `!== 'false'`)
- Image dimensions use `offsetWidth`/`offsetHeight` (rendered size, not `naturalWidth`/`naturalHeight`)
- Overlay divs append to the passed container, not `#comicOverlay`
- `PanelOverlay` processes all `<area>` elements without filtering by `target`
- Button handlers call `event.preventDefault()`; missing selectors are silently skipped
- Construction defers to `img` `'load'` event if image not yet loaded; auto-init stores instance as `el._panelize`

### Reference Transform Values

**Example 1 — height-scaling path (offsetIsX = false, xOffset non-zero):**

Viewer `600×400px`, panel at coords `(100, 50, 400, 350)`:
- `panelWidth = 300`, `panelHeight = 300`
- `viewerWidth (600) > viewerHeight (400)` → `portraitMode = true`
- `panelWidth (300) == panelHeight (300)` → condition `panelWidth > panelHeight || portraitMode == false` = `false`
- `scaleFactor = viewerHeight / panelHeight = 400 / 300 ≈ 1.333`, `offsetIsX = false`
- `scaledPanelWidth = 300 × 1.333 = 400` → `xOffset = (600 − 400) / 2 = 100`
- `Xmove = −100 + 100 = 0`, `Ymove = −50 + 0 = −50`
- Final transform: `translate(${0 × 1.333}px, ${-50 × 1.333}px) scale(1.333)` → `translate(0px, -66.65px) scale(1.333)`

**Example 2 — width-scaling path (offsetIsX = true, yOffset = 0):**

Viewer `600×400px`, panel at coords `(100, 50, 400, 250)`:
- `panelWidth = 300`, `panelHeight = 200`
- `viewerWidth (600) > viewerHeight (400)` → `portraitMode = true`
- `panelWidth (300) > panelHeight (200)` → condition `panelWidth > panelHeight || portraitMode == false` = `true`
- `scaleFactor = 600 / 300 = 2.0`, `offsetIsX = true`
- `scaledPanelHeight = 200 × 2.0 = 400` → `yOffset = (400 − 400) / 2 = 0`
- `Xmove = −100 + 0 = −100`, `Ymove = −50 + 0 = −50`
- Final transform: `translate(-200px, -100px) scale(2)`

### Internal Variable Naming

The original source contains a typo: `scaledPanelWdith` (line 143). In the rewrite, correct this to `scaledPanelWidth`.
