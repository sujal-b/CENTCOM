// Intel Feed Side Panel Component (RAG-driven)

let reports = [];
let searchTimeout = null;

export function initIntelFeed() {
    const panel = document.getElementById('intel-panel');
    panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">📡 Intel Feed</span>
      <button class="panel-close" id="intel-close">✕</button>
    </div>
    <div class="intel-search">
      <input type="text" class="intel-search-input" id="intel-search"
        placeholder="Search reports... (e.g. missile, submarine, Hormuz)" />
    </div>
    <div id="intel-reports"></div>
  `;

    document.getElementById('intel-close').addEventListener('click', () => {
        panel.classList.remove('open');
        document.getElementById('btn-intel')?.classList.remove('active');
    });

    document.getElementById('intel-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchReports(e.target.value), 300);
    });
}

async function searchReports(query) {
    try {
        const url = query
            ? `/api/reports?q=${encodeURIComponent(query)}&limit=30`
            : `/api/reports?limit=30`;
        const resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            reports = data;
            renderReports();
        }
    } catch (err) {
        console.error('[Intel] Search error:', err);
    }
}

export function addReport(report) {
    reports.unshift(report);
    if (reports.length > 100) reports.pop();
    renderReports();
}

export function setReports(reportsData) {
    reports = reportsData || [];
    renderReports();
}

function renderReports() {
    const container = document.getElementById('intel-reports');
    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📡</div>
        <div class="empty-state-text">No intelligence reports</div>
      </div>
    `;
        return;
    }

    container.innerHTML = reports.map(r => {
        const time = r.dtg || new Date(r.timestamp).toISOString().slice(11, 19) + 'Z';
        return `
      <div class="intel-report" data-lat="${r.lat}" data-lon="${r.lon}" onclick="window.dispatchEvent(new CustomEvent('flyTo', {detail:{lat:${r.lat},lon:${r.lon},zoom:10}}))">
        <div class="intel-report-header">
          <span class="intel-priority ${r.priority}">${r.priority}</span>
          <span class="intel-category">${r.category || 'INTEL'}</span>
        </div>
        <div class="intel-report-text">${r.text}</div>
        <div class="intel-report-meta">
          <span>📍 ${r.location || 'UNK'}</span>
          <span>🕐 ${time}</span>
          <span>${r.id}</span>
        </div>
      </div>
    `;
    }).join('');
}

export function getReports() {
    return reports;
}
