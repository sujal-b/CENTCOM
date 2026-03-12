// ADS-B Air Track Simulator
// Generates ~50 aircraft tracks over Middle East / Eastern Mediterranean

const THEATER_BOUNDS = {
    minLat: 12.0, maxLat: 42.0,
    minLon: 25.0, maxLon: 65.0
};

const AIRCRAFT_TYPES = [
    { type: 'fighter', prefix: 'VPR', speed: [400, 550], alt: [15000, 45000], mil: true },
    { type: 'fighter', prefix: 'VENOM', speed: [380, 520], alt: [18000, 42000], mil: true },
    { type: 'tanker', prefix: 'TEXCO', speed: [280, 340], alt: [22000, 32000], mil: true },
    { type: 'awacs', prefix: 'DARKSTAR', speed: [300, 360], alt: [28000, 35000], mil: true },
    { type: 'transport', prefix: 'RCH', speed: [260, 340], alt: [25000, 38000], mil: true },
    { type: 'uav', prefix: 'REAPER', speed: [140, 200], alt: [18000, 28000], mil: true },
    { type: 'patrol', prefix: 'TRIDENT', speed: [250, 320], alt: [5000, 15000], mil: true },
    { type: 'airliner', prefix: 'UAE', speed: [440, 520], alt: [32000, 41000], mil: false },
    { type: 'airliner', prefix: 'QTR', speed: [440, 520], alt: [32000, 41000], mil: false },
    { type: 'airliner', prefix: 'SVA', speed: [440, 520], alt: [32000, 41000], mil: false },
    { type: 'airliner', prefix: 'ETH', speed: [440, 520], alt: [32000, 41000], mil: false },
    { type: 'cargo', prefix: 'GTI', speed: [380, 480], alt: [30000, 39000], mil: false },
    { type: 'helicopter', prefix: 'DUSTOFF', speed: [80, 140], alt: [500, 5000], mil: true },
];

const AFFILIATIONS = {
    fighter: 'friendly', tanker: 'friendly', awacs: 'friendly',
    transport: 'friendly', uav: 'friendly', patrol: 'friendly',
    helicopter: 'friendly', airliner: 'neutral', cargo: 'neutral'
};

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function generateICAO() {
    const chars = '0123456789ABCDEF';
    let hex = '';
    for (let i = 0; i < 6; i++) hex += chars[Math.floor(Math.random() * chars.length)];
    return hex;
}

export function createADSBTracks(count = 50) {
    const tracks = [];
    for (let i = 0; i < count; i++) {
        const template = AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];
        const callsign = `${template.prefix}${Math.floor(Math.random() * 99) + 1}`;
        const track = {
            id: `ADSB-${generateICAO()}`,
            domain: 'air',
            source: 'ADS-B',
            icao: generateICAO(),
            callsign,
            type: template.type,
            affiliation: AFFILIATIONS[template.type],
            military: template.mil,
            lat: randomInRange(THEATER_BOUNDS.minLat, THEATER_BOUNDS.maxLat),
            lon: randomInRange(THEATER_BOUNDS.minLon, THEATER_BOUNDS.maxLon),
            altitude: randomInRange(template.alt[0], template.alt[1]),
            heading: randomInRange(0, 360),
            speed: randomInRange(template.speed[0], template.speed[1]),
            verticalRate: randomInRange(-500, 500),
            squawk: template.mil ? '0000' : String(Math.floor(Math.random() * 7777)).padStart(4, '0'),
            transponderActive: true,
            lastSeen: Date.now(),
            trail: []
        };
        tracks.push(track);
    }
    return tracks;
}

export function updateADSBTrack(track, dt) {
    // Save breadcrumb
    track.trail.push({ lat: track.lat, lon: track.lon, alt: track.altitude, t: Date.now() });
    if (track.trail.length > 120) track.trail.shift();

    // Simulate transponder dropout (5% chance per update for military)
    if (track.military && Math.random() < 0.005) {
        track.transponderActive = !track.transponderActive;
    }

    // Random heading adjustments
    track.heading += randomInRange(-3, 3);
    if (track.heading > 360) track.heading -= 360;
    if (track.heading < 0) track.heading += 360;

    // Speed variations
    track.speed += randomInRange(-5, 5);
    track.speed = Math.max(80, Math.min(600, track.speed));

    // Altitude variations
    track.altitude += track.verticalRate * (dt / 1000);
    if (Math.random() < 0.05) track.verticalRate = randomInRange(-500, 500);
    track.altitude = Math.max(500, Math.min(50000, track.altitude));

    // Position update based on heading and speed
    const speedKmH = track.speed * 1.852; // knots to km/h
    const distKm = speedKmH * (dt / 3600000); // distance in km
    const headingRad = (track.heading * Math.PI) / 180;
    const dLat = (distKm * Math.cos(headingRad)) / 111.32;
    const dLon = (distKm * Math.sin(headingRad)) / (111.32 * Math.cos((track.lat * Math.PI) / 180));

    track.lat += dLat;
    track.lon += dLon;

    // Wrap around theater bounds
    if (track.lat < THEATER_BOUNDS.minLat || track.lat > THEATER_BOUNDS.maxLat ||
        track.lon < THEATER_BOUNDS.minLon || track.lon > THEATER_BOUNDS.maxLon) {
        track.lat = randomInRange(THEATER_BOUNDS.minLat + 5, THEATER_BOUNDS.maxLat - 5);
        track.lon = randomInRange(THEATER_BOUNDS.minLon + 5, THEATER_BOUNDS.maxLon - 5);
        track.heading = randomInRange(0, 360);
        track.trail = [];
    }

    track.lastSeen = Date.now();
    return track;
}
