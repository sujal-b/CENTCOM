// Alerts Bar Component — ATR detections and track anomalies

const alerts = [];
const MAX_ALERTS = 30;

export function initAlertsBar() {
    const bar = document.getElementById('alerts-bar');
    bar.innerHTML = `
    <span class="alert-label">⚠ ALERTS</span>
    <div class="alerts-container" id="alerts-container"></div>
  `;
}

export function addAlert(alert) {
    alerts.unshift(alert);
    if (alerts.length > MAX_ALERTS) alerts.pop();
    renderAlerts();
}

function renderAlerts() {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    container.innerHTML = alerts.map(a => {
        const time = new Date(a.timestamp).toISOString().slice(11, 19) + 'Z';
        const text = a.label || a.description || a.text || 'Alert';
        const threat = a.threat || 'MEDIUM';

        return `
      <div class="alert-item" onclick="window.dispatchEvent(new CustomEvent('flyTo', {detail:{lat:${a.lat},lon:${a.lon},zoom:12}}))">
        <div class="alert-threat ${threat}"></div>
        <span class="alert-text">${text} — ${a.location || ''}</span>
        <span class="alert-time">${time}</span>
      </div>
    `;
    }).join('');
}

export function getAlerts() {
    return alerts;
}
