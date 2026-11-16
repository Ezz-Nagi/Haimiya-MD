import crypto from 'crypto';
function encodeHash(value) {
    if (!value)
        return '';
    try {
        const buffer = Buffer.isBuffer(value) || value instanceof Uint8Array
            ? Buffer.from(value)
            : Buffer.from(String(value), 'base64');
        return buffer.toString('base64');
    }
    catch {
        return '';
    }
}
export async function getStickerKey(message) {
    const raw = message?.msg?.fileSha256
        || message?.fileSha256
        || message?.quoted?.fileSha256
        || message?.quoted?.msg?.fileSha256
        || message?.quoted?.message?.stickerMessage?.fileSha256;
    const encoded = encodeHash(raw);
    if (encoded)
        return encoded;
    const target = message?.msg?.mimetype ? message : message?.quoted;
    if (!target?.download)
        return '';
    try {
        const buffer = await target.download();
        if (!Buffer.isBuffer(buffer) || !buffer.length)
            return '';
        return crypto.createHash('sha256').update(buffer).digest('base64');
    }
    catch {
        return '';
    }
}
export default { getStickerKey };
