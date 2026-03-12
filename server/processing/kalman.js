// 2D Kalman Filter for Track Smoothing and Prediction
// Applied to kinematic tracks to smooth noisy positions and predict during signal gaps

export class KalmanFilter2D {
    constructor() {
        // State: [x, y, vx, vy]
        this.x = [0, 0, 0, 0];
        // State covariance
        this.P = [
            [1000, 0, 0, 0],
            [0, 1000, 0, 0],
            [0, 0, 1000, 0],
            [0, 0, 0, 1000]
        ];
        // Process noise
        this.Q = [
            [0.1, 0, 0, 0],
            [0, 0.1, 0, 0],
            [0, 0, 0.01, 0],
            [0, 0, 0, 0.01]
        ];
        // Measurement noise
        this.R = [
            [0.5, 0],
            [0, 0.5]
        ];
        this.initialized = false;
    }

    initialize(lat, lon) {
        this.x = [lat, lon, 0, 0];
        this.initialized = true;
    }

    predict(dt) {
        const dtSec = dt / 1000;
        // State transition matrix
        const F = [
            [1, 0, dtSec, 0],
            [0, 1, 0, dtSec],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
        // Predicted state
        this.x = matVecMul(F, this.x);
        // Predicted covariance: P = F * P * F^T + Q
        this.P = matAdd(matMul(matMul(F, this.P), transpose(F)), this.Q);

        return { lat: this.x[0], lon: this.x[1], vLat: this.x[2], vLon: this.x[3] };
    }

    update(lat, lon) {
        if (!this.initialized) {
            this.initialize(lat, lon);
            return { lat, lon };
        }
        // Measurement matrix
        const H = [
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ];
        // Innovation: y = z - H * x
        const z = [lat, lon];
        const Hx = [
            H[0][0] * this.x[0] + H[0][1] * this.x[1] + H[0][2] * this.x[2] + H[0][3] * this.x[3],
            H[1][0] * this.x[0] + H[1][1] * this.x[1] + H[1][2] * this.x[2] + H[1][3] * this.x[3]
        ];
        const y = [z[0] - Hx[0], z[1] - Hx[1]];

        // Innovation covariance: S = H * P * H^T + R
        const HP = matMul(H, this.P);
        const S = matAdd(matMul(HP, transpose(H)), this.R);

        // Kalman gain: K = P * H^T * S^-1
        const PHt = matMul(this.P, transpose(H));
        const Sinv = mat2inv(S);
        const K = matMul(PHt, Sinv);

        // Updated state: x = x + K * y
        const Ky = matVecMul(K, y);
        this.x = this.x.map((v, i) => v + Ky[i]);

        // Updated covariance: P = (I - K * H) * P
        const KH = matMul(K, H);
        const I = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
        const IKH = matSub(I, KH);
        this.P = matMul(IKH, this.P);

        return { lat: this.x[0], lon: this.x[1], vLat: this.x[2], vLon: this.x[3] };
    }
}

// Matrix utilities (small matrices only)
function matMul(A, B) {
    const rows = A.length, cols = B[0].length, inner = B.length;
    const C = Array.from({ length: rows }, () => new Array(cols).fill(0));
    for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
            for (let k = 0; k < inner; k++)
                C[i][j] += A[i][k] * B[k][j];
    return C;
}

function matVecMul(A, v) {
    return A.map(row => row.reduce((s, a, i) => s + a * v[i], 0));
}

function transpose(A) {
    return A[0].map((_, j) => A.map(row => row[j]));
}

function matAdd(A, B) {
    return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

function matSub(A, B) {
    return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

function mat2inv(M) {
    const [[a, b], [c, d]] = M;
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-10) return [[1, 0], [0, 1]];
    return [
        [d / det, -b / det],
        [-c / det, a / det]
    ];
}

// Track filter manager — maintains one Kalman filter per track
const filters = new Map();

export function smoothTrack(track, dt) {
    let kf = filters.get(track.id);
    if (!kf) {
        kf = new KalmanFilter2D();
        filters.set(track.id, kf);
    }

    // Predict step
    kf.predict(dt);

    if (track.transponderActive !== false && track.signalStrength !== 0) {
        // We have a measurement — update
        const smoothed = kf.update(track.lat, track.lon);
        track.smoothLat = smoothed.lat;
        track.smoothLon = smoothed.lon;
        track.predicted = false;
    } else {
        // No measurement — use prediction only
        track.smoothLat = kf.x[0];
        track.smoothLon = kf.x[1];
        track.predicted = true;
    }

    return track;
}

export function removeFilter(trackId) {
    filters.delete(trackId);
}
