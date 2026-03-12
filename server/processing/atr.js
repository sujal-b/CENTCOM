// Automated Target Recognition (ATR) Simulation
// Generates high-priority detection alerts for the UI

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

const ATR_DETECTIONS = [
    { label: 'Fast Attack Craft Cluster', desc: 'SAR imagery confirms cluster of {n}x fast attack craft', threat: 'HIGH', domain: 'surface' },
    { label: 'TEL Movement', desc: 'EO imagery identifies TEL (transporter-erector-launcher) relocation', threat: 'CRITICAL', domain: 'ground' },
    { label: 'SAM Battery Activation', desc: 'SAR change detection: S-300 battery radar in operational mode', threat: 'HIGH', domain: 'ground' },
    { label: 'Submarine Surfacing', desc: 'EO imagery captures possible submarine sail at surface', threat: 'HIGH', domain: 'subsurface' },
    { label: 'Airfield Expansion', desc: 'SAR imagery shows new runway extension and hardened shelters', threat: 'MEDIUM', domain: 'air' },
    { label: 'Port Congestion Anomaly', desc: 'Unusual vessel density ({n} contacts) at port facility', threat: 'MEDIUM', domain: 'surface' },
    { label: 'Ballistic Missile Silo', desc: 'SAR change detection confirms new hardened silo construction', threat: 'CRITICAL', domain: 'ground' },
    { label: 'ASCM Battery', desc: 'Coastal anti-ship cruise missile battery positioned along shoreline', threat: 'HIGH', domain: 'ground' },
    { label: 'Drone Swarm Staging', desc: 'EO imagery shows {n}x UAVs staged at dispersal point', threat: 'HIGH', domain: 'air' },
    { label: 'Mine-Laying Activity', desc: 'Vessel pattern consistent with naval mine deployment', threat: 'CRITICAL', domain: 'surface' },
];

const ATR_LOCATIONS = [
    { name: 'Bandar Abbas', lat: 27.19, lon: 56.27 },
    { name: 'Qeshm Island', lat: 26.84, lon: 55.9 },
    { name: 'Abu Musa Island', lat: 25.87, lon: 55.03 },
    { name: 'Larak Island', lat: 26.85, lon: 56.36 },
    { name: 'Bushehr', lat: 28.97, lon: 50.84 },
    { name: 'Hodeidah', lat: 14.8, lon: 42.95 },
    { name: 'Aden', lat: 12.8, lon: 45.03 },
    { name: 'Tartus', lat: 34.89, lon: 35.89 },
    { name: 'Chabahar', lat: 25.29, lon: 60.64 },
    { name: 'Jask', lat: 25.64, lon: 57.77 },
    { name: 'Isfahan', lat: 32.65, lon: 51.68 },
    { name: 'Parchin', lat: 35.52, lon: 51.77 },
];

let atrCounter = 0;

export function generateATRAlert() {
    atrCounter++;
    const det = ATR_DETECTIONS[Math.floor(Math.random() * ATR_DETECTIONS.length)];
    const loc = ATR_LOCATIONS[Math.floor(Math.random() * ATR_LOCATIONS.length)];
    const n = Math.floor(Math.random() * 8) + 2;

    return {
        id: `ATR-${String(atrCounter).padStart(5, '0')}`,
        type: 'atr_alert',
        label: det.label,
        description: det.desc.replace('{n}', String(n)),
        threat: det.threat,
        domain: det.domain,
        location: loc.name,
        lat: loc.lat + randomInRange(-0.2, 0.2),
        lon: loc.lon + randomInRange(-0.2, 0.2),
        timestamp: Date.now(),
        acknowledged: false
    };
}
