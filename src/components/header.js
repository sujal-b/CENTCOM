// Command Bar / Header Component
import { toggleCoordMode, getCoordMode } from '../utils/coordinates.js';

let statsData = {};
let clockInterval = null;

export function initHeader() {
  const header = document.getElementById('command-bar');
  header.innerHTML = `
    <div class="header-brand">
      <div class="header-brand-icon">◆</div>
      <div class="header-brand-text">
        <div class="header-brand-title">CENTCOM TAS</div>
        <div class="header-brand-subtitle">Theater Awareness System</div>
      </div>
    </div>

    <div class="header-divider"></div>

    <div class="header-controls">
      <button class="btn" id="btn-coords" title="Toggle Coordinate System">
        <span class="btn-icon">📐</span> <span id="coord-mode-label">DD</span>
      </button>
      <button class="btn" id="btn-intel" title="Toggle Intel Feed Panel">
        <span class="btn-icon">📡</span> Intel
      </button>
    </div>

    <div class="header-stats" id="header-stats">
      <div class="stat-item">
        <div class="stat-dot air"></div>
        <span>AIR <strong id="stat-air">0</strong></span>
      </div>
      <div class="stat-item">
        <div class="stat-dot surface"></div>
        <span>SFC <strong id="stat-surface">0</strong></span>
      </div>
      <div class="stat-item">
        <div class="stat-dot hostile"></div>
        <span>HOS <strong id="stat-hostile">0</strong></span>
      </div>
      <div class="stat-item">
        <div class="stat-dot unknown"></div>
        <span>UNK <strong id="stat-unknown">0</strong></span>
      </div>
    </div>

    <div class="header-divider"></div>

    <div class="zulu-clock" id="zulu-clock"></div>

    <div class="connection-status" id="conn-status">
      <div class="connection-dot" id="conn-dot"></div>
      <span id="conn-label">CONNECTING</span>
    </div>
  `;

  // Zulu clock
  updateClock();
  clockInterval = setInterval(updateClock, 1000);



  // Coord toggle
  document.getElementById('btn-coords').addEventListener('click', () => {
    const mode = toggleCoordMode();
    document.getElementById('coord-mode-label').textContent = mode;
    const btn = document.getElementById('btn-coords');
    btn.classList.toggle('active', mode === 'MGRS');
    window.dispatchEvent(new CustomEvent('coordModeChanged', { detail: mode }));
  });

  // Intel toggle
  document.getElementById('btn-intel').addEventListener('click', () => {
    const panel = document.getElementById('intel-panel');
    panel.classList.toggle('open');
    document.getElementById('btn-intel').classList.toggle('active', panel.classList.contains('open'));
  });
}

function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('zulu-clock').textContent = `${h}:${m}:${s}Z`;
}



export function updateStats(stats) {
  statsData = stats;
  const sa = document.getElementById('stat-air');
  const ss = document.getElementById('stat-surface');
  const sh = document.getElementById('stat-hostile');
  const su = document.getElementById('stat-unknown');
  if (sa) sa.textContent = stats.air || 0;
  if (ss) ss.textContent = stats.surface || 0;
  if (sh) sh.textContent = stats.hostile || 0;
  if (su) su.textContent = stats.unknown || 0;
}

export function setConnectionStatus(connected) {
  const dot = document.getElementById('conn-dot');
  const label = document.getElementById('conn-label');
  if (connected) {
    dot.classList.remove('disconnected');
    label.textContent = 'LIVE';
    label.style.color = '#10b981';
  } else {
    dot.classList.add('disconnected');
    label.textContent = 'OFFLINE';
    label.style.color = '#ef4444';
  }
}
