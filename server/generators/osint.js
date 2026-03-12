// OSINT Report Generator
// Simulates Telegram intercepts, news wire items, SALUTE reports, SAR/EO alerts

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

const PRIORITIES = ['FLASH', 'IMMEDIATE', 'PRIORITY', 'ROUTINE'];

const TELEGRAM_TEMPLATES = [
    { text: 'Multiple fast boats spotted departing {location}, heading south at high speed', priority: 'IMMEDIATE', tags: ['naval', 'fast_attack'] },
    { text: 'Unidentified drone observed circling over {location} for past 30 minutes', priority: 'PRIORITY', tags: ['air', 'uav', 'surveillance'] },
    { text: 'Reports of loud explosions heard near {location}, possible airstrikes', priority: 'FLASH', tags: ['strike', 'bda'] },
    { text: 'Large convoy of military vehicles moving along highway near {location}', priority: 'PRIORITY', tags: ['ground', 'movement'] },
    { text: 'Fishing boats in {location} report unusual submarine surfacing activity', priority: 'IMMEDIATE', tags: ['naval', 'submarine'] },
    { text: 'Civilian aircraft diverted from {location} airspace, possible military operations', priority: 'PRIORITY', tags: ['air', 'airspace'] },
    { text: 'Local sources: New radar installation observed under construction at {location}', priority: 'ROUTINE', tags: ['ground', 'radar', 'facility'] },
    { text: 'Fuel tanker convoy observed docking at {location} port under heavy security', priority: 'ROUTINE', tags: ['naval', 'logistics'] },
    { text: 'Anti-ship missile launcher TELs spotted repositioning near {location} coast', priority: 'FLASH', tags: ['ground', 'missile', 'ascm'] },
    { text: 'Unusual electronic signals detected emanating from {location} area', priority: 'IMMEDIATE', tags: ['sigint', 'electronic'] },
];

const NEWS_TEMPLATES = [
    { text: 'BREAKING: Naval exercise announced in {location} waters, multiple warships participating', priority: 'PRIORITY', tags: ['naval', 'exercise'] },
    { text: 'Shipping advisory issued for {location} due to heightened security concerns', priority: 'ROUTINE', tags: ['naval', 'advisory'] },
    { text: 'Defense ministry announces successful test of new air defense system near {location}', priority: 'PRIORITY', tags: ['air_defense', 'test'] },
    { text: 'Reports indicate airbase at {location} undergoing rapid expansion', priority: 'ROUTINE', tags: ['air', 'facility', 'construction'] },
    { text: 'Satellite imagery shows new ballistic missile silo construction at {location}', priority: 'FLASH', tags: ['ground', 'missile', 'ballistic'] },
];

const SALUTE_TEMPLATES = [
    { size: 'PLT', activity: 'DEFENDING', location: '{location}', unit: 'IRGC-N FAST ATTACK', time: 'NOW', equip: '12x Boghammar fast boats', priority: 'IMMEDIATE', tags: ['naval', 'fast_attack'] },
    { size: 'CO', activity: 'MOVING', location: '{location}', unit: 'UNK MECH INF', time: 'NOW', equip: 'T-72 tanks, BMP-2 IFV', priority: 'PRIORITY', tags: ['ground', 'armor'] },
    { size: 'SECT', activity: 'OCCUPYING', location: '{location}', unit: 'SAM BATTERY', time: 'NOW', equip: 'S-300 TEL, radar van', priority: 'FLASH', tags: ['air_defense', 'sam'] },
    { size: 'SQD', activity: 'PATROLLING', location: '{location}', unit: 'COAST GUARD', time: 'NOW', equip: '2x patrol boats', priority: 'ROUTINE', tags: ['naval', 'patrol'] },
    { size: 'BTY', activity: 'EMPLACING', location: '{location}', unit: 'ARTY UNIT', time: 'NOW', equip: '6x 155mm howitzer', priority: 'IMMEDIATE', tags: ['ground', 'artillery'] },
];

const ATR_TEMPLATES = [
    { text: 'ATR DETECTION: SAR imagery confirms {count}x fast attack craft at {location}', priority: 'FLASH', tags: ['atr', 'naval', 'fast_attack'] },
    { text: 'ATR DETECTION: EO imagery identifies TEL (possible Fateh-110) at {location}', priority: 'FLASH', tags: ['atr', 'ground', 'missile'] },
    { text: 'ATR DETECTION: SAR change detection — new hardened aircraft shelter at {location}', priority: 'IMMEDIATE', tags: ['atr', 'air', 'facility'] },
    { text: 'ATR DETECTION: Unusual vessel clustering ({count} contacts) at {location}', priority: 'IMMEDIATE', tags: ['atr', 'naval', 'anomaly'] },
    { text: 'ATR DETECTION: Ballistic missile launcher TEL movement confirmed at {location}', priority: 'FLASH', tags: ['atr', 'ground', 'missile', 'ballistic'] },
    { text: 'ATR DETECTION: SAR imagery shows new runway extension at {location} airbase', priority: 'PRIORITY', tags: ['atr', 'air', 'facility'] },
];

const LOCATIONS = [
    { name: 'Bandar Abbas', lat: 27.19, lon: 56.27 },
    { name: 'Strait of Hormuz', lat: 26.5, lon: 56.3 },
    { name: 'Jask', lat: 25.64, lon: 57.77 },
    { name: 'Bushehr', lat: 28.97, lon: 50.84 },
    { name: 'Kharg Island', lat: 29.23, lon: 50.33 },
    { name: 'Bab el-Mandeb', lat: 12.6, lon: 43.3 },
    { name: 'Hodeidah', lat: 14.8, lon: 42.95 },
    { name: 'Aden', lat: 12.8, lon: 45.03 },
    { name: 'Socotra Island', lat: 12.47, lon: 54.0 },
    { name: 'Jeddah', lat: 21.49, lon: 39.19 },
    { name: 'Suez Canal', lat: 30.5, lon: 32.3 },
    { name: 'Tartus', lat: 34.89, lon: 35.89 },
    { name: 'Latakia', lat: 35.51, lon: 35.79 },
    { name: 'Haifa', lat: 32.82, lon: 34.99 },
    { name: 'Incirlik', lat: 37.0, lon: 35.43 },
    { name: 'Al Udeid', lat: 25.12, lon: 51.32 },
    { name: 'Al Dhafra', lat: 24.25, lon: 54.55 },
    { name: 'Isfahan', lat: 32.65, lon: 51.68 },
    { name: 'Natanz', lat: 33.73, lon: 51.73 },
    { name: 'Parchin', lat: 35.52, lon: 51.77 },
    { name: 'Chabahar', lat: 25.29, lon: 60.64 },
    { name: 'Qeshm Island', lat: 26.84, lon: 55.9 },
    { name: 'Muscat', lat: 23.61, lon: 58.54 },
    { name: 'Djibouti', lat: 11.59, lon: 43.15 },
];

let reportCounter = 0;

export function generateReport() {
    reportCounter++;
    const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const roll = Math.random();

    let report;
    if (roll < 0.35) {
        const tmpl = TELEGRAM_TEMPLATES[Math.floor(Math.random() * TELEGRAM_TEMPLATES.length)];
        report = {
            id: `OSINT-${String(reportCounter).padStart(6, '0')}`,
            category: 'TELEGRAM',
            text: tmpl.text.replace('{location}', loc.name),
            priority: tmpl.priority,
            tags: tmpl.tags,
        };
    } else if (roll < 0.55) {
        const tmpl = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
        report = {
            id: `OSINT-${String(reportCounter).padStart(6, '0')}`,
            category: 'NEWS',
            text: tmpl.text.replace('{location}', loc.name),
            priority: tmpl.priority,
            tags: tmpl.tags,
        };
    } else if (roll < 0.75) {
        const tmpl = SALUTE_TEMPLATES[Math.floor(Math.random() * SALUTE_TEMPLATES.length)];
        report = {
            id: `OSINT-${String(reportCounter).padStart(6, '0')}`,
            category: 'SALUTE',
            text: `SALUTE RPT — SIZE: ${tmpl.size} | ACT: ${tmpl.activity} | LOC: ${tmpl.location.replace('{location}', loc.name)} | UNIT: ${tmpl.unit} | TIME: ${tmpl.time} | EQUIP: ${tmpl.equip}`,
            priority: tmpl.priority,
            tags: tmpl.tags,
        };
    } else {
        const tmpl = ATR_TEMPLATES[Math.floor(Math.random() * ATR_TEMPLATES.length)];
        report = {
            id: `OSINT-${String(reportCounter).padStart(6, '0')}`,
            category: 'ATR',
            text: tmpl.text.replace('{location}', loc.name).replace('{count}', String(Math.floor(Math.random() * 8) + 2)),
            priority: tmpl.priority,
            tags: tmpl.tags,
        };
    }

    report.lat = loc.lat + randomInRange(-0.5, 0.5);
    report.lon = loc.lon + randomInRange(-0.5, 0.5);
    report.location = loc.name;
    report.timestamp = Date.now();
    report.dtg = formatDTG(new Date());
    return report;
}

function formatDTG(date) {
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${dd}${hh}${mm}Z ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function generateInitialReports(count = 30) {
    const reports = [];
    for (let i = 0; i < count; i++) {
        reports.push(generateReport());
    }
    return reports;
}
