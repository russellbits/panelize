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
