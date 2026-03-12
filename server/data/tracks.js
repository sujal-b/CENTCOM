// In-Memory Track Store (Hot Tier)
// Maintains current state vectors for all active tracks

const tracks = new Map();

export function upsertTrack(track) {
    tracks.set(track.id, track);
}

export function getTrack(id) {
    return tracks.get(id) || null;
}

export function getAllTracks() {
    return Array.from(tracks.values());
}

export function getTracksByDomain(domain) {
    return Array.from(tracks.values()).filter(t => t.domain === domain);
}

export function getTracksByBBox(bbox) {
    return Array.from(tracks.values()).filter(t =>
        t.lat >= bbox.south && t.lat <= bbox.north &&
        t.lon >= bbox.west && t.lon <= bbox.east
    );
}

export function getTrackCount() {
    return tracks.size;
}

export function removeTrack(id) {
    tracks.delete(id);
}

export function getStats() {
    const all = Array.from(tracks.values());
    return {
        total: all.length,
        air: all.filter(t => t.domain === 'air').length,
        surface: all.filter(t => t.domain === 'surface').length,
        subsurface: all.filter(t => t.domain === 'subsurface').length,
        unknown: all.filter(t => t.affiliation === 'unknown').length,
        hostile: all.filter(t => t.affiliation === 'hostile').length,
        friendly: all.filter(t => t.affiliation === 'friendly').length,
        neutral: all.filter(t => t.affiliation === 'neutral').length,
        transponderOff: all.filter(t => t.transponderActive === false).length,
        predicted: all.filter(t => t.predicted === true).length
    };
}
