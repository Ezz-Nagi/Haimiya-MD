import axios from 'axios';
import db from '#db';
import { haimiyaRequest } from '../../lib/haimiya-api.js';
import sharp from 'sharp';
import crypto from 'crypto';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { proto, generateMessageIDV2 } from 'ezz-baileys';
const MAX_STICKERS = 30;
const MAX_STICKER_SIZE = 1024 * 1024;
const TMP_DIR = path.join(os.tmpdir(), 'haimiya-spack');
await fs.mkdir(TMP_DIR, {
    recursive: true
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function sha256(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest();
}
function sha256Hex(data) {
    return sha256(data).toString('hex');
}
function firstValue(...values) {
    for (const value of values) {
        if (value !== undefined &&
            value !== null &&
            String(value).trim()) {
            return String(value).trim();
        }
    }
    return null;
}
function errorText(error) {
    if (!error) {
        return 'Error desconocido';
    }
    if (typeof error === 'string') {
        return error;
    }
    return (error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.statusText ||
        String(error));
}
async function react(sock, msg, text) {
    try {
        if (!msg?.key)
            return;
        await sock.sendMessage(msg.chat, {
            react: {
                text,
                key: msg.key
            }
        });
    }
    catch (error) {
        console.error('[SPACK] Error enviando reacción:', errorText(error));
    }
}
async function toBuffer(url) {
    if (!url) {
        throw new Error('URL de descarga vacía.');
    }
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: 30 * 1024 * 1024,
                maxBodyLength: 30 * 1024 * 1024
            });
            if (!response.data) {
                throw new Error('La descarga devolvió datos vacíos.');
            }
            return Buffer.from(response.data);
        }
        catch (error) {
            lastError = error;
            if (attempt < 3) {
                await sleep(1200 * attempt);
            }
        }
    }
    throw lastError;
}
async function toWebp(buffer, isAnimated = false) {
    if (!buffer?.length) {
        throw new Error('Sticker vacío.');
    }
    let result;
    if (isAnimated) {
        result = await sharp(buffer, {
            animated: true
        })
            .resize(512, 512, {
            fit: 'contain',
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
            }
        })
            .webp({
            quality: 75,
            loop: 0
        })
            .toBuffer();
    }
    else {
        result = await sharp(buffer)
            .resize(512, 512, {
            fit: 'contain',
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
            }
        })
            .webp({
            quality: 75
        })
            .toBuffer();
    }
    if (result.length >
        MAX_STICKER_SIZE) {
        result = await sharp(buffer)
            .resize(384, 384, {
            fit: 'contain',
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
            }
        })
            .webp({
            quality: 60
        })
            .toBuffer();
    }
    if (result.length >
        MAX_STICKER_SIZE) {
        result = await sharp(buffer)
            .resize(256, 256, {
            fit: 'contain',
            background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
            }
        })
            .webp({
            quality: 45
        })
            .toBuffer();
    }
    if (!result?.length) {
        throw new Error('Sharp generó un sticker vacío.');
    }
    return result;
}
function isStickerUrl(url) {
    return /^https?:\/\/(?:www\.)?sticker\.ly\/s\/[a-zA-Z0-9]+/i
        .test(String(url || ''));
}
async function searchPacks(query) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const body = await haimiyaRequest('stickerly-buscar', query, { timeout: 20000 });
            const raw = body?.result?.text ?? body?.result ?? body;
            if (!raw) throw new Error('No se encontraron resultados.');
            if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return { result: raw }; } }
            return raw;
        }
        catch (error) {
            lastError = error;
            if (error?.response?.status === 429) {
                const retryAfter = Number(error?.response?.headers?.['retry-after']) || 3;
                await sleep(retryAfter * 1000);
            }
            else if (attempt < 3) {
                await sleep(1200 * attempt);
            }
        }
    }
    throw lastError;
}
async function downloadPack(url) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const body = await haimiyaRequest('stickerly-detalle', url, { timeout: 30000 });
            const raw = body?.result?.text ?? body?.result ?? body;
            if (!raw) throw new Error('No se encontraron resultados.');
            if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return { result: raw }; } }
            return raw;
        }
        catch (error) {
            lastError = error;
            if (error?.response?.status === 429) {
                const retryAfter = Number(error?.response?.headers?.['retry-after']) || 3;
                await sleep(retryAfter * 1000);
            }
            else if (attempt < 3) {
                await sleep(1200 * attempt);
            }
        }
    }
    throw lastError;
}
function extractDetails(response) {
    return (response?.detalles ||
        response?.detail ||
        response?.data ||
        response?.resultado ||
        response?.result ||
        null);
}
function extractSearchResults(response) {
    const result = response?.resultados ||
        response?.results ||
        response?.data ||
        response?.result ||
        [];
    return Array.isArray(result)
        ? result
        : [];
}
function extractPackUrl(pack) {
    return firstValue(pack?.url, pack?.link, pack?.packUrl, pack?.stickerUrl, pack?.stickerlyUrl);
}
function extractStickerUrl(sticker) {
    return firstValue(sticker?.imageUrl, sticker?.url, sticker?.stickerUrl, sticker?.image, sticker?.src);
}
function extractStickers(detail) {
    const possible = [
        detail?.stickers,
        detail?.sticker,
        detail?.items,
        detail?.pack?.stickers,
        detail?.data?.stickers
    ];
    for (const list of possible) {
        if (Array.isArray(list) &&
            list.length) {
            return list;
        }
    }
    return [];
}
function extractPackName(detail, selected) {
    return firstValue(detail?.name, detail?.packName, detail?.title, detail?.pack?.name, detail?.data?.name, selected?.name, selected?.packName, selected?.title);
}
function extractPublisher(detail, selected, fallback) {
    const author = detail?.author ||
        detail?.publisher ||
        detail?.pack?.author ||
        selected?.author ||
        selected?.publisher;
    if (typeof author === 'string') {
        return author;
    }
    return (firstValue(author?.name, author?.username, author?.userName) ||
        fallback);
}
async function getPack(query) {
    if (isStickerUrl(query)) {
        const response = await downloadPack(query);
        const detail = extractDetails(response);
        if (!detail) {
            throw new Error('No se pudo obtener el detalle del pack.');
        }
        if (!extractStickers(detail).length) {
            throw new Error('El pack no contiene stickers.');
        }
        return {
            detail,
            selected: null,
            url: query
        };
    }
    const search = await searchPacks(query);
    const results = extractSearchResults(search);
    if (!results.length) {
        throw new Error(`No se encontraron packs para "${query}".`);
    }
    const normalized = query
        .toLowerCase()
        .trim();
    const usable = results
        .map(pack => ({
        pack,
        url: extractPackUrl(pack)
    }))
        .filter(item => isStickerUrl(item.url));
    if (!usable.length) {
        throw new Error('La búsqueda no devolvió URLs válidas de Sticker.ly.');
    }
    const relevant = usable.filter(({ pack }) => {
        const name = firstValue(pack?.name, pack?.packName, pack?.title);
        return name
            ?.toLowerCase()
            .includes(normalized);
    });
    const candidates = [
        ...relevant,
        ...usable.filter(item => !relevant.includes(item))
    ];
    let lastError;
    for (const candidate of candidates.slice(0, 8)) {
        try {
            const response = await downloadPack(candidate.url);
            const detail = extractDetails(response);
            const stickers = extractStickers(detail);
            if (detail &&
                stickers.length) {
                return {
                    detail,
                    selected: candidate.pack,
                    url: candidate.url
                };
            }
        }
        catch (error) {
            lastError = error;
        }
    }
    throw new Error(`No se pudo obtener un pack válido.${lastError
        ? ` ${errorText(lastError)}`
        : ''}`);
}
function crc32(buffer) {
    let crc = 0xffffffff;
    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];
        for (let j = 0; j < 8; j++) {
            crc =
                (crc >>> 1) ^
                    (0xedb88320 &
                        -(crc & 1));
        }
    }
    return (crc ^
        0xffffffff) >>> 0;
}
function createZip(files) {
    const localFiles = [];
    const centralFiles = [];
    let offset = 0;
    for (const file of files) {
        const name = Buffer.from(String(file.name));
        const data = Buffer.from(file.data);
        const crc = crc32(data);
        const local = Buffer.alloc(30 +
            name.length +
            data.length);
        let p = 0;
        local.writeUInt32LE(0x04034b50, p);
        p += 4;
        local.writeUInt16LE(20, p);
        p += 2;
        local.writeUInt16LE(0, p);
        p += 2;
        local.writeUInt16LE(0, p);
        p += 2;
        local.writeUInt16LE(0, p);
        p += 2;
        local.writeUInt16LE(0, p);
        p += 2;
        local.writeUInt32LE(crc, p);
        p += 4;
        local.writeUInt32LE(data.length, p);
        p += 4;
        local.writeUInt32LE(data.length, p);
        p += 4;
        local.writeUInt16LE(name.length, p);
        p += 2;
        local.writeUInt16LE(0, p);
        p += 2;
        name.copy(local, p);
        p += name.length;
        data.copy(local, p);
        localFiles.push(local);
        const central = Buffer.alloc(46 + name.length);
        p = 0;
        central.writeUInt32LE(0x02014b50, p);
        p += 4;
        central.writeUInt16LE(20, p);
        p += 2;
        central.writeUInt16LE(20, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt32LE(crc, p);
        p += 4;
        central.writeUInt32LE(data.length, p);
        p += 4;
        central.writeUInt32LE(data.length, p);
        p += 4;
        central.writeUInt16LE(name.length, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt16LE(0, p);
        p += 2;
        central.writeUInt32LE(0, p);
        p += 4;
        central.writeUInt32LE(offset, p);
        p += 4;
        name.copy(central, p);
        centralFiles.push(central);
        offset += local.length;
    }
    const local = Buffer.concat(localFiles);
    const central = Buffer.concat(centralFiles);
    const end = Buffer.alloc(22);
    let p = 0;
    end.writeUInt32LE(0x06054b50, p);
    p += 4;
    end.writeUInt16LE(0, p);
    p += 2;
    end.writeUInt16LE(0, p);
    p += 2;
    end.writeUInt16LE(files.length, p);
    p += 2;
    end.writeUInt16LE(files.length, p);
    p += 2;
    end.writeUInt32LE(central.length, p);
    p += 4;
    end.writeUInt32LE(local.length, p);
    p += 4;
    end.writeUInt16LE(0, p);
    return Buffer.concat([
        local,
        central,
        end
    ]);
}
function getStickerPackKeys(mediaKey) {
    const expanded = Buffer.from(crypto.hkdfSync('sha256', mediaKey, Buffer.alloc(0), Buffer.from('WhatsApp Sticker Pack Keys'), 112));
    return {
        iv: expanded.subarray(0, 16),
        cipherKey: expanded.subarray(16, 48),
        macKey: expanded.subarray(48, 80)
    };
}
function encryptStickerPack(buffer, mediaKey) {
    const { iv, cipherKey, macKey } = getStickerPackKeys(mediaKey);
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
    ]);
    const mac = crypto
        .createHmac('sha256', macKey)
        .update(Buffer.concat([
        iv,
        encrypted
    ]))
        .digest()
        .subarray(0, 10);
    const finalBuffer = Buffer.concat([
        encrypted,
        mac
    ]);
    return {
        encrypted: finalBuffer,
        fileSha256: sha256(buffer),
        fileEncSha256: sha256(finalBuffer)
    };
}
async function uploadEncrypted(sock, encrypted, mediaType = 'sticker') {
    if (!encrypted?.encrypted?.length) {
        throw new Error('El archivo cifrado está vacío.');
    }
    if (typeof sock.waUploadToServer !==
        'function') {
        throw new Error('Baileys no expone waUploadToServer().');
    }
    const filePath = path.join(TMP_DIR, `upload-${Date.now()}-${crypto
        .randomBytes(6)
        .toString('hex')}.enc`);
    await fs.writeFile(filePath, encrypted.encrypted);
    let lastError;
    try {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[SPACK] Upload ${attempt}/3...`);
                const result = await sock.waUploadToServer(filePath, {
                    fileEncSha256B64: encrypted.fileEncSha256
                        .toString('base64'),
                    mediaType,
                    timeoutMs: 120000
                });
                if (result?.directPath) {
                    console.log('[SPACK] Upload correcto:', result.directPath);
                    return result;
                }
                throw new Error(`WhatsApp devolvió una respuesta de upload inválida: ${JSON.stringify(result).slice(0, 1000)}`);
            }
            catch (error) {
                lastError = error;
                console.error(`[SPACK] Upload ${attempt}/3 falló:`, errorText(error));
                if (attempt < 3) {
                    await sleep(1500 * attempt);
                }
            }
        }
        throw new Error(`Media upload falló después de 3 intentos: ${errorText(lastError)}`);
    }
    finally {
        try {
            await fs.unlink(filePath);
        }
        catch { }
    }
}
async function buildPack({ sock, packName, publisher, stickers, cover, description }) {
    if (!stickers?.length) {
        throw new Error('No existen stickers para construir el pack.');
    }
    const zip = createZip(stickers.map((sticker, index) => ({
        name: `${String(index).padStart(2, '0')}.webp`,
        data: sticker.buffer
    })));
    if (!zip.length) {
        throw new Error('El ZIP resultó vacío.');
    }
    console.log(`[SPACK] ZIP creado: ${zip.length} bytes`);
    const mediaKey = crypto.randomBytes(32);
    const encryptedPack = encryptStickerPack(zip, mediaKey);
    const upload = await uploadEncrypted(sock, encryptedPack, 'sticker');
    if (!upload?.directPath) {
        throw new Error('WhatsApp no devolvió directPath del pack.');
    }
    const thumbnail = await sharp(cover)
        .resize(96, 96, {
        fit: 'cover'
    })
        .png()
        .toBuffer();
    if (!thumbnail.length) {
        throw new Error('No se pudo generar el thumbnail.');
    }
    const encryptedThumbnail = encryptStickerPack(thumbnail, mediaKey);
    const thumbnailUpload = await uploadEncrypted(sock, encryptedThumbnail, 'sticker');
    if (!thumbnailUpload?.directPath) {
        throw new Error('WhatsApp no devolvió directPath del thumbnail.');
    }
    const stickerMetadata = stickers.map((sticker, index) => proto.Message
        .StickerPackMessage
        .Sticker.create({
        fileName: `${String(index).padStart(2, '0')}.webp`,
        isAnimated: !!sticker.isAnimated,
        isLottie: !!sticker.isLottie,
        emojis: Array.isArray(sticker.emojis)
            ? sticker.emojis.map(emoji => String(emoji))
            : ['🎭'],
        accessibilityLabel: String(sticker.accessibilityLabel ||
            ''),
        mimetype: 'image/webp'
    }));
    const imageDataHash = sha256Hex(thumbnail);
    const stickerPackId = crypto
        .randomBytes(16)
        .toString('hex');
    const message = proto.Message
        .StickerPackMessage
        .create({
        stickerPackId: String(stickerPackId),
        name: String(packName ||
            'Haimiya Sticker Pack'),
        publisher: String(publisher ||
            'Haimiya'),
        stickers: stickerMetadata,
        fileLength: zip.length,
        fileSha256: encryptedPack.fileSha256,
        fileEncSha256: encryptedPack.fileEncSha256,
        mediaKey: mediaKey,
        directPath: String(upload.directPath),
        packDescription: String(description ||
            'Haimiya Sticker Pack'),
        mediaKeyTimestamp: Math.floor(Date.now() / 1000),
        trayIconFileName: 'tray_icon.png',
        thumbnailDirectPath: String(thumbnailUpload.directPath),
        thumbnailSha256: encryptedThumbnail.fileSha256,
        thumbnailEncSha256: encryptedThumbnail.fileEncSha256,
        thumbnailHeight: 96,
        thumbnailWidth: 96,
        imageDataHash: imageDataHash,
        stickerPackSize: zip.length,
        stickerPackOrigin: 1
    });
    message.stickerPackId =
        String(message.stickerPackId || '');
    message.name =
        String(message.name || '');
    message.publisher =
        String(message.publisher || '');
    message.directPath =
        String(message.directPath || '');
    message.thumbnailDirectPath =
        String(message.thumbnailDirectPath || '');
    message.packDescription =
        String(message.packDescription || '');
    message.trayIconFileName =
        String(message.trayIconFileName ||
            'tray_icon.png');
    message.imageDataHash =
        String(message.imageDataHash || '');
    return message;
}
async function sendPack(sock, jid, stickerPackMessage) {
    if (!stickerPackMessage) {
        throw new Error('StickerPackMessage vacío.');
    }
    const messageId = generateMessageIDV2(sock.user?.id ||
        jid);
    await sock.relayMessage(jid, {
        stickerPackMessage
    }, {
        messageId
    });
    return 'relayMessage';
}
export default {
    command: ['stickerly-buscar'],
    aliases: [],
    desc: 'Busca y crea un paquete de stickers mediante Haimiya API.',
    usage: 'stickerly-buscar <consulta o enlace Sticker.ly>',
    category: 'sticker',
    isOwner: false,
    isAdmin: false,
    botAdmin: false,
    customPrefix: null,
    hidden: false,
    run: async ({ msg, sock, text }) => {
        let stage = 'inicio';
        await react(sock, msg, '⏳');
        try {
            stage =
                'validación';
            if (!text?.trim()) {
                await react(sock, msg, '❌');
                return msg.reply(`╭─〔 🎭 STICKER PACK 〕
│
│ Uso:
│ #stickerly-buscar <búsqueda>
│
│ Ejemplo:
│ #stickerly-buscar anime
│
│ También puedes usar
│ un enlace de Sticker.ly.
╰──────────────`);
            }
            const user = await db.getUser(msg.sender);
            const creatorName = user?.name ||
                msg.sender?.split('@')[0] ||
                'Haimiya';
            stage =
                'búsqueda de stickers';
            const { detail, selected } = await getPack(text.trim());
            const stickers = extractStickers(detail);
            if (!stickers.length) {
                throw new Error('El pack obtenido no tiene stickers.');
            }
            const packName = extractPackName(detail, selected) ||
                'Haimiya Sticker Pack';
            const publisher = extractPublisher(detail, selected, `@${creatorName}`);
            console.log(`[SPACK] Pack: ${packName}`);
            console.log(`[SPACK] Publisher: ${publisher}`);
            console.log(`[SPACK] Stickers encontrados: ${stickers.length}`);
            stage =
                'descarga y conversión de stickers';
            const processed = [];
            for (let i = 0; i <
                Math.min(stickers.length, MAX_STICKERS); i++) {
                const sticker = stickers[i];
                const url = extractStickerUrl(sticker);
                if (!url) {
                    console.warn(`[SPACK] Sticker ${i + 1} sin URL.`);
                    continue;
                }
                try {
                    const source = await toBuffer(url);
                    const isAnimated = !!(sticker?.isAnimated ||
                        sticker?.animated ||
                        sticker?.isVideo);
                    const buffer = await toWebp(source, isAnimated);
                    processed.push({
                        buffer,
                        isAnimated,
                        isLottie: false,
                        emojis: sticker?.emojis ||
                            sticker?.emoji ||
                            ['🎭'],
                        accessibilityLabel: sticker?.name ||
                            ''
                    });
                    console.log(`[SPACK] Sticker ${i + 1} OK`);
                }
                catch (error) {
                    console.error(`[SPACK] Sticker ${i + 1} falló:`, errorText(error));
                }
            }
            if (!processed.length) {
                throw new Error('No se pudo procesar ningún sticker.');
            }
            stage =
                'preparación de portada';
            let cover = null;
            const thumbnailUrl = firstValue(detail?.thumbnailUrl, detail?.thumbnail, detail?.cover, detail?.pack?.thumbnailUrl, selected?.thumbnailUrl, selected?.thumbnail);
            if (thumbnailUrl) {
                try {
                    cover =
                        await toBuffer(thumbnailUrl);
                }
                catch (error) {
                    console.error('[SPACK] Thumbnail falló:', errorText(error));
                }
            }
            if (!cover) {
                cover =
                    processed[0].buffer;
            }
            stage =
                'construcción del StickerPackMessage';
            const stickerPackMessage = await buildPack({
                sock,
                packName,
                publisher,
                stickers: processed,
                cover,
                description: firstValue(detail?.description, detail?.packDescription, detail?.pack?.description) ||
                    'Haimiya Sticker Pack'
            });
            stage =
                'envío del Sticker Pack';
            const method = await sendPack(sock, msg.chat, stickerPackMessage);
            console.log(`[SPACK] ✓ Enviado mediante ${method}`);
            await react(sock, msg, '✅');
        }
        catch (error) {
            console.error('\n========== HAIMIYA SPACK ERROR ==========');
            console.error('Etapa:', stage);
            console.error('Error:', error);
            console.error('Mensaje:', errorText(error));
            console.error('=========================================\n');
            await react(sock, msg, '❌');
            return msg.reply(`╭─〔 ❌ HAIMIYA SPACK 〕
│
│ No pude completar el Sticker Pack.
│
│ 📍 Etapa:
│ ${stage}
│
│ ⚠️ Error:
│ ${errorText(error).slice(0, 1500)}
│
│ 🔄 Se canceló el envío.
╰──────────────`);
        }
    }
};
