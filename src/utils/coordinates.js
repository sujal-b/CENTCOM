// Coordinate Conversion Utilities
// DD (Decimal Degrees) ↔ MGRS (Military Grid Reference System)

// ─── MGRS Conversion ────────────────────────────────────────
const MGRS_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ZONE_LETTERS = 'CDEFGHJKLMNPQRSTUVWX';

export function ddToMGRS(lat, lon) {
    if (lat < -80 || lat > 84) return 'N/A'; // MGRS doesn't cover poles

    // UTM zone number
    const zoneNum = Math.floor((lon + 180) / 6) + 1;

    // Zone letter
    const zoneLetterIdx = Math.floor((lat + 80) / 8);
    const zoneLetter = ZONE_LETTERS[Math.min(zoneLetterIdx, ZONE_LETTERS.length - 1)];

    // Convert to UTM
    const { easting, northing } = latLonToUTM(lat, lon, zoneNum);

    // 100km grid square
    const col = Math.floor(easting / 100000);
    const row = Math.floor(northing / 100000) % 20;
    const setNum = ((zoneNum - 1) % 6);

    // Column letter
    const colLetterIdx = ((setNum * 8) + col - 1) % 24;
    const colLetter = MGRS_LETTERS[colLetterIdx >= 0 ? colLetterIdx : colLetterIdx + 24];

    // Row letter
    const rowOffset = (setNum % 2 === 0) ? 0 : 5;
    const rowLetterIdx = (row + rowOffset) % 20;
    // Use a subset of letters for rows
    const ROW_LETTERS = 'ABCDEFGHJKLMNPQRSTUV';
    const rowLetter = ROW_LETTERS[rowLetterIdx];

    // 5-digit easting/northing within 100km square
    const e5 = String(Math.floor(easting % 100000)).padStart(5, '0');
    const n5 = String(Math.floor(northing % 100000)).padStart(5, '0');

    return `${zoneNum}${zoneLetter} ${colLetter}${rowLetter} ${e5} ${n5}`;
}

function latLonToUTM(lat, lon, zone) {
    const a = 6378137; // WGS84 semi-major axis
    const f = 1 / 298.257223563;
    const e2 = 2 * f - f * f;
    const e_prime2 = e2 / (1 - e2);

    const latRad = lat * Math.PI / 180;
    const lonRad = lon * Math.PI / 180;
    const lonOrigin = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;

    const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
    const T = Math.tan(latRad) * Math.tan(latRad);
    const C = e_prime2 * Math.cos(latRad) * Math.cos(latRad);
    const A = Math.cos(latRad) * (lonRad - lonOrigin);
    const M = a * (
        (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad -
        (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad) +
        (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad) -
        (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad)
    );

    const k0 = 0.9996;

    const easting = k0 * N * (
        A + (1 - T + C) * A * A * A / 6 +
        (5 - 18 * T + T * T + 72 * C - 58 * e_prime2) * A * A * A * A * A / 120
    ) + 500000;

    let northing = k0 * (
        M + N * Math.tan(latRad) * (
            A * A / 2 +
            (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 +
            (61 - 58 * T + T * T + 600 * C - 330 * e_prime2) * A * A * A * A * A * A / 720
        )
    );

    if (lat < 0) northing += 10000000;

    return { easting, northing };
}

// ─── DD Format ───────────────────────────────────────────────
export function formatDD(lat, lon) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(5)}°${latDir}  ${Math.abs(lon).toFixed(5)}°${lonDir}`;
}

// ─── Distance ────────────────────────────────────────────────
export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceToNM(km) {
    return km / 1.852;
}

// ─── Bounding Box ────────────────────────────────────────────
export function getBBoxFromCenter(lat, lon, radiusKm) {
    const dLat = radiusKm / 111.32;
    const dLon = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
    return { south: lat - dLat, north: lat + dLat, west: lon - dLon, east: lon + dLon };
}

// State
let coordMode = 'DD'; // 'DD' or 'MGRS'

export function getCoordMode() { return coordMode; }
export function setCoordMode(mode) { coordMode = mode; }
export function toggleCoordMode() {
    coordMode = coordMode === 'DD' ? 'MGRS' : 'DD';
    return coordMode;
}

export function formatCoords(lat, lon) {
    return coordMode === 'MGRS' ? ddToMGRS(lat, lon) : formatDD(lat, lon);
}
