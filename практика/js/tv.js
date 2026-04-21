'use strict';

const { AppConfig: CFG, AppUtils: U } = window;
if (!CFG || !U) console.error('tv: config.js және app-common.js қосыңыз');

let map;
const markersLayer = L.layerGroup();

const infoPanel = document.getElementById('infoPanel');
const infoContent = document.getElementById('infoContent');
const techContainer = document.getElementById('tech-chips-container');
const operatorFilter = document.getElementById('operator-filter');

const config = {
  mobile: { chips: ['5G', '4G', '3G', '2G', 'VoLTE'], operators: ['Kcell', 'Activ', 'Beeline', 'Tele2', 'Altel'] },
  internet: { chips: ['Оптика', 'ADSL', 'РРЛ', 'Starlink', 'OneWeb'], operators: ['КТ', 'ТТ', 'Өзге'] },
  masts: { chips: ['Мачта', 'АМС'], operators: ['28м', '40м', '60м', '80м'] },
  spots: { chips: ['Ауылдық', 'Қалалық', 'Кокшетау'], operators: ['Жоғары', 'Орташа', 'Төмен'] },
  social: { chips: ['Мектеп', 'Аурухана', 'Әкімдік'], operators: ['100 Мбит+', '50-100 Мбит', '< 50 Мбит'] }
};

const db = [
  { cat: 'internet', lat: 53.28, lng: 69.4, title: 'Көкшетау-Оптика', op: 'КТ', tech: 'Оптика', info: 'Талшықты-оптикалық желі' },
  { cat: 'internet', lat: 51.98, lng: 70.93, title: 'Ақколь (Starlink)', op: 'Өзге', tech: 'Starlink', info: 'Спутниктік интернет' }
];

function initMap() {
  map = U.createOsmMap('leaflet-map', { center: [52.5, 69.5], zoom: 7 });
  markersLayer.addTo(map);
  U.loadAkmolaRegionOnMap(map);
  updateUI('internet');
}

function updateUI(cat) {
  const c = config[cat] || config.internet;
  techContainer.innerHTML = U.renderTechChipColumns(c.chips);
  U.fillOperatorSelect(operatorFilter, c.operators);
  render();
}

function render() {
  markersLayer.clearLayers();
  const activeEl = document.querySelector('.sidebar-category.active');
  if (!activeEl) return;
  const activeCat = activeEl.dataset.cat;
  const activeChips = U.getActiveTechLabels(techContainer);
  const selOp = operatorFilter.value;

  db.forEach(item => {
    if (item.cat === activeCat && activeChips.includes(item.tech) && (selOp === 'all' || selOp === item.op)) {
      const m = L.marker([item.lat, item.lng]);
      m.on('click', () => showInfo(item));
      markersLayer.addLayer(m);
    }
  });
}

function showInfo(data) {
  infoPanel.classList.add('visible');
  const esc = U.escapeHtml;
  infoContent.innerHTML =
    `<div><b>${esc(data.title)}</b></div>` +
    `<div>${esc(data.op)} — ${esc(data.tech)}</div>` +
    `<div>${esc(data.info)}</div>`;
}

function hideInfoPanel() {
  infoPanel.classList.remove('visible');
}

if (U && CFG && techContainer && operatorFilter) {
  U.bindTechChipToggle(techContainer, render);
  operatorFilter.addEventListener('change', render);
  U.bindGeminiChat({
    loadingHtml: '...',
    errorHtml: 'Қате.',
    prefixHtml: ''
  });
  U.bindSidebarPageNav();

  window.hideInfoPanel = hideInfoPanel;
  window.onload = initMap;
}