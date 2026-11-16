import { watchFile, unwatchFile } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Configuración pública. La clave de Haimiya API se inyecta desde el hosting;
// nunca debe guardarse en este archivo ni publicarse en GitHub.
export const config = {
  ownerNumber: '',
  channelJid: '120363424850969101@newsletter',
  channelUrl: 'https://whatsapp.com/channel/0029VbCp0lj2UPBDo1HDzq3Z',
  groupUrl: 'https://chat.whatsapp.com/LKi2QOyN3EOImmZNjrxC4D?s=cl&p=a&iam=2',
  theme: 'auto',
  api: {
    baseUrl: 'https://haimiya.hidenplay.net/v1',
    apiKey: process.env.HAIMIYA_API_KEY || '',
    timeout: 45000
  },
  limits: {
    freeSubBots: 20,
    premiumBots: Infinity,
    principalBots: 1
  }
};

global.config = config;
global.haimiyaApi = config.api;
global.owner = config.ownerNumber ? [config.ownerNumber] : [];
global.ownerUser = '@Ezz_nagi';
global.ownerWA = config.ownerNumber ? [config.ownerNumber] : [];
global.mods = global.mods || [];
global.botLimits = config.limits;
global.msgglobal = '💢 Algo falló. Inténtalo de nuevo.';
global.dev = 'Ezz';
global.credit = 'Desarrollado por Ezz · HAIMIYA';
global.webUrl = 'https://haimiya.hidenplay.net';
global.mess = {
  socket: '⛓️ Este comando solo está disponible desde una sesión secundaria.',
  admin: '✦ Necesitas permisos de administrador para usar este comando.',
  botAdmin: '✦ Dame permisos de administrador y vuelve a intentarlo.',
  comandooff: '⛓️ Este comando está desactivado en este grupo.',
  owner: '🔒 Este comando está reservado para el developer.'
};
global.subLimits = {
  daily: { youtube: 50, instagram: 50 },
  premiumOnly: ['deepseek', 'claude', 'gemini', 'imagen-ia'],
  commandQuota: { play: 'youtube', instagram: 'instagram' },
  labels: { youtube: 'Descargas de YouTube', instagram: 'Descargas de Instagram' }
};
global.my = { ch: config.channelJid, chUrl: config.channelUrl, groupUrl: config.groupUrl };
global.waSock = null;
global.waReady = false;
global.conns = global.conns || [];

const file = fileURLToPath(import.meta.url);
watchFile(file, () => {
  unwatchFile(file);
  import(`${file}?update=${Date.now()}`);
});
