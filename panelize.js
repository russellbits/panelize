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
      this._panelIndex = -1; // immediately incremented to 0 by transformPanel() below
      this.transformPanel();
    }
  }

  _buildPanels() {
    const areas = this._container.querySelectorAll('area');
    areas.forEach(area => {
      // Skip areas that have a target attribute (even empty) — they are links, not panels.
      // This faithfully replicates the original jQuery behavior (which used a confusingly
      // written but functionally equivalent condition: empty-body if + else for the work).
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
