// AIS Maritime Track Simulator
// Generates ~80 vessel tracks across Red Sea, Persian Gulf, Eastern Mediterranean

const MARITIME_ZONES = [
    { name: 'Persian Gulf', minLat: 24, maxLat: 30, minLon: 48, maxLon: 56 },
    { name: 'Strait of Hormuz', minLat: 25.5, maxLat: 27.5, minLon: 55, maxLon: 58 },
    { name: 'Red Sea North', minLat: 22, maxLat: 30, minLon: 32, maxLon: 40 },
    { name: 'Red Sea South', minLat: 12, maxLat: 22, minLon: 40, maxLon: 46 },
    { name: 'Bab el-Mandeb', minLat: 12, maxLat: 14, minLon: 42, maxLon: 44 },
    { name: 'Eastern Med', minLat: 31, maxLat: 37, minLon: 28, maxLon: 36 },
    { name: 'Gulf of Oman', minLat: 22, maxLat: 26, minLon: 56, maxLon: 62 },
    { name: 'Arabian Sea', minLat: 14, maxLat: 22, minLon: 55, maxLon: 65 },
];

const VESSEL_TYPES = [
    { type: 'tanker', prefix: 'VLCC', speed: [8, 15], draft: [12, 22], mil: false },
    { type: 'container', prefix: 'MSC', speed: [12, 22], draft: [8, 16], mil: false },
    { type: 'bulk_carrier', prefix: 'STAR', speed: [10, 16], draft: [9, 18], mil: false },
    { type: 'lng_carrier', prefix: 'LNG', speed: [14, 20], draft: [10, 14], mil: false },
    { type: 'destroyer', prefix: 'DDG', speed: [18, 32], draft: [6, 10], mil: true },
    { type: 'frigate', prefix: 'FFG', speed: [16, 30], draft: [5, 8], mil: true },
    { type: 'carrier', prefix: 'CVN', speed: [20, 34], draft: [11, 12], mil: true },
    { type: 'amphibious', prefix: 'LHD', speed: [18, 24], draft: [8, 9], mil: true },
    { type: 'patrol', prefix: 'PC', speed: [25, 45], draft: [2, 4], mil: true },
    { type: 'fast_attack', prefix: 'FAC', speed: [30, 50], draft: [1.5, 3], mil: true },
    { type: 'submarine', prefix: 'SSN', speed: [8, 20], draft: [8, 11], mil: true },
    { type: 'fishing', prefix: 'FV', speed: [4, 10], draft: [2, 5], mil: false },
    { type: 'dhow', prefix: 'DHW', speed: [3, 8], draft: [1, 3], mil: false },
];

const FLAGS = ['PA', 'LR', 'MH', 'SG', 'HK', 'BS', 'MT', 'US', 'GB', 'IR', 'SA', 'AE', 'OM', 'YE', 'CN', 'IN'];

const AFFILIATIONS = {
    tanker: 'neutral', container: 'neutral', bulk_carrier: 'neutral',
    lng_carrier: 'neutral', destroyer: 'friendly', frigate: 'friendly',
    carrier: 'friendly', amphibious: 'friendly', patrol: 'unknown',
    fast_attack: 'hostile', submarine: 'unknown', fishing: 'neutral', dhow: 'neutral'
};

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function generateMMSI() {
    return String(Math.floor(200000000 + Math.random() * 599999999));
}

const VESSEL_NAMES = [
    'OCEAN TITAN', 'PACIFIC STAR', 'ARABIAN DAWN', 'GULF PIONEER', 'RED SEA SPIRIT',
    'DESERT WIND', 'PEARL NAVIGATOR', 'CORAL VENTURE', 'EMERALD COAST', 'GOLDEN HORIZON',
    'SILVER WAVE', 'CRYSTAL VOYAGER', 'IRON FORTITUDE', 'JADE CARRIER', 'PHOENIX TRADER',
    'LIBERTY BRIDGE', 'RESOLUTE', 'VALOR', 'SENTINEL', 'GUARDIAN',
    'BATAAN', 'NORMANDY', 'CARNEY', 'MASON', 'NITZE',
    'COLE', 'ROSS', 'PORTER', 'WINSTON CHURCHILL', 'LABOON',
    'FLORIDA', 'GEORGIA', 'HARTFORD', 'ALEXANDRIA', 'SPRINGFIELD'
];

export function createAISTracks(count = 80) {
    const tracks = [];
    for (let i = 0; i < count; i++) {
        const template = VESSEL_TYPES[Math.floor(Math.random() * VESSEL_TYPES.length)];
        const zone = MARITIME_ZONES[Math.floor(Math.random() * MARITIME_ZONES.length)];
        const name = VESSEL_NAMES[Math.floor(Math.random() * VESSEL_NAMES.length)] + (i > 20 ? ` ${i}` : '');
        const track = {
            id: `AIS-${generateMMSI()}`,
            domain: 'surface',
            source: 'AIS',
            mmsi: generateMMSI(),
            name,
            vesselType: template.type,
            type: template.type,
            affiliation: AFFILIATIONS[template.type],
            military: template.mil,
            flag: FLAGS[Math.floor(Math.random() * FLAGS.length)],
            lat: randomInRange(zone.minLat, zone.maxLat),
            lon: randomInRange(zone.minLon, zone.maxLon),
            altitude: 0,
            heading: randomInRange(0, 360),
            cog: randomInRange(0, 360), // Course over ground
            speed: randomInRange(template.speed[0], template.speed[1]), // SOG in knots
            draft: randomInRange(template.draft[0], template.draft[1]),
            destination: ['JEBEL ALI', 'RAS TANURA', 'JEDDAH', 'SUEZ', 'ADEN', 'FUJAIRAH', 'SALALAH', 'HAIFA', 'PIRAEUS'][Math.floor(Math.random() * 9)],
            navStatus: 'underway',
            lastSeen: Date.now(),
            trail: []
        };
        tracks.push(track);
    }
    return tracks;
}

export function updateAISTrack(track, dt) {
    // Save breadcrumb
    track.trail.push({ lat: track.lat, lon: track.lon, t: Date.now() });
    if (track.trail.length > 200) track.trail.shift();

    // Course adjustments (slow, vessels don't turn fast)
    track.heading += randomInRange(-1, 1);
    track.cog = track.heading + randomInRange(-2, 2);
    if (track.heading > 360) track.heading -= 360;
    if (track.heading < 0) track.heading += 360;

    // Speed variations
    track.speed += randomInRange(-0.5, 0.5);
    track.speed = Math.max(1, Math.min(50, track.speed));

    // Position update
    const speedKmH = track.speed * 1.852;
    const distKm = speedKmH * (dt / 3600000);
    const headingRad = (track.heading * Math.PI) / 180;
    const dLat = (distKm * Math.cos(headingRad)) / 111.32;
    const dLon = (distKm * Math.sin(headingRad)) / (111.32 * Math.cos((track.lat * Math.PI) / 180));

    track.lat += dLat;
    track.lon += dLon;

    // Keep in theater
    if (track.lat < 10 || track.lat > 42 || track.lon < 25 || track.lon > 66) {
        const zone = MARITIME_ZONES[Math.floor(Math.random() * MARITIME_ZONES.length)];
        track.lat = randomInRange(zone.minLat, zone.maxLat);
        track.lon = randomInRange(zone.minLon, zone.maxLon);
        track.heading = randomInRange(0, 360);
        track.trail = [];
    }

    track.lastSeen = Date.now();
    return track;
}
