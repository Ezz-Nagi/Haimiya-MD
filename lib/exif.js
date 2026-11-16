import fs from 'fs';
import { tmpdir } from 'os';
import Crypto from 'crypto';
import ff from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
if (ffmpegPath)
    ff.setFfmpegPath(ffmpegPath);
import webp from 'node-webpmux';
import path from 'path';
const TMP_DIR = path.resolve(process.cwd(), 'lib', 'system', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });
const tempPath = (ext = 'webp') => path.join(TMP_DIR, `${Crypto.randomBytes(9).toString('hex')}.${ext}`);
const safeUnlink = (file) => {
    try {
        if (file && fs.existsSync(file))
            fs.unlinkSync(file);
    }
    catch { }
};
async function addExifMetadata(webpBuffer, metadata = {}) {
    if (!Buffer.isBuffer(webpBuffer) || webpBuffer.length < 16)
        throw new Error('WEBP inválido o vacío');
    const tmpIn = tempPath('webp');
    const tmpOut = tempPath('webp');
    try {
        fs.writeFileSync(tmpIn, webpBuffer);
        const img = new webp.Image();
        await img.load(tmpIn);
        const json = {
            'sticker-pack-id': String(metadata.packid || 'Haimiya OFC'),
            'sticker-pack-name': String(metadata.packname || 'Haimiya OFC'),
            'sticker-pack-publisher': String(metadata.author || 'Haimiya'),
            emojis: Array.isArray(metadata.categories) && metadata.categories.length ? metadata.categories : ['🎭']
        };
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
        ]);
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);
        img.exif = exif;
        await img.save(tmpOut);
        return fs.readFileSync(tmpOut);
    }
    finally {
        safeUnlink(tmpIn);
        safeUnlink(tmpOut);
    }
}
async function normalizeWebp(media) {
    try {
        const img = new webp.Image();
        const tmp = tempPath('webp');
        try {
            fs.writeFileSync(tmp, media);
            await img.load(tmp);
            return media;
        }
        finally {
            safeUnlink(tmp);
        }
    }
    catch {
        return await imageToWebp(media);
    }
}
async function imageToWebp(media) {
    const tmpFileOut = path.join('lib', 'system', tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join('lib', 'system', tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
    fs.writeFileSync(tmpFileIn, media);
    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
            '-vcodec',
            'libwebp',
            '-vf',
            "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        ])
            .toFormat('webp')
            .save(tmpFileOut);
    });
    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}
async function videoToWebp(media) {
    const tmpFileOut = path.join('lib', 'system', tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join('lib', 'system', tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    fs.writeFileSync(tmpFileIn, media);
    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
            '-vcodec',
            'libwebp',
            '-vf',
            "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
            '-loop',
            '0',
            '-ss',
            '00:00:00',
            '-t',
            '00:00:05',
            '-preset',
            'default',
            '-an',
            '-vsync',
            '0',
        ])
            .toFormat('webp')
            .save(tmpFileOut);
    });
    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}
async function writeExifImg(media, metadata = {}) {
    const wMedia = await imageToWebp(media);
    return addExifMetadata(wMedia, metadata);
}
async function writeExifVid(media, metadata = {}) {
    const wMedia = await videoToWebp(media);
    return addExifMetadata(wMedia, metadata);
}
async function writeExif(media, metadata = {}) {
    let wMedia;
    if (/webp/i.test(media?.mimetype || '')) {
        wMedia = await normalizeWebp(media.data);
    }
    else if (/image/i.test(media?.mimetype || '')) {
        wMedia = await imageToWebp(media.data);
    }
    else if (/video/i.test(media?.mimetype || '')) {
        wMedia = await videoToWebp(media.data);
    }
    else {
        throw new Error('Formato no compatible para sticker');
    }
    return addExifMetadata(wMedia, metadata);
}
export default { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif };
