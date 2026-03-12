// Deck.gl 2D Tactical Map — Tactical View
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer, PathLayer, TextLayer, IconLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatCoords } from '../utils/coordinates.js';
import { getAffiliationColor, getSymbolDataURL } from '../utils/symbology.js';

let map = null;
let deck = null;
let currentTracks = [];
let showHeatmap = false;

const AFFILIATION_RGB = {
    friendly: [77, 166, 255],
    hostile: [255, 77, 77],
    neutral: [77, 255, 136],
    unknown: [255, 216, 77],
    pending: [192, 132, 252]
};

// Dark military basemap style
const DARK_STYLE = {
    version: 8,
    name: 'Military Dark',
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '© CARTO © OSM'
        }
    },
    layers: [{
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
            'raster-saturation': -0.5,
            'raster-brightness-max': 0.6,
            'raster-contrast': 0.2
        }
    }]
};

export function initTacticalMap() {
    const container = document.getElementById('tactical-container');

    // Create map canvas container
    const mapDiv = document.createElement('div');
    mapDiv.id = 'tactical-map';
    mapDiv.style.cssText = 'position:absolute;inset:0;';
    container.appendChild(mapDiv);

    // Create deck canvas container
    const deckDiv = document.createElement('div');
    deckDiv.id = 'tactical-deck';
    deckDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    container.appendChild(deckDiv);

    // Initialize MapLibre
    map = new MapLibreMap({
        container: 'tactical-map',
        style: DARK_STYLE,
        center: [45, 25], // Middle East center
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        attributionControl: false
    });

    // Initialize Deck.gl
    deck = new Deck({
        parent: deckDiv,
        initialViewState: {
            longitude: 45,
            latitude: 25,
            zoom: 4
        },
        controller: false,
        getTooltip: ({ object }) => {
            if (object) {
                const name = object.callsign || object.name || object.id;
                return {
                    html: `<div style="font-family:Inter,sans-serif;font-size:12px;padding:6px 10px;background:rgba(10,14,23,0.95);border:1px solid rgba(100,140,200,0.3);border-radius:6px;color:#e8ecf4;">
            <strong>${name}</strong><br/>
            <span style="color:#8899b4">${(object.type || 'UNK').toUpperCase()} · ${(object.affiliation || 'UNK').toUpperCase()}</span><br/>
            <span style="color:#06b6d4;font-family:JetBrains Mono,monospace;font-size:11px">${formatCoords(object.lat, object.lon)}</span>
          </div>`,
                    style: { backgroundColor: 'transparent', padding: '0', border: 'none' }
                };
            }
            return null;
        },
        onClick: ({ object }) => {
            if (object) {
                window.dispatchEvent(new CustomEvent('entitySelected', { detail: object }));
            }
        },
        layers: []
    });

    // Sync map to deck
    map.on('move', () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bearing = map.getBearing();
        const pitch = map.getPitch();
        deck.setProps({
            viewState: {
                longitude: center.lng,
                latitude: center.lat,
                zoom,
                bearing,
                pitch
            }
        });
    });

    // Mouse move for coordinates
    map.on('mousemove', (e) => {
        const coordEl = document.getElementById('cursor-coords');
        coordEl.textContent = formatCoords(e.lngLat.lat, e.lngLat.lng);
        coordEl.classList.add('visible');
    });

    // FlyTo listener
    window.addEventListener('flyTo', (e) => {
        const { lat, lon, zoom } = e.detail;
        map.flyTo({ center: [lon, lat], zoom: zoom || 10, duration: 1500 });
    });

    return { map, deck };
}

export function updateTacticalTracks(tracks) {
    if (!deck) return;
    currentTracks = tracks;
    renderLayers();
}

function renderLayers() {
    if (!deck) return;

    const layers = [
        // Trail / breadcrumb paths
        new PathLayer({
            id: 'trails',
            data: currentTracks.filter(t => t.trail && t.trail.length > 1),
            getPath: d => d.trail.map(p => [p.lon, p.lat]),
            getColor: d => [...(AFFILIATION_RGB[d.affiliation] || AFFILIATION_RGB.unknown), 60],
            getWidth: 1.5,
            widthMinPixels: 1,
            billboard: false,
            pickable: false
        }),

        // Entity scatter points
        new ScatterplotLayer({
            id: 'entities',
            data: currentTracks,
            getPosition: d => [d.smoothLon || d.lon, d.smoothLat || d.lat],
            getRadius: d => d.source === 'PSR' ? 4000 : 5000,
            getFillColor: d => {
                const rgb = AFFILIATION_RGB[d.affiliation] || AFFILIATION_RGB.unknown;
                return [...rgb, d.predicted ? 100 : 200];
            },
            getLineColor: d => {
                const rgb = AFFILIATION_RGB[d.affiliation] || AFFILIATION_RGB.unknown;
                return [...rgb, 255];
            },
            lineWidthMinPixels: 1.5,
            stroked: true,
            filled: true,
            radiusMinPixels: 4,
            radiusMaxPixels: 12,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 80],
            updateTriggers: {
                getPosition: currentTracks.map(t => `${t.lat}${t.lon}`).join(''),
                getFillColor: currentTracks.map(t => t.predicted).join('')
            }
        }),

        // Labels
        new TextLayer({
            id: 'labels',
            data: currentTracks,
            getPosition: d => [d.smoothLon || d.lon, d.smoothLat || d.lat],
            getText: d => d.callsign || d.name || d.id,
            getSize: 11,
            getColor: [232, 236, 244, 200],
            getPixelOffset: [12, -4],
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            outlineColor: [10, 14, 23, 200],
            outlineWidth: 2,
            maxWidth: 200,
            billboard: true,
            sizeMinPixels: 9,
            sizeMaxPixels: 13,
            pickable: false
        }),

        // Velocity vectors
        new PathLayer({
            id: 'velocity-vectors',
            data: currentTracks.filter(t => t.heading && t.speed),
            getPath: d => {
                const lat = d.smoothLat || d.lat;
                const lon = d.smoothLon || d.lon;
                const headingRad = (d.heading * Math.PI) / 180;
                const len = Math.min(d.speed, 300) * 0.005;
                const endLat = lat + len * Math.cos(headingRad);
                const endLon = lon + len * Math.sin(headingRad);
                return [[lon, lat], [endLon, endLat]];
            },
            getColor: d => {
                const rgb = AFFILIATION_RGB[d.affiliation] || AFFILIATION_RGB.unknown;
                return [...rgb, 120];
            },
            getWidth: 1.5,
            widthMinPixels: 1,
            pickable: false
        })
    ];

    // Optional heatmap layer
    if (showHeatmap) {
        layers.push(new HeatmapLayer({
            id: 'heatmap',
            data: currentTracks,
            getPosition: d => [d.smoothLon || d.lon, d.smoothLat || d.lat],
            getWeight: 1,
            radiusPixels: 50,
            intensity: 1,
            threshold: 0.05,
            colorRange: [
                [0, 25, 50, 50],
                [0, 100, 150, 100],
                [0, 180, 200, 150],
                [50, 200, 150, 180],
                [200, 200, 50, 200],
                [255, 100, 50, 220]
            ],
            pickable: false
        }));
    }

    deck.setProps({ layers });
}

export function toggleHeatmap() {
    showHeatmap = !showHeatmap;
    renderLayers();
    return showHeatmap;
}

export function getTacticalMap() {
    return map;
}
