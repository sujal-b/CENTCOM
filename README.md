# CENTCOM Theater Awareness System — Walkthrough

## What Was Built

A full-stack ISR (Intelligence, Surveillance, Reconnaissance) prototype with **145 live-streaming entities** across the Middle East theater, real-time processing, and a premium military command interface.

---

## Architecture (22 files created)

### Backend Server (`server/`)
| File | Purpose |
|------|---------|
| `server.js` | Express + WebSocket server, REST API, simulation loop |
| `generators/adsb.js` | 50 aircraft tracks (fighters, tankers, AWACS, UAVs, airliners) |
| `generators/ais.js` | 80 vessel tracks (destroyers, tankers, carriers, dhows) across 8 maritime zones |
| `generators/radar.js` | 15 PSR contacts (non-cooperative, transponder-off targets) |
| `generators/osint.js` | OSINT reports (Telegram, news, SALUTE, ATR) across 24 real locations |
| `processing/kalman.js` | 2D Kalman filter for track smoothing + prediction during signal loss |
| `processing/rag.js` | TF-IDF vector store with cosine-similarity search + bounding box filtering |
| `processing/atr.js` | Automated target recognition alert generator |
| `data/tracks.js` | In-memory hot-tier track store |

### Frontend (`src/`)
| File | Purpose |
|------|---------|
| `main.js` | Application orchestrator, WebSocket event routing |
| `views/globe.js` | CesiumJS 3D strategic globe view |
| `views/tactical.js` | Deck.gl + MapLibre 2D tactical map (5 render layers) |
| `components/header.js` | Command bar: view toggle, coord toggle, stats, Zulu clock |
| `components/entity-panel.js` | Slide-out entity detail with trail mini-map |
| `components/intel-feed.js` | RAG-powered OSINT report feed with search |
| `components/alerts-bar.js` | ATR alert ticker at bottom |
| `utils/coordinates.js` | DD ↔ MGRS conversion, haversine distance |
| `utils/symbology.js` | MIL-STD-2525 canvas symbol generator |
| `utils/websocket.js` | Auto-reconnecting WebSocket client |
| `styles/index.css` | Full design system (dark military theme, glassmorphism) |

---

## Verification Results

| Test | Result |
|------|--------|
| Backend starts (port 3001) | ✅ 145 tracks, 30 reports |
| Frontend builds (Vite, port 5173) | ✅ No build errors |
| 2D Tactical map renders | ✅ All 145 entities visible with labels |
| Affiliation colors correct | ✅ Blue/red/green/yellow per MIL-STD-2525 |
| Alerts bar populates | ✅ ATR alerts streaming live |
| Cursor coordinate readout | ✅ DD format showing |
| Zulu clock running | ✅ Live UTC time |
| Stats counters | ✅ AIR 61, SFC 84, HOS 13, UNK 28 |
| WebSocket connection | ✅ LIVE status indicator |

---

## How to Run

```bash
# Terminal 1: Start backend
node server/server.js

# Terminal 2: Start frontend
npm run dev
```

Open **http://localhost:5173/** in browser.

> [!NOTE]
> For the **3D Globe** view, replace the placeholder Cesium Ion token in `src/views/globe.js` with your own from [ion.cesium.com](https://ion.cesium.com). The 2D tactical view works without any token.
