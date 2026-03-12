// CENTCOM Theater Awareness System — Main Entry Point
import './styles/index.css';
import { createWSClient } from './utils/websocket.js';
import { initHeader, updateStats, setConnectionStatus } from './components/header.js';
import { initEntityPanel, showEntity, updateEntity, getCurrentEntityId } from './components/entity-panel.js';
import { initIntelFeed, addReport, setReports } from './components/intel-feed.js';
import { initAlertsBar, addAlert } from './components/alerts-bar.js';
import { initTacticalMap, updateTacticalTracks } from './views/tactical.js';

// ─── Application State ──────────────────────────────────────
let allTracks = new Map();
let isTacticalReady = false;

// ─── Boot Sequence ──────────────────────────────────────────
async function boot() {
    console.log('%c CENTCOM TAS ', 'background:#3b82f6;color:white;font-weight:bold;font-size:14px;padding:4px 8px;border-radius:4px;', 'Initializing...');

    // Show loading screen
    const loading = document.createElement('div');
    loading.className = 'loading-screen';
    loading.id = 'loading-screen';
    loading.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Initializing Theater Awareness System</div>
  `;
    document.body.appendChild(loading);

    // Initialize UI components
    initHeader();
    initEntityPanel();
    initIntelFeed();
    initAlertsBar();

    // Initialize tactical map
    try {
        initTacticalMap();
        isTacticalReady = true;
        console.log('[BOOT] Deck.gl 2D Tactical Map initialized');
    } catch (err) {
        console.warn('[BOOT] Deck.gl init failed:', err.message);
    }

    // Connect WebSocket
    const ws = createWSClient();

    ws.addEventListener('connected', () => {
        setConnectionStatus(true);
        console.log('[WS] Connected to server');
    });

    ws.addEventListener('disconnected', () => {
        setConnectionStatus(false);
        console.log('[WS] Disconnected from server');
    });

    // Handle initial state dump
    ws.addEventListener('init', (e) => {
        const data = e.detail;
        console.log(`[WS] Received initial state: ${data.tracks.length} tracks`);

        // Store all tracks
        for (const track of data.tracks) {
            allTracks.set(track.id, track);
        }

        // Update all views
        const tracksArray = Array.from(allTracks.values());
        if (isTacticalReady) updateTacticalTracks(tracksArray);
        if (data.stats) updateStats(data.stats);
        if (data.reports) setReports(data.reports);

        // Hide loading screen
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.classList.add('hidden');
            setTimeout(() => ls.remove(), 600);
        }
    });

    // Handle track updates
    ws.addEventListener('tracks_update', (e) => {
        const data = e.detail;

        for (const track of data.tracks) {
            allTracks.set(track.id, track);
        }

        const tracksArray = Array.from(allTracks.values());
        if (isTacticalReady) updateTacticalTracks(tracksArray);
        if (data.stats) updateStats(data.stats);

        // Update entity panel if showing a tracked entity
        const selectedId = getCurrentEntityId();
        if (selectedId) {
            const updated = data.tracks.find(t => t.id === selectedId);
            if (updated) updateEntity(updated);
        }
    });

    // Handle new OSINT reports
    ws.addEventListener('new_report', (e) => {
        addReport(e.detail.report);
    });

    // Handle ATR alerts
    ws.addEventListener('atr_alert', (e) => {
        addAlert(e.detail.alert);
    });

    // Handle entity selection from any view
    window.addEventListener('entitySelected', (e) => {
        const track = e.detail;
        // Fetch full track data from server
        fetchTrackDetail(track.id).then(fullTrack => {
            showEntity(fullTrack || track);
        });
    });

    // Handle entity deselection
    window.addEventListener('entityDeselected', () => {
        // Could clear selection highlight in future
    });

    console.log('%c CENTCOM TAS ', 'background:#10b981;color:white;font-weight:bold;font-size:14px;padding:4px 8px;border-radius:4px;', 'System Ready');
}

async function fetchTrackDetail(trackId) {
    try {
        const resp = await fetch(`/api/tracks/${trackId}`);
        if (resp.ok) return await resp.json();
    } catch (err) {
        console.warn('[API] Failed to fetch track detail:', err);
    }
    return null;
}

// ─── Start ──────────────────────────────────────────────────
boot().catch(err => {
    console.error('[BOOT] Fatal error:', err);
});
