'use strict';

const { AppUtils: U } = window;
if (!U) console.error('communications: config.js → app-common.js ретімен қосыңыз');

let map;
const markersLayer = L.layerGroup();

const infoPanel = document.getElementById('infoPanel');
const infoContent = document.getElementById('infoContent');
const techContainer = document.getElementById('tech-chips-container');

const config = {
  masts: { chips: ['Мачта', 'АМС'], operators: ['28м', '40м', '60м', '80м'] }
};

const db = [
  { cat: 'masts', lat: 51.81, lng: 68.35, title: 'Атбасар мачтасы', op: '60м', tech: 'Мачта', info: 'АМС биіктігі 60м. Жағдайы жақсы.' },
  { cat: 'masts', lat: 53.28, lng: 69.38, title: 'Көкшетау орталық', op: '80м', tech: 'АМС', info: 'Телеорталық мұнарасы.' }
];

function initMap() {
  map = U.createOsmMap('leaflet-map', { center: [52.5, 69.5], zoom: 7 });
  markersLayer.addTo(map);
  U.loadAkmolaRegionOnMap(map);
  updateUI('masts');
}

function updateUI(cat) {
  const c = config[cat] || config.masts;
  techContainer.innerHTML = U.renderTechChipColumns(c.chips);
  const opFilter = document.getElementById('operator-filter');
  U.fillOperatorSelect(opFilter, c.operators);
  render();
}

function render() {
  markersLayer.clearLayers();
  const activeChips = U.getActiveTechLabels(techContainer);
  db.forEach(item => {
    if (activeChips.includes(item.tech)) {
      const m = L.marker([item.lat, item.lng]);
      m.on('click', () => showInfo(item));
      markersLayer.addLayer(m);
    }
  });
}

function showInfo(data) {
  infoPanel.classList.add('visible');
  infoContent.innerHTML =
    `<div><b>${U.escapeHtml(data.title)}</b></div>` +
    `<div>${U.escapeHtml(data.op)} — ${U.escapeHtml(data.tech)}</div>` +
    `<div>${U.escapeHtml(data.info)}</div>`;
}

function hideInfoPanel() {
  infoPanel.classList.remove('visible');
}

if (U && techContainer) {
  U.bindTechChipToggle(techContainer, render);
  U.bindGeminiChat({
    loadingHtml: '...',
    errorHtml: 'Қате.',
    prefixHtml: ''
  });

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