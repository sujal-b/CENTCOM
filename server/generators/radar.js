// Primary Surveillance Radar Track Simulator
// Non-cooperative targets — entities without transponders

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

const PSR_ZONES = [
    { name: 'Syria-Lebanon Border', minLat: 33, maxLat: 36, minLon: 35, maxLon: 38 },
    { name: 'Iran Western Border', minLat: 32, maxLat: 37, minLon: 44, maxLon: 48 },
    { name: 'Yemen Coast', minLat: 13, maxLat: 16, minLon: 43, maxLon: 50 },
    { name: 'Iraq Airspace', minLat: 30, maxLat: 36, minLon: 42, maxLon: 48 },
    { name: 'Sinai', minLat: 28, maxLat: 31, minLon: 32, maxLon: 35 },
];

export function createRadarTracks(count = 15) {
    const tracks = [];
    for (let i = 0; i < count; i++) {
        const zone = PSR_ZONES[Math.floor(Math.random() * PSR_ZONES.length)];
        tracks.push({
            id: `PSR-${String(i + 1).padStart(4, '0')}`,
            domain: Math.random() > 0.3 ? 'air' : 'surface',
            source: 'PSR',
            callsign: `UNK-${String(i + 1).padStart(3, '0')}`,
            type: 'unknown',
            affiliation: 'unknown',
            military: true,
            lat: randomInRange(zone.minLat, zone.maxLat),
            lon: randomInRange(zone.minLon, zone.maxLon),
            altitude: Math.random() > 0.3 ? randomInRange(2000, 25000) : 0,
            heading: randomInRange(0, 360),
            speed: randomInRange(100, 400),
            signalStrength: randomInRange(0.3, 1.0),
            transponderActive: false,
            lastSeen: Date.now(),
            trail: []
        });
    }
    return tracks;
}

export function updateRadarTrack(track, dt) {
    track.trail.push({ lat: track.lat, lon: track.lon, alt: track.altitude, t: Date.now() });
    if (track.trail.length > 60) track.trail.shift();

    // Radar tracks are noisier
    track.heading += randomInRange(-5, 5);
    if (track.heading > 360) track.heading -= 360;
    if (track.heading < 0) track.heading += 360;

    track.speed += randomInRange(-10, 10);
    track.speed = Math.max(50, Math.min(500, track.speed));

    // Signal intermittency
    track.signalStrength += randomInRange(-0.1, 0.1);
    track.signalStrength = Math.max(0.1, Math.min(1.0, track.signalStrength));

    const speedKmH = track.speed * 1.852;
    const distKm = speedKmH * (dt / 3600000);
    const headingRad = (track.heading * Math.PI) / 180;
    const dLat = (distKm * Math.cos(headingRad)) / 111.32;
    const dLon = (distKm * Math.sin(headingRad)) / (111.32 * Math.cos((track.lat * Math.PI) / 180));

    track.lat += dLat;
    track.lon += dLon;

    // Respawn if out of theater
    if (track.lat < 10 || track.lat > 42 || track.lon < 25 || track.lon > 66) {
        const zone = PSR_ZONES[Math.floor(Math.random() * PSR_ZONES.length)];
        track.lat = randomInRange(zone.minLat, zone.maxLat);
        track.lon = randomInRange(zone.minLon, zone.maxLon);
        track.heading = randomInRange(0, 360);
        track.trail = [];
    }

    track.lastSeen = Date.now();
    return track;
}
