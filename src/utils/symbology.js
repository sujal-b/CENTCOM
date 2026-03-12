// MIL-STD-2525 Symbol Generator
// Renders military symbology as Canvas elements

const AFFILIATION_COLORS = {
    friendly: { fill: '#80c0ff', stroke: '#4da6ff', bg: 'rgba(77, 166, 255, 0.2)' },
    hostile: { fill: '#ff8080', stroke: '#ff4d4d', bg: 'rgba(255, 77, 77, 0.2)' },
    neutral: { fill: '#80ff99', stroke: '#4dff88', bg: 'rgba(77, 255, 136, 0.2)' },
    unknown: { fill: '#ffe680', stroke: '#ffd84d', bg: 'rgba(255, 216, 77, 0.2)' },
    pending: { fill: '#d8b4fe', stroke: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)' }
};

const DOMAIN_SHAPES = {
    air: 'arc',         // Semicircle (dome)
    surface: 'circle',  // Circle
    subsurface: 'arc_inverted', // Inverted semicircle
    ground: 'rectangle' // Rectangle
};

// Symbol icon labels by type
const TYPE_LABELS = {
    fighter: 'F', tanker: 'K', awacs: 'E', transport: 'C', uav: 'U',
    patrol: 'P', helicopter: 'H', airliner: 'A', cargo: 'G',
    destroyer: 'DD', frigate: 'FF', carrier: 'CV', amphibious: 'LA',
    fast_attack: 'FA', submarine: 'SS', tanker_ship: 'TK',
    container: 'CO', bulk_carrier: 'BC', lng_carrier: 'LN',
    fishing: 'FI', dhow: 'DH', unknown: '?'
};

const symbolCache = new Map();

export function getSymbolCanvas(track, size = 28) {
    const cacheKey = `${track.affiliation}-${track.domain}-${track.type}-${size}-${track.predicted ? 'p' : 'n'}`;
    if (symbolCache.has(cacheKey)) return symbolCache.get(cacheKey);

    const canvas = document.createElement('canvas');
    const scale = window.devicePixelRatio || 1;
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const colors = AFFILIATION_COLORS[track.affiliation] || AFFILIATION_COLORS.unknown;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;

    // Draw shape based on domain
    ctx.beginPath();
    const shape = DOMAIN_SHAPES[track.domain] || 'circle';

    switch (shape) {
        case 'arc':
            // Air: dome (top half circle)
            ctx.arc(cx, cy + 2, r, Math.PI, 0);
            ctx.closePath();
            break;
        case 'arc_inverted':
            // Subsurface: inverted dome
            ctx.arc(cx, cy - 2, r, 0, Math.PI);
            ctx.closePath();
            break;
        case 'rectangle':
            ctx.rect(2, 4, size - 4, size - 8);
            break;
        default:
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            break;
    }

    // Fill
    ctx.fillStyle = colors.bg;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = track.predicted ? 1 : 2;
    if (track.predicted) ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Type label
    const label = TYPE_LABELS[track.type] || '?';
    ctx.fillStyle = colors.fill;
    ctx.font = `bold ${Math.max(8, size / 3)}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + (shape === 'arc' ? -1 : shape === 'arc_inverted' ? 1 : 0));

    symbolCache.set(cacheKey, canvas);
    return canvas;
}

// Generate a symbol as a data URL for use in image-based renderers
export function getSymbolDataURL(track, size = 28) {
    const canvas = getSymbolCanvas(track, size);
    return canvas.toDataURL();
}

// Get affiliation color hex
export function getAffiliationColor(affiliation) {
    return (AFFILIATION_COLORS[affiliation] || AFFILIATION_COLORS.unknown).stroke;
}

// Get affiliation fill color
export function getAffiliationFillColor(affiliation) {
    return (AFFILIATION_COLORS[affiliation] || AFFILIATION_COLORS.unknown).fill;
}

// Get a velocity vector end point
export function getVelocityVector(track, scale = 0.01) {
    if (!track.heading || !track.speed) return null;
    const headingRad = (track.heading * Math.PI) / 180;
    const len = track.speed * scale;
    return {
        endLat: track.lat + len * Math.cos(headingRad),
        endLon: track.lon + len * Math.sin(headingRad)
    };
}

// Clear the cache (call on window resize, etc.)
export function clearSymbolCache() {
    symbolCache.clear();
}
