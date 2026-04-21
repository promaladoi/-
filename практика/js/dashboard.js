'use strict';

let map;
const markersLayer = L.layerGroup();
const settlementsLayer = L.layerGroup();
const MAP_ENABLED = true;

const { AppConfig: CFG, AppUtils: U } = window;
if (!CFG || !U) {
  console.error('dashboard: config.js және app-common.js қосылғанын тексеріңіз');
}

const infoPanel = document.getElementById('infoPanel');
const infoContent = document.getElementById('infoContent');
const techContainer = document.getElementById('tech-chips-container');
const operatorFilter = document.getElementById('operator-filter');

const config = {
  mobile:   { chips: ['5G', '4G', '3G', '2G', 'VoLTE'],              operators: ['Kcell', 'Activ', 'Beeline', 'Tele2', 'Altel'],  color: '#60a5fa' },
  internet: { chips: ['Оптика', 'ADSL', 'РРЛ', 'Starlink', 'OneWeb'], operators: ['КТ', 'ТТ', 'Өзге'],                         color: '#a78bfa' },
  masts:    { chips: ['Мачта', 'АМС'],                                 operators: ['28м', '40м', '60м', '80м'],                    color: '#fbbf24' },
  spots:    { chips: ['Ауылдық', 'Қалалық', 'Кокшетау'],               operators: ['Жоғары', 'Орташа', 'Төмен'],                   color: '#f87171' },
  social:   { chips: ['Мектеп', 'Аурухана', 'Әкімдік'],               operators: ['100 Мбит+', '50-100 Мбит', '< 50 Мбит'],       color: '#34d399' },
  project:  { chips: ['Доступный интернет', '5G жоспар'],              operators: ['2025', '2026', '2027'],                         color: '#22d3ee' },
  tourism:  { chips: ['ШБКЗ', 'Бурабай', 'Имантау', 'Жоспар'],        operators: ['Wi-Fi Hotspot', '4G Покрытие', '5G Тест'],      color: '#fb923c' }
};

const db = [];
const coords = [
  { name: "Көкшетау", lat: 53.2833, lng: 69.3833 },
  { name: "Степногорск", lat: 52.35, lng: 71.88 },
  { name: "Бурабай", lat: 53.08, lng: 70.30 },
  { name: "Атбасар", lat: 51.81, lng: 68.35 },
  { name: "Ақколь", lat: 51.98, lng: 70.93 },
  { name: "Аршалы", lat: 51.10, lng: 72.16 },
  { name: "Шортанды", lat: 51.70, lng: 71.00 },
  { name: "Есіл", lat: 51.95, lng: 66.40 },
  { name: "Зеренді", lat: 52.92, lng: 69.10 },
  { name: "Макинск", lat: 52.54, lng: 70.43 },
  { name: "Жақсы", lat: 51.91, lng: 67.29 },
  { name: "Балкашино", lat: 52.52, lng: 68.75 },
  { name: "Ерейментау", lat: 51.62, lng: 73.10 },
  { name: "Қорғалжын", lat: 50.58, lng: 70.01 }
];

coords.forEach((c, idx) => {
  db.push({ cat: 'mobile', lat: c.lat, lng: c.lng, title: c.name + " ұялы байланыс", op: config.mobile.operators[idx % 5], tech: config.mobile.chips[idx % 2], info: "Тұрақты сигнал деңгейі." });
  db.push({ cat: 'internet', lat: c.lat + 0.01, lng: c.lng + 0.01, title: c.name + " ШПД", op: config.internet.operators[idx % 3], tech: config.internet.chips[idx % 3], info: "Жоғары жылдамдықты желі." });
  if (idx % 2 === 0) db.push({ cat: 'masts', lat: c.lat - 0.02, lng: c.lng + 0.02, title: c.name + " АМС", op: config.masts.operators[idx % 4], tech: "АМС", info: "Мұнара биіктігі сәйкес." });
  if (idx % 3 === 0) db.push({ cat: 'spots', lat: c.lat + 0.03, lng: c.lng - 0.03, title: c.name + " ақ дақ", op: "Төмен", tech: "Ауылдық", info: "Байланыс орнату қажет." });
  db.push({ cat: 'social', lat: c.lat - 0.01, lng: c.lng - 0.01, title: c.name + " мектебі", op: "100 Мбит+", tech: "Мектеп", info: "Цифрлық білім беру базасы." });
  if (c.name === "Бурабай" || c.name === "Зеренді") {
    db.push({ cat: 'tourism', lat: c.lat + 0.005, lng: c.lng + 0.005, title: c.name + " тур аймағы", op: "Wi-Fi Hotspot", tech: "Бурабай", info: "Туристер үшін тегін Wi-Fi." });
  }
  if (idx % 4 === 0) {
    db.push({ cat: 'project', lat: c.lat + 0.05, lng: c.lng, title: c.name + " жоспар", op: "2025", tech: "Доступный интернет", info: "Нацпроект аясындағы нысан." });
  }
});

function getIcon(cat) {
  const color = config[cat] ? config[cat].color : '#60a5fa';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="data-marker-dot" style="--dm:${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

const districtData = {
  "Көкшетау": { pop: 145000, area: 1200, internet: "92%", mobile: "98%" },
  "Астана": { pop: 1300000, area: 710, internet: "99%", mobile: "99%" },
  "Ақкөл ауданы": { pop: 38000, area: 8500, internet: "71%", mobile: "85%" },
  "Аршалы ауданы": { pop: 52000, area: 7200, internet: "68%", mobile: "82%" },
  "Атбасар ауданы": { pop: 45000, area: 16100, internet: "65%", mobile: "80%" },
  "Бурабай ауданы": { pop: 71000, area: 5300, internet: "89%", mobile: "94%" },
  "Егіндікөл ауданы": { pop: 12000, area: 12000, internet: "48%", mobile: "65%" },
  "Ерейментау ауданы": { pop: 28000, area: 18700, internet: "55%", mobile: "72%" },
  "Есіл ауданы": { pop: 22000, area: 13400, internet: "52%", mobile: "70%" },
  "Жақсы ауданы": { pop: 19000, area: 9800, internet: "49%", mobile: "68%" },
  "Жарқайың ауданы": { pop: 65000, area: 5100, internet: "81%", mobile: "90%" },
  "Зеренді ауданы": { pop: 43000, area: 6700, internet: "74%", mobile: "87%" },
  "Қорғалжын ауданы": { pop: 14000, area: 18900, internet: "44%", mobile: "62%" },
  "Целиноград ауданы": { pop: 55000, area: 7600, internet: "76%", mobile: "88%" },
  "Шортанды ауданы": { pop: 36000, area: 5900, internet: "72%", mobile: "86%" }
};

let districtTooltip = null;
let selectedDistrictLayer = null;

function getDistrictStyle(feature, highlight) {
  return {
    color:       highlight ? '#0ea5e9' : '#38bdf8',
    weight:      highlight ? 2.2 : 1.15,
    fillColor:   highlight ? '#7dd3fc' : '#bae6fd',
    fillOpacity: highlight ? 0.36 : 0.22,
    dashArray:   '',
    lineJoin:    'round',
    lineCap:     'round'
  };
}

function getSelectedStyle() {
  return {
    color: '#f59e0b',
    weight: 3,
    fillColor: '#7dd3fc',
    fillOpacity: 0.4,
    dashArray: '',
    lineJoin: 'round',
    lineCap: 'round'
  };
}

function getDimmedStyle() {
  return {
    color: '#94a3b8',
    weight: 0.7,
    fillColor: '#e2e8f0',
    fillOpacity: 0.12,
    opacity: 0.45,
    lineJoin: 'round',
    lineCap: 'round'
  };
}

function getDistrictName(props) {
  return props['name:kk'] || props.name_kk ||
      props['name:ru'] || props.name_ru ||
      props.name || 'Аудан';
}

function bringInteractiveLayersToFront() {
  if (settlementsLayer) settlementsLayer.bringToFront();
  markersLayer.bringToFront();
}

function onDistrictHover(e) {
  if (!U) return;
  const layer = e.target;
  if (layer === selectedDistrictLayer) return;
  layer.setStyle(getDistrictStyle(layer.feature, true));
  layer.bringToFront();
  bringInteractiveLayersToFront();
  const props  = layer.feature.properties;
  const nameKk = getDistrictName(props);
  const info   = districtData[nameKk] || {};
  if (districtTooltip) map.closePopup(districtTooltip);
  const safeName = U.escapeHtml(nameKk);
  districtTooltip = L.popup({ closeButton: false, className: 'district-tooltip', offset: [0, -8], autoPan: false })
    .setLatLng(e.latlng)
    .setContent(`
      <div class="dt-title">${safeName}</div>
      ${info.pop      ? `<div class="dt-row"><span>Халық</span><b>${U.escapeHtml(info.pop.toLocaleString('ru'))}</b></div>` : ''}
      ${info.internet ? `<div class="dt-row"><span>Интернет</span><b>${U.escapeHtml(info.internet)}</b></div>` : ''}
      ${info.mobile   ? `<div class="dt-row"><span>Ұялы</span><b>${U.escapeHtml(info.mobile)}</b></div>` : ''}
      <div class="dt-hint">Таңдау үшін басыңыз →</div>
    `)
    .openOn(map);
}

function onDistrictLeave(e) {
  const layer = e.target;
  if (districtTooltip) { map.closePopup(districtTooltip); districtTooltip = null; }
  if (layer === selectedDistrictLayer) return;
  selectedDistrictLayer ? layer.setStyle(getDimmedStyle()) : districtLayer && districtLayer.resetStyle(layer);
}

function onDistrictClick(e) {
  if (districtTooltip) { map.closePopup(districtTooltip); districtTooltip = null; }
  const layer = e.target;
  const name  = getDistrictName(layer.feature.properties);
  if (layer === selectedDistrictLayer) { backToOblast(); return; }
  selectedDistrictLayer = layer;
  if (districtLayer) districtLayer.eachLayer(l => { if (l !== layer) l.setStyle(getDimmedStyle()); });
  layer.setStyle(getSelectedStyle());
  layer.bringToFront();
  bringInteractiveLayersToFront();
  const b = layer.getBounds();
  map.fitBounds(b, { padding: [18, 18], maxZoom: 13, animate: true, duration: 1.0 });
  const c = b.getCenter();
  const targetZoom = Math.max(map.getZoom(), 12);
  map.setView(c, targetZoom, { animate: true, duration: 0.7 });
  showDistrictPanel(name);
  const btn = document.getElementById('backToOblastBtn');
  if (btn) btn.classList.remove('u-hidden');
}

function showDistrictPanel(name) {
  if (!infoPanel || !infoContent || !U) return;
  const info   = districtData[name] || {};
  const iP     = parseInt(String(info.internet || '0'), 10);
  const mP     = parseInt(String(info.mobile || '0'), 10);
  const iColor = iP >= 80 ? '#34d399' : iP >= 60 ? '#fbbf24' : '#f87171';
  const mColor = mP >= 80 ? '#34d399' : mP >= 60 ? '#fbbf24' : '#f87171';
  const titleEl = document.getElementById('infoPanelTitle');
  if (titleEl) titleEl.textContent = 'Аудан мәліметтері';
  const nm = U.escapeHtml(name);
  const popStr = info.pop != null ? U.escapeHtml(String(info.pop.toLocaleString('ru'))) : '';
  const areaStr = info.area != null ? U.escapeHtml(String(info.area.toLocaleString('ru'))) : '';
  const inetStr = U.escapeHtml(String(info.internet || '—'));
  const mobStr = U.escapeHtml(String(info.mobile || '—'));
  infoPanel.classList.add('visible');
  infoContent.innerHTML = `
    <div class="district-detail-card">
      <div class="ddc-name">${nm}</div>
      ${info.pop  ? `<div class="ddc-stat-row"><span class="ddc-label">👥 Халық саны</span><span class="ddc-value">${popStr}</span></div>` : ''}
      ${info.area ? `<div class="ddc-stat-row"><span class="ddc-label">🗺️ Аумақ</span><span class="ddc-value">${areaStr} км²</span></div>` : ''}
      <div class="ddc-divider"></div>
      <div class="ddc-label">🌐 Интернет қамтылуы</div>
      <div class="ddc-progress-wrap">
        <div class="ddc-progress-bar" style="width:${info.internet || '0%'}; background:${iColor}"></div>
        <span class="ddc-pct" style="color:${iColor}">${inetStr}</span>
      </div>
      <div class="ddc-label" style="margin-top:20px">📶 Ұялы байланыс</div>
      <div class="ddc-progress-wrap">
        <div class="ddc-progress-bar" style="width:${info.mobile || '0%'}; background:${mColor}"></div>
        <span class="ddc-pct" style="color:${mColor}">${mobStr}</span>
      </div>
      <div class="ddc-divider"></div>
      <div class="ddc-hint">🗺️ Маркерлерді көру үшін сол панелден категорияны таңдаңыз</div>
    </div>`;
}

function backToOblast() {
  if (!MAP_ENABLED || !map) return;
  selectedDistrictLayer = null;
  if (districtLayer) {
    districtLayer.eachLayer(l => districtLayer.resetStyle(l));
    map.flyToBounds(districtLayer.getBounds(), { padding: [25, 25], duration: 0.9 });
  }
  hideInfoPanel();
  const titleEl = document.getElementById('infoPanelTitle');
  if (titleEl) titleEl.textContent = 'Нүкте мәліметтері';
  const btn = document.getElementById('backToOblastBtn');
  if (btn) btn.classList.add('u-hidden');
}

let districtLayer;

function initMap() {
  map = L.map('leaflet-map', {
    zoomControl: true,
    attributionControl: false,
    minZoom: 6,
    maxZoom: 13,
    zoomSnap: 0.25,
    zoomDelta: 0.5
  }).setView([52.5, 70.0], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    noWrap: true,
    className: 'map-tiles-base'
  }).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    noWrap: true,
    opacity: 0.9,
    className: 'map-tiles-labels'
  }).addTo(map);

  markersLayer.addTo(map);
  settlementsLayer.addTo(map);

  map.on('zoom move zoomend moveend', bringInteractiveLayersToFront);

  function addWorldMask(oblastFeature) {
    try {
      if (!oblastFeature || !oblastFeature.geometry) return;
      const outline = L.geoJSON(oblastFeature, {
        style: {
          color: '#38bdf8',
          weight: 2.8,
          fillOpacity: 0,
          opacity: 0.92,
          dashArray: '10 14',
          lineCap: 'round',
          lineJoin: 'round'
        },
        interactive: false
      }).addTo(map);

      const akmolaBounds = outline.getBounds();
      if (akmolaBounds.isValid()) {
        map.setMaxBounds(akmolaBounds.pad(0.06));
        map.options.maxBoundsViscosity = 1.0;
      }

    } catch(e) { console.warn('Clip error:', e); }
  }

  function hideMapLoader() {
    const loader = document.getElementById('mapLoader');
    if (loader) loader.style.display = 'none';
  }

  function showMapWithoutDistricts() {
    addSettlementMarkers();
    map.setView([52.5, 70.0], 7);
  }

  function loadAkmolaDistricts() {
    const q = `[out:json][timeout:50];
area["name"~"Ақмола|Акмолинская"]["admin_level"="4"]->.reg;
(
relation["admin_level"="4"]["name"~"Ақмола|Акмолинская"];
relation["admin_level"="6"]["boundary"="administrative"](area.reg);
);
out body;
>;
out skel qt;`;
    const url = (CFG && CFG.URLS ? CFG.URLS.OVERPASS : 'https://overpass-api.de/api/interpreter') +
      '?data=' + encodeURIComponent(q);
    const ctl = new AbortController();
    const overpassMs = (CFG && CFG.MAP && CFG.MAP.OVERPASS_TIMEOUT_MS) || 42000;
    const overpassTimer = setTimeout(() => ctl.abort(), overpassMs);
    fetch(url, { signal: ctl.signal })
      .then(r => {
        if (!r.ok) throw new Error('overpass http ' + r.status);
        return r.json();
      })
      .then(osm => {
        clearTimeout(overpassTimer);
        if (!osm.elements || !osm.elements.length) throw new Error('empty');
        const gj = osmtogeojson(osm);
        const lvl = f => parseInt(f.properties.admin_level ||
                                  f.properties['admin_level'] || '0', 10);
        const oblast    = gj.features.find(f => lvl(f) === 4 && f.geometry);
        const districts = gj.features.filter(f => lvl(f) === 6 && f.geometry);
        if (oblast) addWorldMask(oblast);
        const toRender = districts.length ? districts : gj.features.filter(f => f.geometry);
        renderDistricts(toRender.length ? toRender : []);
      })
      .catch(() => {
        clearTimeout(overpassTimer);
        loadFallbackRegion();
      });
  }

  function loadFallbackRegion() {
    const regionsUrl = (CFG && CFG.URLS && CFG.URLS.REGIONS_GEOJSON) ||
      'https://raw.githubusercontent.com/open-data-kazakhstan/geo-boundaries-kz/master/data/geojson/v2/regions.json';
    fetch(regionsUrl)
      .then(r => {
        if (!r.ok) throw new Error('regions http');
        return r.json();
      })
      .then(data => {
        const feat = (data.features || []).filter(f =>
          (f.properties.name_ru || '').includes('Акмолин') ||
          (f.properties.name_kk || '').includes('Ақмола')
        );
        if (feat[0]) addWorldMask(feat[0]);
        renderDistricts(feat);
      })
      .catch(() => {
        console.warn('Шекара деректері жүктелмеді');
        renderDistricts([]);
      });
  }

  function settlementIcon(kind, role) {
    const capital = role === 'Облыс орталығы';
    const k = kind === 'city' ? 'city' : 'village';
    const size = kind === 'city' ? 36 : 28;
    const half = size / 2;
    return L.divIcon({
      className: 'settlement-marker-root',
      html: `<div class="settlement-pin settlement-pin--${k}${capital ? ' settlement-pin--capital' : ''}">
        <span class="settlement-pulse-ring" aria-hidden="true"></span>
        <span class="settlement-glow" aria-hidden="true"></span>
        <span class="settlement-core"></span>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [half, half]
    });
  }

  function addSettlementMarkers() {
    settlementsLayer.clearLayers();

    const cities = [
      { name: "Көкшетау", lat: 53.2833, lng: 69.3833, type: "Облыс орталығы" },
      { name: "Степногорск", lat: 52.35, lng: 71.88, type: "Қала" },
      { name: "Щучинск", lat: 52.93, lng: 70.19, type: "Қала" },
      { name: "Атбасар", lat: 51.81, lng: 68.35, type: "Аудан орталығы" },
      { name: "Ақкөл", lat: 51.98, lng: 70.93, type: "Аудан орталығы" },
      { name: "Есіл", lat: 51.95, lng: 66.40, type: "Аудан орталығы" },
      { name: "Ерейментау", lat: 51.62, lng: 73.10, type: "Аудан орталығы" },
      { name: "Макинск", lat: 52.54, lng: 70.43, type: "Аудан орталығы" },
      { name: "Зеренді", lat: 52.92, lng: 69.10, type: "Аудан орталығы" },
      { name: "Жақсы", lat: 51.91, lng: 67.29, type: "Аудан орталығы" },
      { name: "Шортанды", lat: 51.70, lng: 71.00, type: "Аудан орталығы" },
      { name: "Аршалы", lat: 51.10, lng: 72.16, type: "Аудан орталығы" },
      { name: "Бурабай", lat: 53.08, lng: 70.30, type: "Демалыс аймағы" },
    ];

    const villages = [
      { name: "Қорғалжын", lat: 50.58, lng: 70.01 },
      { name: "Балкашино", lat: 52.52, lng: 68.75 },
      { name: "Кенесары", lat: 52.78, lng: 69.38 },
      { name: "Жолымбет", lat: 51.74, lng: 71.71 },
      { name: "Қабанбай батыр", lat: 52.82, lng: 69.55 },
      { name: "Біржан сал", lat: 52.61, lng: 71.42 },
      { name: "Алексеевка", lat: 53.05, lng: 69.48 },
      { name: "Егіндікөл", lat: 51.05, lng: 69.45 },
      { name: "Қоянды", lat: 53.22, lng: 69.82 },
      { name: "Шұбарқұдық", lat: 51.36, lng: 71.45 },
      { name: "Рузаевка", lat: 52.80, lng: 66.88 },
      { name: "Дамба", lat: 52.45, lng: 70.95 },
      { name: "Жақсыөткел", lat: 51.25, lng: 66.92 },
      { name: "Сандықтау", lat: 52.45, lng: 68.15 },
      { name: "Ондирис", lat: 51.48, lng: 72.05 },
      { name: "Красный Яр", lat: 52.68, lng: 70.12 },
      { name: "Жібек жолы", lat: 51.88, lng: 69.15 },
      { name: "Мәжіліс", lat: 52.35, lng: 69.55 },
      { name: "Көктерек", lat: 52.12, lng: 70.35 },
      { name: "Атамекен", lat: 51.55, lng: 71.88 },
    ];

    cities.forEach(c => {
      const m = L.marker([c.lat, c.lng], {
        icon: settlementIcon('city', c.type),
        zIndexOffset: c.type === 'Облыс орталығы' ? 800 : 500
      });
      const cn = U ? U.escapeHtml(c.name) : c.name;
      const ct = U ? U.escapeHtml(c.type) : c.type;
      m.bindTooltip(`<b>${cn}</b><br/><small class="tt-kind">Қала · ${ct}</small>`, {
        direction: 'top',
        offset: [0, -8],
        opacity: 1,
        sticky: true,
        className: 'settlement-tooltip'
      });
      m.addTo(settlementsLayer);
    });

    villages.forEach(v => {
      const m = L.marker([v.lat, v.lng], {
        icon: settlementIcon('village', ''),
        zIndexOffset: 300
      });
      const vn = U ? U.escapeHtml(v.name) : v.name;
      m.bindTooltip(`<b>${vn}</b><br/><small class="tt-kind">Ауыл</small>`, {
        direction: 'top',
        offset: [0, -6],
        opacity: 1,
        sticky: true,
        className: 'settlement-tooltip settlement-tooltip--village'
      });
      m.addTo(settlementsLayer);
    });

    bringInteractiveLayersToFront();
  }

  function renderDistricts(features) {
    try {
      if (!features || !features.length) {
        showMapWithoutDistricts();
        return;
      }

      districtLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
        style: f => getDistrictStyle(f, false),
        onEachFeature: (feature, layer) => {
          layer.on({ mouseover: onDistrictHover, mouseout: onDistrictLeave, click: onDistrictClick });
        }
      }).addTo(map);

      const akmolaBounds = districtLayer.getBounds();
      map.fitBounds(akmolaBounds, { padding: [30, 30] });
      map.setMaxBounds(akmolaBounds.pad(0.08));
      map.options.maxBoundsViscosity = 1.0;

      const labelsLayer = L.layerGroup();
      features.forEach(f => {
        try {
          const center = L.geoJSON(f).getBounds().getCenter();
          const name = f.properties['name:kk'] || f.properties.name_kk ||
                        f.properties['name:ru'] || f.properties.name_ru ||
                        f.properties.name || '';
          if (!name) return;
          const labelSafe = U ? U.escapeHtml(name) : name;
          labelsLayer.addLayer(L.marker(center, {
            icon: L.divIcon({
              className: 'district-label',
              html: `<span>${labelSafe}</span>`,
              iconSize: [150, 22], iconAnchor: [75, 11]
            }),
            interactive: false
          }));
        } catch(e) {}
      });

      map.on('zoomend', () => {
        map.getZoom() >= 8
          ? (!map.hasLayer(labelsLayer) && labelsLayer.addTo(map))
          : (map.hasLayer(labelsLayer) && map.removeLayer(labelsLayer));
      });

      addSettlementMarkers();
    } catch (e) {
      console.warn('Аудан қабатын сызу қатесі:', e);
      showMapWithoutDistricts();
    } finally {
      hideMapLoader();
    }
  }

  loadAkmolaDistricts();

  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (mode === 'tourism') {
    document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
    const tourTab = document.querySelector('[data-tab="tourism"]');
    if (tourTab) tourTab.classList.add('active');
    switchCategory('tourism');
  } else if (mode === 'project') {
    document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
    const projTab = document.querySelector('[data-tab="project"]');
    if (projTab) projTab.classList.add('active');
    switchCategory('project');
  } else {
    updateUI('mobile');
  }

  setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 150);
}

function updateUI(cat) {
  const c = config[cat] || config.mobile;
  if (techContainer && U) techContainer.innerHTML = U.renderTechChipColumns(c.chips);
  else if (techContainer) {
    const mid = Math.ceil(c.chips.length / 2);
    const col = list =>
      `<div class="filter-column">${list
        .map(chip => {
          const enc = encodeURIComponent(chip);
          const vis = String(chip).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<div class="tech-chip active" data-tech="${enc}">${vis}</div>`;
        })
        .join('')}</div>`;
    techContainer.innerHTML = col(c.chips.slice(0, mid)) + col(c.chips.slice(mid));
  }
  if (operatorFilter && U) U.fillOperatorSelect(operatorFilter, c.operators);
  else if (operatorFilter) {
    operatorFilter.innerHTML = '<option value="all">Барлығы</option>' + c.operators.map(op => `<option value="${op}">${op}</option>`).join('');
  }
  render();
}

if (operatorFilter) operatorFilter.onchange = render;

function render() {
  if (!MAP_ENABLED || !map) return;
  markersLayer.clearLayers();
  const activeCatEl = document.querySelector('.sidebar-category.active');
  if (!activeCatEl) return;
  const activeCat = activeCatEl.dataset.cat;
  const activeChips = U ? U.getActiveTechLabels(techContainer) : Array.from(document.querySelectorAll('.tech-chip.active')).map(c => c.innerText);
  const selOp = operatorFilter ? operatorFilter.value : 'all';

  db.forEach(item => {
    if (item.cat === activeCat && activeChips.includes(item.tech) && (selOp === 'all' || selOp === item.op)) {
      const m = L.marker([item.lat, item.lng], { icon: getIcon(item.cat) });
      m.on('click', () => showInfo(item));
      markersLayer.addLayer(m);
    }
  });
  bringInteractiveLayersToFront();
}

function showInfo(data) {
  if (!infoPanel || !infoContent) return;
  infoPanel.classList.add('visible');
  const color = config[data.cat].color;
  const esc = U ? U.escapeHtml.bind(U) : s => String(s);
  infoContent.innerHTML = `
    <div class="info-panel-detail" style="background: ${color}10; padding: 15px; border-radius: 12px; border-left: 4px solid ${color};">
      <div class="info-label">Нысан атауы</div>
      <div class="info-value" style="margin-bottom: 12px; color: ${color};">${esc(data.title)}</div>
      <div class="info-label">Бөлім</div>
      <div class="info-value" style="text-transform: uppercase; font-size: 13px;">${esc(data.cat)}</div>
      <div class="info-label">Оператор / Түрі</div>
      <div class="info-value">${esc(data.op)} (${esc(data.tech)})</div>
      <div class="info-label">Мәртебесі</div>
      <div class="info-value" style="color: #16a34a;">● Белсенді</div>
      <div class="info-label">Қосымша мәлімет</div>
      <div class="info-value" style="font-size: 14px; color: #64748b; font-weight: normal;">${esc(data.info)}</div>
    </div>
  `;
}

function hideInfoPanel() { if (infoPanel) infoPanel.classList.remove('visible'); }

if (U) U.bindGeminiChat();

document.querySelectorAll('.sidebar-category').forEach(cat => {
  cat.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-category').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    updateUI(this.dataset.cat);
  });
});

document.querySelectorAll('.top-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const mode = this.dataset.tab;
    if (mode === 'tourism') switchCategory('tourism');
    else if (mode === 'project') switchCategory('project');
    else switchCategory('mobile');
  });
});

function switchCategory(catName) {
  document.querySelectorAll('.sidebar-category').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.cat === catName) item.classList.add('active');
  });
  updateUI(catName);
}

if (techContainer && U) U.bindTechChipToggle(techContainer, render);

window.backToOblast = backToOblast;
window.hideInfoPanel = hideInfoPanel;

function renderAkmolaShowcase(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="akmola-showcase akmola-showcase--embed">
      <iframe
        class="akmola-map-embed"
        src="https://map.iaqmola.kz/map"
        title="Ақмола облысы картасы"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
    </div>
  `;
}

function initWithoutMap() {
  const mapEl = document.getElementById('leaflet-map');
  const mapWrap = document.querySelector('.map-canvas-wrap');
  if (mapWrap) mapWrap.classList.add('map-canvas-wrap--empty');
  const filters = document.querySelector('.filter-controls');
  if (filters) filters.classList.add('u-hidden');
  if (infoPanel) infoPanel.classList.add('u-hidden');
  if (mapEl) {
    renderAkmolaShowcase(mapEl);
    mapEl.style.background = 'transparent';
  }
  const loader = document.getElementById('mapLoader');
  if (loader) loader.style.display = 'none';
  const btn = document.getElementById('backToOblastBtn');
  if (btn) btn.classList.add('u-hidden');

  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (mode === 'tourism') {
    document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
    const tourTab = document.querySelector('[data-tab="tourism"]');
    if (tourTab) tourTab.classList.add('active');
    switchCategory('tourism');
  } else if (mode === 'project') {
    document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
    const projTab = document.querySelector('[data-tab="project"]');
    if (projTab) projTab.classList.add('active');
    switchCategory('project');
  } else {
    updateUI('mobile');
  }
}

window.onload = MAP_ENABLED ? initMap : initWithoutMap;