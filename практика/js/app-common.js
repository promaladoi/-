'use strict';

(function (global) {
  const cfg = global.AppConfig;
  if (!cfg) {
    console.error('app-common.js: AppConfig жүктелмеді (config.js алдынан қосыңыз)');
    return;
  }

  function escapeHtml(text) {
    if (text == null || text === '') return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function pickRegionFeatures(geojson) {
    const features = geojson?.features;
    if (!Array.isArray(features)) return [];
    return features.filter(f => {
      const n = f?.properties?.name_ru;
      return n === 'Акмолинская область' || n === 'г. Астана';
    });
  }

  function extractGeminiText(data) {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts?.length) return null;
    const t = parts[0]?.text;
    return typeof t === 'string' ? t : null;
  }

  async function loadAkmolaRegionOnMap(map, style) {
    try {
      const res = await fetch(cfg.URLS.REGIONS_GEOJSON);
      if (!res.ok) throw new Error('regions ' + res.status);
      const data = await res.json();
      const features = pickRegionFeatures(data);
      if (!features.length) return;
      const fc = { type: 'FeatureCollection', features };
      const layer = L.geoJSON(fc, { style: style || cfg.MAP.REGION_STYLE }).addTo(map);
      const bounds = layer.getBounds();
      map.fitBounds(bounds);
      // Шеттеріне көбірек (50%) бос орын қосамыз, сонда карта еркін зум жасалады
      map.setMaxBounds(bounds.pad(0.5)); 
    } catch (e) {
      console.warn('[AppUtils] Ақмола шекарасы:', e.message || e);
    }
  }

  function createOsmMap(elementId, opts) {
    const o = opts || {};
    const map = L.map(elementId, {
      center: o.center || [...cfg.MAP.CENTER_AKMOLA],
      zoom: o.zoom != null ? o.zoom : cfg.MAP.ZOOM_DEFAULT,
      minZoom: 3,
      maxZoom: 18,
      scrollWheelZoom: true,
      wheelDebounceTime: 10,
      tap: false // Кейбір құрылғылардағы қақтығыстарды болдырмау үшін
    });
    map.scrollWheelZoom.enable(); // Нақты қосуды растаймыз
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    return map;
  }

  function bindGeminiChat(opts) {
    const o = opts || {};
    const btn = document.querySelector(o.submitSelector || '.ai-chat-submit');
    const input = document.getElementById('ai-chat-input');
    const out = document.getElementById('ai-chat-response');
    if (!btn || !input || !out) return;

    const prefix = o.prefixHtml != null ? o.prefixHtml : '<b>AI:</b> ';
    const loading = o.loadingHtml != null ? o.loadingHtml : '<span class="status-dot active"></span> <em>Ойланып жатыр...</em>';
    const errMsg = o.errorHtml != null ? o.errorHtml : 'Қате орын алды.';

    btn.addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) return;

      const key = cfg.getGeminiApiKey();
      if (!key) {
        out.hidden = false;
        out.innerHTML = escapeHtml('API кілті орнатылмаған.');
        return;
      }

      out.hidden = false;
      out.innerHTML = loading;

      try {
        const url = `${cfg.URLS.GEMINI_GENERATE}?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
        });
        const data = await res.json();
        const reply = extractGeminiText(data);
        if (reply) {
          out.innerHTML = prefix + escapeHtml(reply).replace(/\n/g, '<br>');
        } else {
          const msg = data?.error?.message || errMsg;
          out.innerHTML = escapeHtml(String(msg));
        }
      } catch (e) {
        out.innerHTML = escapeHtml(errMsg);
      }
    });
  }

  function bindSidebarPageNav(extraRoutes, opts) {
    const routes = Object.assign({}, cfg.PAGE_ROUTES, extraRoutes || {});
    const onBefore = opts && opts.onBeforeNavigate;

    document.querySelectorAll('.sidebar-category').forEach(el => {
      el.addEventListener('click', function () {
        const cat = this.dataset.cat;
        if (onBefore && onBefore(cat) === false) return;
        const href = routes[cat];
        if (href) global.location.href = href;
      });
    });
  }

  function escapeChipText(chip) {
    return String(chip)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderTechChipColumns(chips, options) {
    const opt = options || {};
    const activeClass = opt.activeClass != null ? opt.activeClass : 'active';
    const mid = Math.ceil(chips.length / 2);
    const col1 = chips.slice(0, mid);
    const col2 = chips.slice(mid);

    const colHtml = list =>
      `<div class="filter-column">${list
        .map(chip => {
          const enc = encodeURIComponent(chip);
          const visible = escapeChipText(chip);
          return `<div class="tech-chip ${activeClass}" data-tech="${enc}">${visible}</div>`;
        })
        .join('')}</div>`;

    return colHtml(col1) + colHtml(col2);
  }

  function bindTechChipToggle(container, onChange) {
    if (!container) return;
    container.addEventListener('click', e => {
      const chip = e.target.closest('.tech-chip');
      if (!chip || !container.contains(chip)) return;
      chip.classList.toggle('active');
      if (typeof onChange === 'function') onChange();
    });
  }

  function getActiveTechLabels(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('.tech-chip.active')).map(el => {
      const raw = el.getAttribute('data-tech');
      if (raw != null && raw !== '') {
        try {
          return decodeURIComponent(raw);
        } catch {
          return el.textContent.trim();
        }
      }
      return el.textContent.trim();
    });
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function fillOperatorSelect(selectEl, operators, allLabel) {
    if (!selectEl || !operators) return;
    const all = allLabel != null ? allLabel : 'Барлығы';
    selectEl.innerHTML =
      `<option value="all">${escapeHtml(all)}</option>` +
      operators
        .map(op => {
          const v = escapeAttr(op);
          const label = escapeHtml(op);
          return `<option value="${v}">${label}</option>`;
        })
        .join('');
  }

  global.AppUtils = {
    escapeHtml,
    pickRegionFeatures,
    extractGeminiText,
    loadAkmolaRegionOnMap,
    createOsmMap,
    bindGeminiChat,
    bindSidebarPageNav,
    renderTechChipColumns,
    bindTechChipToggle,
    getActiveTechLabels,
    fillOperatorSelect
  };
})(typeof window !== 'undefined' ? window : globalThis);