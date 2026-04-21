'use strict';

const { AppConfig: CFG, AppUtils: U } = window;
if (!CFG || !U) console.error('telephone: config.js және app-common.js қосыңыз');

let map;
const markersLayer = L.layerGroup();

const infoPanel = document.getElementById('infoPanel');
const infoContent = document.getElementById('infoContent');
const techContainer = document.getElementById('tech-chips-container');
const operatorFilter = document.getElementById('operator-filter');

const config = {
  mobile: { chips: ['5G', '4G', '3G', '2G', 'VoLTE'], operators: ['Kcell', 'Activ', 'Beeline', 'Tele2', 'Altel'], color: '#2563eb' },
  internet: { chips: ['Оптика', 'ADSL', 'РРЛ', 'Starlink', 'OneWeb'], operators: ['КТ', 'ТТ', 'Өзге'], color: '#7c3aed' },
  masts: { chips: ['Мачта', 'АМС'], operators: ['28м', '40м', '60м', '80м'], color: '#ea580c' },
  spots: { chips: ['Ауылдық', 'Қалалық', 'Кокшетау'], operators: ['Жоғары', 'Орташа', 'Төмен'], color: '#dc2626' },
  social: { chips: ['Мектеп', 'Аурухана', 'Әкімдік'], operators: ['100 Мбит+', '50-100 Мбит', '< 50 Мбит'], color: '#16a34a' }
};

const db = [];
const coords = [
  { name: 'Көкшетау', lat: 53.2833, lng: 69.3833 },
  { name: 'Степногорск', lat: 52.35, lng: 71.88 },
  { name: 'Бурабай', lat: 53.08, lng: 70.30 },
  { name: 'Атбасар', lat: 51.81, lng: 68.35 },
  { name: 'Ақколь', lat: 51.98, lng: 70.93 },
  { name: 'Аршалы', lat: 51.10, lng: 72.16 },
  { name: 'Шортанды', lat: 51.70, lng: 71.00 },
  { name: 'Есіл', lat: 51.95, lng: 66.40 },
  { name: 'Зеренді', lat: 52.92, lng: 69.10 },
  { name: 'Макинск', lat: 52.54, lng: 70.43 },
  { name: 'Жақсы', lat: 51.91, lng: 67.29 },
  { name: 'Балкашино', lat: 52.52, lng: 68.75 },
  { name: 'Ерейментау', lat: 51.62, lng: 73.10 },
  { name: 'Қорғалжын', lat: 50.58, lng: 70.01 }
];

coords.forEach((c, idx) => {
  db.push({ cat: 'mobile', lat: c.lat, lng: c.lng, title: `${c.name} ұялы байланыс`, op: config.mobile.operators[idx % 5], tech: config.mobile.chips[idx % 2], info: 'Тұрақты сигнал.' });
  db.push({ cat: 'internet', lat: c.lat + 0.01, lng: c.lng + 0.01, title: `${c.name} ШПД`, op: config.internet.operators[idx % 3], tech: config.internet.chips[idx % 3], info: 'Желі дайын.' });
  if (idx % 2 === 0) db.push({ cat: 'masts', lat: c.lat - 0.02, lng: c.lng + 0.02, title: `${c.name} АМС`, op: config.masts.operators[idx % 4], tech: 'АМС', info: 'Мұнара.' });
  if (idx % 3 === 0) db.push({ cat: 'spots', lat: c.lat + 0.03, lng: c.lng - 0.03, title: `${c.name} ақ дақ`, op: 'Төмен', tech: 'Ауылдық', info: 'Қамту жоқ.' });
  db.push({ cat: 'social', lat: c.lat - 0.01, lng: c.lng - 0.01, title: `${c.name} нысаны`, op: '100 Мбит+', tech: 'Мектеп', info: 'Байланыс бар.' });
});

function getIcon(cat) {
  const color = config[cat] ? config[cat].color : '#3b82f6';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="data-marker-dot" style="--dm:${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function initMap() {
  map = U.createOsmMap('leaflet-map', { center: [...CFG.MAP.CENTER_AKMOLA], zoom: CFG.MAP.ZOOM_DEFAULT });
  markersLayer.addTo(map);
  U.loadAkmolaRegionOnMap(map, CFG.MAP.REGION_STYLE_SUBTLE);
  updateUI('mobile');
}

function updateUI(cat) {
  const c = config[cat] || config.mobile;
  techContainer.innerHTML = U.renderTechChipColumns(c.chips);
  U.fillOperatorSelect(operatorFilter, c.operators);
  render();
}

function render() {
  markersLayer.clearLayers();
  const activeCatEl = document.querySelector('.sidebar-category.active');
  if (!activeCatEl) return;
  const activeCat = activeCatEl.dataset.cat;
  const activeChips = U.getActiveTechLabels(techContainer);
  const selOp = operatorFilter.value;

  db.forEach(item => {
    if (item.cat === activeCat && activeChips.includes(item.tech) && (selOp === 'all' || selOp === item.op)) {
      const m = L.marker([item.lat, item.lng], { icon: getIcon(item.cat) });
      m.on('click', () => showInfo(item));
      markersLayer.addLayer(m);
    }
  });
}

function showInfo(data) {
  infoPanel.classList.add('visible');
  const color = config[data.cat].color;
  const esc = U.escapeHtml;
  infoContent.innerHTML = `
    <div class="info-panel-detail" style="background: ${color}10; padding: 15px; border-radius: 12px; border-left: 4px solid ${color};">
      <div class="info-label">Нысан атауы</div>
      <div class="info-value" style="margin-bottom: 12px; color: ${color};">${esc(data.title)}</div>
      <div class="info-label">Түрі</div>
      <div class="info-value">${esc(data.op)} (${esc(data.tech)})</div>
      <div class="info-label">Мәртебесі</div>
      <div class="info-value" style="color: #16a34a;">● Белсенді</div>
      <div class="info-label">Мәлімет</div>
      <div class="info-value" style="font-size: 14px; color: #64748b; font-weight: normal;">${esc(data.info)}</div>
    </div>
  `;
}

function hideInfoPanel() {
  infoPanel.classList.remove('visible');
}

if (U && CFG && techContainer && operatorFilter) {
  U.bindTechChipToggle(techContainer, render);
  operatorFilter.addEventListener('change', render);
  U.bindGeminiChat();

  const aiSidebar = document.querySelector('.sidebar-ai');
  function toggleAiChat() {
    aiSidebar?.classList.toggle('hidden');
  }

  U.bindSidebarPageNav(null, {
    onBeforeNavigate(cat) {
      if (cat === 'ai') {
        toggleAiChat();
        return false;
      }
      return true;
    }
  });

  window.hideInfoPanel = hideInfoPanel;
  window.onload = initMap;
}