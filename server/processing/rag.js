// DGE-RAG Tactical Text Retrieval Engine
// TF-IDF + cosine similarity for bounding-box-contextual OSINT retrieval

const documents = [];
const vocabulary = new Map(); // word -> index
const idfCache = new Map();
let vocabSize = 0;
let dirty = true;

// Tokenize and normalize text
function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them',
    'than', 'its', 'over', 'such', 'that', 'this', 'with', 'will', 'each',
    'from', 'they', 'into', 'also', 'more', 'other', 'which', 'their',
    'about', 'would', 'make', 'like', 'just', 'very', 'after', 'could',
    'report', 'reports', 'near', 'area', 'location', 'past', 'new'
]);

function getOrCreateWordIndex(word) {
    if (!vocabulary.has(word)) {
        vocabulary.set(word, vocabSize++);
    }
    return vocabulary.get(word);
}

// Compute TF vector for a document
function computeTF(tokens) {
    const tf = new Map();
    for (const token of tokens) {
        const idx = getOrCreateWordIndex(token);
        tf.set(idx, (tf.get(idx) || 0) + 1);
    }
    // Normalize by document length
    const len = tokens.length || 1;
    for (const [idx, count] of tf) {
        tf.set(idx, count / len);
    }
    return tf;
}

// Recompute IDF across all documents
function recomputeIDF() {
    idfCache.clear();
    const N = documents.length || 1;
    const docFreq = new Map();

    for (const doc of documents) {
        const seen = new Set();
        for (const [idx] of doc.tf) {
            if (!seen.has(idx)) {
                docFreq.set(idx, (docFreq.get(idx) || 0) + 1);
                seen.add(idx);
            }
        }
    }

    for (const [idx, df] of docFreq) {
        idfCache.set(idx, Math.log(N / df));
    }
    dirty = false;
}

// Compute TF-IDF vector (sparse)
function computeTFIDF(tf) {
    if (dirty) recomputeIDF();
    const tfidf = new Map();
    for (const [idx, tfVal] of tf) {
        const idf = idfCache.get(idx) || 0;
        tfidf.set(idx, tfVal * idf);
    }
    return tfidf;
}

// Cosine similarity between two sparse vectors
function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (const [idx, val] of a) {
        normA += val * val;
        if (b.has(idx)) dot += val * b.get(idx);
    }
    for (const [, val] of b) normB += val * val;
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Add a report to the index
export function indexReport(report) {
    const tokens = tokenize(report.text + ' ' + (report.tags || []).join(' ') + ' ' + (report.location || ''));
    const tf = computeTF(tokens);
    documents.push({
        report,
        tokens,
        tf,
        lat: report.lat,
        lon: report.lon,
        timestamp: report.timestamp
    });
    dirty = true;

    // Cap at 500 documents
    if (documents.length > 500) {
        documents.shift();
        dirty = true;
    }
}

// Search for relevant reports given a query and optional bounding box
export function searchReports(query, bbox = null, limit = 15) {
    if (documents.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 && !bbox) return documents.slice(-limit).map(d => d.report).reverse();

    const queryTF = computeTF(queryTokens);
    const queryTFIDF = computeTFIDF(queryTF);

    let candidates = documents;

    // Filter by bounding box if provided
    if (bbox) {
        candidates = candidates.filter(d =>
            d.lat >= bbox.south && d.lat <= bbox.north &&
            d.lon >= bbox.west && d.lon <= bbox.east
        );
    }

    if (queryTokens.length === 0) {
        // No query text — return most recent in bbox
        return candidates.slice(-limit).map(d => d.report).reverse();
    }

    // Score and rank
    const scored = candidates.map(doc => {
        const docTFIDF = computeTFIDF(doc.tf);
        const score = cosineSimilarity(queryTFIDF, docTFIDF);
        // Recency boost: newer docs get a small boost
        const age = (Date.now() - doc.timestamp) / 3600000; // hours
        const recencyBoost = Math.max(0, 1 - age / 24) * 0.1;
        return { report: doc.report, score: score + recencyBoost };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.report);
}

// Get reports by geographic proximity
export function getReportsByBBox(bbox, limit = 20) {
    return documents
        .filter(d =>
            d.lat >= bbox.south && d.lat <= bbox.north &&
            d.lon >= bbox.west && d.lon <= bbox.east
        )
        .slice(-limit)
        .map(d => d.report)
        .reverse();
}

export function getRecentReports(limit = 20) {
    return documents.slice(-limit).map(d => d.report).reverse();
}

export function getReportCount() {
    return documents.length;
}
