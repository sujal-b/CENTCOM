// Entity Detail Panel Component
import { formatCoords } from '../utils/coordinates.js';
import { getAffiliationColor } from '../utils/symbology.js';

let currentEntity = null;
let trailCanvas = null;
let trailCtx = null;

export function initEntityPanel() {
    const panel = document.getElementById('entity-panel');
    panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Entity Detail</span>
      <button class="panel-close" id="entity-close">✕</button>
    </div>
    <div id="entity-content">
      <div class="empty-state">
        <div class="empty-state-icon">◇</div>
        <div class="empty-state-text">Select an entity on the map</div>
      </div>
    </div>
  `;

    document.getElementById('entity-close').addEventListener('click', () => {
        panel.classList.remove('open');
        currentEntity = null;
        window.dispatchEvent(new CustomEvent('entityDeselected'));
    });
}

export function showEntity(entity) {
    currentEntity = entity;
    const panel = document.getElementById('entity-panel');
    const content = document.getElementById('entity-content');

    const isAir = entity.domain === 'air';
    const name = entity.callsign || entity.name || entity.id;
    const aff = entity.affiliation || 'unknown';
    const coordStr = formatCoords(entity.lat, entity.lon);
    const timeAgo = Math.round((Date.now() - entity.lastSeen) / 1000);

    let dataFields = '';
    if (isAir) {
        dataFields = `
      <div class="entity-data-cell">
        <div class="entity-data-label">Position</div>
        <div class="entity-data-value">${coordStr}</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Altitude</div>
        <div class="entity-data-value">${Math.round(entity.altitude || 0).toLocaleString()} ft</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Heading</div>
        <div class="entity-data-value">${Math.round(entity.heading || 0)}°</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Speed</div>
        <div class="entity-data-value">${Math.round(entity.speed || 0)} kts</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Vert Rate</div>
        <div class="entity-data-value">${Math.round(entity.verticalRate || 0)} fpm</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Squawk</div>
        <div class="entity-data-value">${entity.squawk || 'N/A'}</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">ICAO</div>
        <div class="entity-data-value">${entity.icao || 'N/A'}</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Source</div>
        <div class="entity-data-value">${entity.source || 'UNK'}</div>
      </div>
    `;
    } else {
        dataFields = `
      <div class="entity-data-cell">
        <div class="entity-data-label">Position</div>
        <div class="entity-data-value">${coordStr}</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">MMSI</div>
        <div class="entity-data-value">${entity.mmsi || 'N/A'}</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Heading</div>
        <div class="entity-data-value">${Math.round(entity.heading || 0)}°</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">SOG</div>
        <div class="entity-data-value">${(entity.speed || 0).toFixed(1)} kts</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">COG</div>
        <div class="entity-data-value">${Math.round(entity.cog || entity.heading || 0)}°</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Draft</div>
        <div class="entity-data-value">${(entity.draft || 0).toFixed(1)} m</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Flag</div>
        <div class="entity-data-value">${entity.flag || 'N/A'}</div>
      </div>
      <div class="entity-data-cell">
        <div class="entity-data-label">Destination</div>
        <div class="entity-data-value">${entity.destination || 'N/A'}</div>
      </div>
    `;
    }

    const transponderHtml = entity.transponderActive === false
        ? '<div style="color:var(--accent-red);font-size:11px;font-weight:700;padding:8px 16px;background:var(--accent-red-dim);margin:8px 16px;border-radius:6px;">⚠ TRANSPONDER INACTIVE — TRACK PREDICTED</div>'
        : '';

    const predictedHtml = entity.predicted
        ? '<div style="color:var(--accent-amber);font-size:11px;font-weight:700;padding:8px 16px;background:var(--accent-amber-dim);margin:8px 16px;border-radius:6px;">⚡ KALMAN-PREDICTED POSITION</div>'
        : '';

    content.innerHTML = `
    <div class="entity-callsign" style="color:${getAffiliationColor(aff)}">${name}</div>
    <span class="entity-type-badge ${aff}">${aff.toUpperCase()} · ${(entity.type || 'UNKNOWN').toUpperCase()}</span>
    ${transponderHtml}
    ${predictedHtml}
    <div class="entity-data-grid">
      ${dataFields}
    </div>
    <div class="entity-section-title">Track History</div>
    <canvas class="entity-trail-canvas" id="entity-trail-canvas"></canvas>
    <div style="padding:0 16px 16px;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
      Last update: ${timeAgo}s ago · ID: ${entity.id}
    </div>
  `;

    panel.classList.add('open');
    drawTrail(entity);
}

function drawTrail(entity) {
    const canvas = document.getElementById('entity-trail-canvas');
    if (!canvas || !entity.trail || entity.trail.length < 2) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const trail = entity.trail;
    const lats = trail.map(p => p.lat);
    const lons = trail.map(p => p.lon);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const pad = 10;
    const w = rect.width - pad * 2;
    const h = rect.height - pad * 2;
    const dLat = maxLat - minLat || 0.001;
    const dLon = maxLon - minLon || 0.001;

    const color = getAffiliationColor(entity.affiliation || 'unknown');

    ctx.beginPath();
    trail.forEach((p, i) => {
        const x = pad + ((p.lon - minLon) / dLon) * w;
        const y = pad + h - ((p.lat - minLat) / dLat) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.stroke();

    // Current position dot
    const last = trail[trail.length - 1];
    const lx = pad + ((last.lon - minLon) / dLon) * w;
    const ly = pad + h - ((last.lat - minLat) / dLat) * h;
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.fill();
}

export function updateEntity(track) {
    if (currentEntity && currentEntity.id === track.id) {
        // Merge fields
        Object.assign(currentEntity, track);
        showEntity(currentEntity);
    }
}

export function getCurrentEntityId() {
    return currentEntity ? currentEntity.id : null;
}
