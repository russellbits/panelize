# Panelize Vanilla JS + CSS Animation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `jquery.panelize.js` and `jquery.paneloverlay.js` as zero-dependency vanilla JS ES modules that use CSS `transform` for all pan/zoom animation.

**Architecture:** Two independent ES modules (`panelize.js`, `paneloverlay.js`) with `data-*` attribute APIs for zero-JS setup and programmatic class-based APIs for advanced use. All animation uses `transform: translate() scale()` with a CSS `transition` — no jQuery, no `left`/`top` positioning.

**Tech Stack:** Vanilla JS (ES2020), CSS custom properties, no build tools, no dependencies.

---

## Chunk 1: `paneloverlay.js`

### Task 1: Create `paneloverlay.js`

**Files:**
- Create: `paneloverlay.js`

- [ ] **Step 1: Create the file with the `PanelOverlay` class**

```js
// paneloverlay.js
// Vanilla JS rewrite of jquery.paneloverlay.js
// Draws debug overlay divs over image map areas.
// Requires user CSS for .panel and .panelHighlight classes.
// The <map> must be a descendant of the container element.
// The container must have position: relative (or non-static).

class PanelOverlay {
  constructor(containerEl) {
    if (!containerEl) return;

    const areas = containerEl.querySelectorAll('area');
    if (areas.length === 0) return;

    areas.forEach((area) => {
      const coords = area.getAttribute('coords');
      if (!coords) return;

      const parts = coords.split(',').map(v => parseInt(v, 10));
      const [x1, y1, x2, y2] = parts;

      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.top    = y1 + 'px';
      div.style.left   = x1 + 'px';
      div.style.width  = (x2 - x1) + 'px';
      div.style.height = (y2 - y1) + 'px';
      div.classList.add('panel');
      div.textContent = coords;

      div.addEventListener('mouseover', () => div.classList.add('panelHighlight'));
      div.addEventListener('mouseleave', () => div.classList.remove('panelHighlight'));

      containerEl.appendChild(div);
    });
  }
}

export { PanelOverlay };
export default PanelOverlay;

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-panel-overlay]').forEach(el => {
    new PanelOverlay(el);
  });
});
```

- [ ] **Step 2: Create a manual test page to verify overlay behavior**

Create `test-overlay.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PanelOverlay Test</title>
  <style>
    #container {
      position: relative;
      display: inline-block;
    }
    .panel {
      position: absolute;
      border: 2px solid rgba(255, 0, 0, 0.5);
      background: rgba(255, 0, 0, 0.1);
      box-sizing: border-box;
      font-size: 10px;
      color: red;
    }
    .panelHighlight {
      background: rgba(255, 0, 0, 0.35);
    }
    #result { margin-top: 1em; font-family: monospace; }
  </style>
</head>
<body>
  <h2>PanelOverlay Test</h2>
  <p>Red boxes should appear over each panel area. Hover to highlight.</p>

  <div id="container" data-panel-overlay>
    <img src="https://placehold.co/600x400" usemap="#testmap" />
    <map name="testmap">
      <area coords="0,0,200,200" />
      <area coords="200,0,400,200" />
      <area coords="400,0,600,200" />
      <area coords="0,200,600,400" />
    </map>
  </div>

  <div id="result"></div>

  <script type="module">
    import PanelOverlay from './paneloverlay.js';

    // Verify: 4 overlay divs created
    const container = document.getElementById('container');
    const divs = container.querySelectorAll('.panel');
    const result = document.getElementById('result');

    if (divs.length === 4) {
      result.textContent = '✅ PASS: 4 overlay divs created';
      result.style.color = 'green';
    } else {
      result.textContent = `❌ FAIL: expected 4 overlay divs, got ${divs.length}`;
      result.style.color = 'red';
    }

    // Verify positions of first div
    const first = divs[0];
    const checks = [
      ['top', '0px'],
      ['left', '0px'],
      ['width', '200px'],
      ['height', '200px'],
    ];
    const failures = checks.filter(([prop, expected]) => first.style[prop] !== expected);
    if (failures.length === 0) {
      result.textContent += ' | ✅ PASS: first div positioned correctly';
    } else {
      result.textContent += ' | ❌ FAIL: ' + JSON.stringify(failures);
    }
  </script>
</body>
</html>
```

- [ ] **Step 3: Open test page and verify**

Run a local server: `python3 -m http.server 8080`

Open `http://localhost:8080/test-overlay.html`

Expected:
- Red boxes visible over each of the 4 panel areas
- Hover over a box → it highlights
- `✅ PASS: 4 overlay divs created | ✅ PASS: first div positioned correctly` in green text

- [ ] **Step 4: Commit**

```bash
git add paneloverlay.js test-overlay.html
git commit -m "feat: add vanilla JS PanelOverlay ES module"
```

---

## Chunk 2: `panelize.js` — Foundation

### Task 2: Panel class, options, CSS injection, and deferred init guard

**Files:**
- Create: `panelize.js` (partial — foundation only)

- [ ] **Step 1: Write the file skeleton with Panel class, options parsing, and CSS injection**

Create `panelize.js`:

```js
// panelize.js
// Vanilla JS rewrite of jquery.panelize.js
// Navigation for images based on HTML image maps.
// The <map> must be a descendant of the [data-panelize] container.

const STYLE_ID = 'panelize-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
[data-panelize] {
  position: relative;
  overflow: hidden;
}
[data-panelize] img {
  position: absolute;
  transform-origin: 0 0;
  transition: transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
  `.trim();
  document.head.appendChild(style);
}

class Panel {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width  = this.x2 - this.x1;
    this.height = this.y2 - this.y1;
  }
}

class Panelize {
  constructor(containerEl, options = {}) {
    if (!containerEl) return;

    // Ensure data-panelize attribute exists so injected CSS applies
    if (!containerEl.hasAttribute('data-panelize')) {
      containerEl.setAttribute('data-panelize', '');
    }

    injectStyles();

    this._container = containerEl;
    this._initialized = false;
    this._panels = [];
    this._panelIndex = 0;

    // Parse options: data-* attributes take precedence when present, options object is fallback
    const ds = containerEl.dataset;
    this._options = {
      fullImageStart : ds.fullImageStart !== undefined
                        ? ds.fullImageStart !== 'false'
                        : (options.fullImageStart !== false),
      nextBtn : ds.nextBtn  ?? options.nextBtn  ?? '#nextPanelBtn',
      prevBtn : ds.prevBtn  ?? options.prevBtn  ?? '#prevPanelBtn',
    };

    const img = containerEl.querySelector('img');
    if (!img) {
      console.warn('Panelize: no <img> found inside container');
      return;
    }
    this._img = img;

    // Defer initialization until image has rendered dimensions
    if (img.complete && img.offsetWidth > 0) {
      this._init();
    } else {
      img.addEventListener('load', () => this._init(), { once: true });
      // Fallback: 'load' may have already fired on a cached image
      if (img.complete) this._init();
    }
  }

  _init() {
    if (this._initialized) return;
    this._initialized = true;
    this._buildPanels();
    this._bindButtons();
    if (this._options.fullImageStart) {
      this._panelIndex = 0;
      this.showFullImage();
    } else {
      this._panelIndex = -1;
      this.transformPanel();
    }
  }

  _buildPanels() {
    const areas = this._container.querySelectorAll('area');
    areas.forEach(area => {
      // Only process areas with no target attribute (matching original filter)
      if (area.getAttribute('target') !== null) return;

      const coords = area.getAttribute('coords');
      if (!coords) return;

      const parts = coords.split(',');
      this._panels.push(new Panel(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10),
        parseInt(parts[2], 10),
        parseInt(parts[3], 10)
      ));
    });

    if (this._options.fullImageStart) {
      // Prepend a synthetic full-image panel at index 0
      this._panels.unshift(new Panel(
        0, 0,
        this._img.offsetWidth,
        this._img.offsetHeight
      ));
    }
  }

  _bindButtons() {
    const nextEl = document.querySelector(this._options.nextBtn);
    const prevEl = document.querySelector(this._options.prevBtn);

    if (nextEl) {
      nextEl.addEventListener('click', (e) => {
        e.preventDefault();
        this.transformPanel('next');
      });
    }

    if (prevEl) {
      prevEl.addEventListener('click', (e) => {
        e.preventDefault();
        this.transformPanel('prev');
      });
    }
  }

  showFullImage() {
    const img         = this._img;
    const viewerWidth  = this._container.offsetWidth;
    const viewerHeight = this._container.offsetHeight;
    const imageWidth   = img.offsetWidth;
    const imageHeight  = img.offsetHeight;

    let scaleFactor, xOffset = 0, yOffset = 0;

    if (imageWidth > imageHeight) {
      scaleFactor = viewerWidth / imageWidth;
      yOffset = Math.floor((viewerHeight - imageHeight * scaleFactor) / 2);
    } else {
      scaleFactor = viewerHeight / imageHeight;
      xOffset = Math.floor((viewerWidth - imageWidth * scaleFactor) / 2);
    }

    this._scaleFactor = scaleFactor;
    img.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(${scaleFactor})`;
  }

  transformPanel(dir) {
    if (dir === 'prev') {
      this._panelIndex -= 1;
    } else {
      this._panelIndex += 1;
    }

    // Boundary: reset to 0 in both directions (matches original behavior)
    if (this._panelIndex === this._panels.length || this._panelIndex < 0) {
      this._panelIndex = 0;
    }

    // Index 0 with fullImageStart: show full image instead of panel formula
    if (this._panelIndex === 0 && this._options.fullImageStart) {
      this.showFullImage();
      return;
    }

    const panel = this._panels[this._panelIndex];
    const viewerWidth  = this._container.offsetWidth;
    const viewerHeight = this._container.offsetHeight;

    const panelTop    = panel.y1;
    const panelLeft   = panel.x1;
    const panelWidth  = panel.width;
    const panelHeight = panel.height;

    let scaleFactor, offsetIsX;
    let xOffset = 0, yOffset = 0;

    // portraitMode is intentionally inverted (matches original): true = landscape viewer
    let portraitMode;
    if (viewerWidth > viewerHeight) {
      portraitMode = true;
    } else {
      portraitMode = false;
    }

    if (panelWidth > panelHeight || portraitMode == false) {
      scaleFactor = viewerWidth / panelWidth;
      offsetIsX = true;
    } else {
      scaleFactor = viewerHeight / panelHeight;
      offsetIsX = false;
    }

    const scaledPanelHeight = Math.floor(panelHeight * scaleFactor);
    const scaledPanelWidth  = Math.floor(panelWidth  * scaleFactor);

    if (offsetIsX) {
      yOffset = Math.floor((viewerHeight - scaledPanelHeight) / 2);
    } else {
      xOffset = Math.floor((viewerWidth - scaledPanelWidth) / 2);
    }

    this._scaleFactor = scaleFactor;

    const Xmove = -panelLeft + xOffset;
    const Ymove = -panelTop  + yOffset;

    // Preserves original formula: both image-coords and screen-space offsets
    // are multiplied by scaleFactor (matches jquery.panelize.js behavior)
    this._img.style.transform =
      `translate(${Xmove * scaleFactor}px, ${Ymove * scaleFactor}px) scale(${scaleFactor})`;
  }
}

export { Panelize };
export default Panelize;

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-panelize]').forEach(el => {
    el._panelize = new Panelize(el);
  });
});
```

- [ ] **Step 2: Create a manual test page for `panelize.js`**

Create `test-panelize.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Panelize Test</title>
  <style>
    body { font-family: sans-serif; padding: 1em; }
    #viewer {
      width: 600px;
      height: 400px;
      border: 2px solid #333;
      background: #111;
    }
    #controls { margin: 1em 0; }
    #log { font-family: monospace; font-size: 12px; margin-top: 1em; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h2>Panelize Test</h2>
  <p>Click Next/Prev to navigate. Should animate smoothly between panels.</p>

  <div id="viewer" data-panelize data-full-image-start="true"
       data-next-btn="#btnNext" data-prev-btn="#btnPrev">
    <img id="comic" src="https://placehold.co/900x600" usemap="#comicmap" />
    <map name="comicmap">
      <area coords="0,0,300,300" />
      <area coords="300,0,900,300" />
      <area coords="0,300,450,600" />
      <area coords="450,300,900,600" />
    </map>
  </div>

  <div id="controls">
    <button id="btnPrev">◀ Prev</button>
    <button id="btnNext">Next ▶</button>
  </div>

  <div id="log"></div>

  <script type="module">
    import { Panelize } from './panelize.js';

    const log = document.getElementById('log');
    function check(label, pass) {
      const el = document.createElement('div');
      el.className = pass ? 'pass' : 'fail';
      el.textContent = (pass ? '✅' : '❌') + ' ' + label;
      log.appendChild(el);
    }

    // Wait for image to load, then run checks
    const img = document.getElementById('comic');
    img.addEventListener('load', () => {
      const viewer = document.getElementById('viewer');
      const p = viewer._panelize;

      check('Panelize instance stored on element', !!p);
      check('CSS injected (style#panelize-styles exists)',
            !!document.getElementById('panelize-styles'));
      check('4 area panels parsed (excluding synthetic full-image panel)',
            p._panels.length === 5); // 4 areas + 1 synthetic full-image

      // fullImageStart: transform should not be empty string
      const t = img.style.transform;
      check('Initial transform applied (fullImageStart)', t.includes('scale'));

      // Reference values for panel index 1 (coords 0,0,300,300):
      // portraitMode = true (viewerWidth 600 > viewerHeight 400, name is inverted)
      // panelWidth=300, panelHeight=300
      // condition (300 > 300 || portraitMode == false) = (false || false) = false
      // → height path: scaleFactor = 400/300 ≈ 1.3333
      // scaledPanelWidth = Math.floor(300*1.3333) = 400
      // xOffset = (600-400)/2 = 100; yOffset = 0
      // Xmove = -0 + 100 = 100, Ymove = -0 + 0 = 0
      // Expected: translate(133.33px, 0px) scale(1.3333...)

      document.getElementById('btnNext').click();
      const t2 = img.style.transform;
      check('transform changes after Next click', t2 !== t);
      check('transform contains scale after Next', t2.includes('scale'));

      // Test fullImageStart: false path
      const viewer2 = document.createElement('div');
      viewer2.setAttribute('data-panelize', '');
      viewer2.setAttribute('data-full-image-start', 'false');
      viewer2.style.width = '600px';
      viewer2.style.height = '400px';
      viewer2.style.position = 'absolute';
      viewer2.style.left = '-9999px';
      const img2 = new Image();
      img2.src = 'https://placehold.co/900x600';
      const map2 = document.createElement('map');
      map2.name = 'testmap2';
      ['0,0,300,300', '300,0,600,300'].forEach(c => {
        const a = document.createElement('area');
        a.setAttribute('coords', c);
        map2.appendChild(a);
      });
      img2.setAttribute('usemap', '#testmap2');
      viewer2.appendChild(img2);
      viewer2.appendChild(map2);
      document.body.appendChild(viewer2);

      img2.addEventListener('load', () => {
        const { Panelize: P } = await import('./panelize.js').catch(() => ({ Panelize: null }));
        if (!P) return;
        const p2 = new P(viewer2, { fullImageStart: false });
        // With fullImageStart false, no synthetic panel prepended → panels.length = 2
        check('fullImageStart:false — 2 panels (no synthetic)', p2._panels.length === 2);
        // panelIndex should be 0 after init
        check('fullImageStart:false — starts at index 0', p2._panelIndex === 0);
      });
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Open test page and verify**

Run: `python3 -m http.server 8080`

Open `http://localhost:8080/test-panelize.html`

Expected (after image loads):
- Green checkmarks for all assertions in the log
- Clicking Next animates the image smoothly to the first real panel
- Clicking Next again advances to the next panel
- Clicking Prev returns toward the full image view

- [ ] **Step 4: Verify reference transform values manually**

In browser DevTools console on `test-panelize.html`:

```js
// After clicking Next once (panel index 1, coords 0,0,300,300):
// Expected portraitMode = true, scaleFactor ≈ 1.333
// Expected transform includes "scale(1.33"
document.querySelector('#viewer img').style.transform
// Should be approximately: translate(133.33px, 0px) scale(1.3333...)
```

- [ ] **Step 5: Commit**

```bash
git add panelize.js test-panelize.html
git commit -m "feat: add vanilla JS Panelize ES module with CSS transform animation"
```

---

## Chunk 3: Cleanup and Documentation

### Task 3: Delete old files and update readme

**Files:**
- Delete: `jquery.panelize.js`
- Delete: `jquery.paneloverlay.js`
- Delete: `panelize.jquery.json`
- Modify: `readme.md`

- [ ] **Step 1: Delete the old jQuery files**

```bash
git rm jquery.panelize.js jquery.paneloverlay.js panelize.jquery.json
```

- [ ] **Step 2: Rewrite `readme.md`**

Use the Write tool to overwrite `readme.md` with the following content (write it directly — do not wrap in a code fence):

Title: `# Panelize`
Subtitle: `#### Navigation for images based on HTML image maps`

Intro paragraph: Panelize is a vanilla JS ES module for navigating web comics, presentations, or any large image using HTML image maps. It pans and zooms to each mapped area using CSS `transform` animation — no jQuery, no dependencies.

**Usage section** — include script tag, then the HTML example with `data-panelize` on the container, `<map>` inside the container, Next/Prev buttons. Note that the `<map>` must be inside the container. No JS required for basic use.

**Settings section** — table of `data-*` attributes: `data-full-image-start` (default `"true"`), `data-next-btn` (default `"#nextPanelBtn"`), `data-prev-btn` (default `"#prevPanelBtn"`).

**Programmatic API section** — JS example: `import { Panelize } from './panelize.js'` then `new Panelize(el, { fullImageStart, nextBtn, prevBtn })`.

**Panel Overlay section** — describe `paneloverlay.js` as a debug tool, show `data-panel-overlay` usage, note `.panel` / `.panelHighlight` CSS classes must be provided by the user, show example CSS.

**Notes section** — bullet points:
- The `<map>` must be **inside** the `data-panelize` or `data-panel-overlay` container
- The container should have an explicit `width` and `height` set
- `paneloverlay.js` requires the container to have `position: relative`
- Areas with a `target` attribute are skipped by Panelize (treated as links, not panels)

**License section** — © R. E. Warner. Released under the MIT License.

- [ ] **Step 3: Verify no jQuery references remain**

```bash
grep -r "jQuery\|\bjQuery\b\|\\\$(" panelize.js paneloverlay.js
```

Expected output: no matches (empty).

- [ ] **Step 4: Verify ES module exports work**

In browser DevTools console on any test page with `type="module"`:

```js
// Should not throw; should log the class name
import('./panelize.js').then(m => console.log(m.Panelize.name));
// Expected: "Panelize"

import('./paneloverlay.js').then(m => console.log(m.PanelOverlay.name));
// Expected: "PanelOverlay"
```

- [ ] **Step 5: Commit**

```bash
git add readme.md
git commit -m "docs: rewrite readme for vanilla JS ES module API"
```

---

## Final Verification Checklist

Before marking complete, verify each success criterion from the spec:

- [ ] No `jQuery` or `$` references in `panelize.js` or `paneloverlay.js`
- [ ] Both files load as `<script type="module">` without errors
- [ ] Auto-init works with only `data-panelize` — no JS required
- [ ] Transitions use `transform` (visible in DevTools Animations panel)
- [ ] `data-full-image-start="false"` starts at first panel (not full image)
- [ ] Areas with `target` attribute are skipped in Panelize
- [ ] Overlay divs appended to container, not a hardcoded `#comicOverlay`
- [ ] `PanelOverlay` shows all areas including any with `target` attributes
- [ ] Next button cycles back to beginning after last panel
- [ ] Prev button at first panel stays at first panel (does not wrap to last)
