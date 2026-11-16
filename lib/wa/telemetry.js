const fresh = () => ({
    upsertEvents: 0,
    incomingMessages: 0,
    handlerCalls: 0,
    readReceiptsSent: 0,
    readReceiptErrors: 0,
    lastUpsertAt: 0,
    lastIncomingAt: 0,
    lastHandlerAt: 0,
    lastReadAt: 0,
    sockets: { principal: 0, subbot: 0 },
    upsertTypes: Object.create(null)
});
function state() {
    if (!global.__waTelemetry || typeof global.__waTelemetry !== 'object')
        global.__waTelemetry = fresh();
    const s = global.__waTelemetry;
    s.sockets ||= { principal: 0, subbot: 0 };
    s.upsertTypes ||= Object.create(null);
    return s;
}
export function noteWaUpsert(kind, messages = [], type = 'unknown') {
    const s = state(), now = Date.now();
    s.upsertEvents++;
    const eventType = String(type || 'unknown');
    s.upsertTypes[eventType] = (s.upsertTypes[eventType] || 0) + 1;
    s.lastUpsertAt = now;
    s.sockets[kind] = (s.sockets[kind] || 0) + 1;
    if (type === 'notify') {
        const inbound = messages.filter(m => m?.message && !m?.key?.fromMe && m?.key?.remoteJid !== 'status@broadcast');
        if (inbound.length) {
            s.incomingMessages += inbound.length;
            s.lastIncomingAt = now;
        }
    }
}
export function noteWaHandler() {
    const s = state();
    s.handlerCalls++;
    s.lastHandlerAt = Date.now();
}
export function noteWaRead(ok) {
    const s = state();
    if (ok) {
        s.readReceiptsSent++;
        s.lastReadAt = Date.now();
    }
    else
        s.readReceiptErrors++;
}
export function getWaTelemetry() {
    const s = state();
    return { ...s, sockets: { ...s.sockets }, upsertTypes: { ...s.upsertTypes } };
}
