// WebSocket Client with auto-reconnect

class WSClient extends EventTarget {
    constructor(url) {
        super();
        this.url = url;
        this.ws = null;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 16000;
        this.currentDelay = this.reconnectDelay;
        this.connected = false;
        this.shouldReconnect = true;
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[WS] Connected');
                this.connected = true;
                this.currentDelay = this.reconnectDelay;
                this.dispatchEvent(new CustomEvent('connected'));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.dispatchEvent(new CustomEvent('message', { detail: data }));

                    // Dispatch typed events
                    if (data.type) {
                        this.dispatchEvent(new CustomEvent(data.type, { detail: data }));
                    }
                } catch (err) {
                    console.error('[WS] Parse error:', err);
                }
            };

            this.ws.onclose = () => {
                console.log('[WS] Disconnected');
                this.connected = false;
                this.dispatchEvent(new CustomEvent('disconnected'));
                this.scheduleReconnect();
            };

            this.ws.onerror = (err) => {
                console.error('[WS] Error:', err);
                this.ws.close();
            };
        } catch (err) {
            console.error('[WS] Connection failed:', err);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (!this.shouldReconnect) return;
        console.log(`[WS] Reconnecting in ${this.currentDelay}ms...`);
        setTimeout(() => this.connect(), this.currentDelay);
        this.currentDelay = Math.min(this.currentDelay * 2, this.maxReconnectDelay);
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.ws) this.ws.close();
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Singleton
let client = null;

export function createWSClient() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In production, WS is on the same host. In dev with Vite, proxy handles /ws.
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    client = new WSClient(wsUrl);
    client.connect();
    return client;
}

export function getWSClient() {
    return client;
}
