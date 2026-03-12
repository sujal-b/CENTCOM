// CENTCOM Theater Awareness System — Backend Server
// Express + WebSocket for real-time track streaming and REST APIs

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { createADSBTracks, updateADSBTrack } from './generators/adsb.js';
import { createAISTracks, updateAISTrack } from './generators/ais.js';
import { createRadarTracks, updateRadarTrack } from './generators/radar.js';
import { generateReport, generateInitialReports } from './generators/osint.js';
import { generateATRAlert } from './processing/atr.js';
import { smoothTrack } from './processing/kalman.js';
import { indexReport, searchReports, getReportsByBBox, getRecentReports, getReportCount } from './processing/rag.js';
import { upsertTrack, getTrack, getAllTracks, getTracksByBBox, getStats } from './data/tracks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const TICK_RATE = 2000; // 2 second update cycle
const REPORT_INTERVAL = 8000; // New OSINT report every 8s
const ATR_INTERVAL = 30000; // New ATR alert every 30s

const app = express();
app.use(cors());
app.use(express.json());

// ─── Serve built frontend in production ──────────────────────
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ─── Initialize Tracks ──────────────────────────────────────
console.log('[INIT] Generating simulated tracks...');
const adsbTracks = createADSBTracks(50);
const aisTracks = createAISTracks(80);
const radarTracks = createRadarTracks(15);

const allTracks = [...adsbTracks, ...aisTracks, ...radarTracks];
allTracks.forEach(t => upsertTrack(t));
console.log(`[INIT] ${allTracks.length} tracks initialized`);

// ─── Initialize OSINT Reports ────────────────────────────────
console.log('[INIT] Generating initial OSINT reports...');
const initialReports = generateInitialReports(30);
initialReports.forEach(r => indexReport(r));
console.log(`[INIT] ${initialReports.length} reports indexed`);

// ─── WebSocket Connections ───────────────────────────────────
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    clients.add(ws);

    // Send initial state dump
    ws.send(JSON.stringify({
        type: 'init',
        tracks: getAllTracks().map(stripTrail),
        stats: getStats(),
        reports: getRecentReports(20)
    }));

    ws.on('close', () => {
        clients.delete(ws);
        console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
        console.error('[WS] Error:', err.message);
        clients.delete(ws);
    });
});

function broadcast(data) {
    const msg = JSON.stringify(data);
    for (const ws of clients) {
        if (ws.readyState === 1) ws.send(msg);
    }
}

function stripTrail(track) {
    const { trail, ...rest } = track;
    return rest;
}

// ─── Simulation Loop ─────────────────────────────────────────
let lastTick = Date.now();

setInterval(() => {
    const now = Date.now();
    const dt = now - lastTick;
    lastTick = now;

    // Update all tracks
    const updates = [];
    for (const track of adsbTracks) {
        updateADSBTrack(track, dt);
        smoothTrack(track, dt);
        upsertTrack(track);
        updates.push(stripTrail(track));
    }
    for (const track of aisTracks) {
        updateAISTrack(track, dt);
        smoothTrack(track, dt);
        upsertTrack(track);
        updates.push(stripTrail(track));
    }
    for (const track of radarTracks) {
        updateRadarTrack(track, dt);
        smoothTrack(track, dt);
        upsertTrack(track);
        updates.push(stripTrail(track));
    }

    // Broadcast updates
    broadcast({
        type: 'tracks_update',
        tracks: updates,
        stats: getStats(),
        timestamp: now
    });
}, TICK_RATE);

// Generate new OSINT reports periodically
setInterval(() => {
    const report = generateReport();
    indexReport(report);
    broadcast({
        type: 'new_report',
        report
    });
}, REPORT_INTERVAL);

// Generate ATR alerts periodically
setInterval(() => {
    const alert = generateATRAlert();
    broadcast({
        type: 'atr_alert',
        alert
    });
}, ATR_INTERVAL);

// ─── REST API ────────────────────────────────────────────────
app.get('/api/tracks', (req, res) => {
    const { south, north, west, east, domain } = req.query;
    let tracks;
    if (south && north && west && east) {
        tracks = getTracksByBBox({
            south: parseFloat(south), north: parseFloat(north),
            west: parseFloat(west), east: parseFloat(east)
        });
    } else {
        tracks = getAllTracks();
    }
    if (domain) tracks = tracks.filter(t => t.domain === domain);
    res.json({ tracks, stats: getStats() });
});

app.get('/api/tracks/:id', (req, res) => {
    const track = getTrack(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track not found' });
    res.json(track);
});

app.get('/api/stats', (req, res) => {
    res.json(getStats());
});

app.get('/api/reports', (req, res) => {
    const { q, south, north, west, east, limit } = req.query;
    const lim = parseInt(limit) || 20;

    if (q) {
        const bbox = (south && north && west && east) ? {
            south: parseFloat(south), north: parseFloat(north),
            west: parseFloat(west), east: parseFloat(east)
        } : null;
        res.json(searchReports(q, bbox, lim));
    } else if (south && north && west && east) {
        res.json(getReportsByBBox({
            south: parseFloat(south), north: parseFloat(north),
            west: parseFloat(west), east: parseFloat(east)
        }, lim));
    } else {
        res.json(getRecentReports(lim));
    }
});

app.get('/api/reports/count', (req, res) => {
    res.json({ count: getReportCount() });
});

// ─── SPA fallback (serve index.html for all non-API routes) ─
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Start Server ────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  CENTCOM Theater Awareness System — Server       ║`);
    console.log(`║  Running on port: ${PORT}                            ║`);
    console.log(`║  Tracks:    ${allTracks.length} active                         ║`);
    console.log(`║  Reports:   ${initialReports.length} indexed                         ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
});
