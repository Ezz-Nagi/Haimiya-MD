import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'hug',
  description: 'Abrazar a alguien.',
  solo: 'se dio un abrazo.',
  withUser: 'le dio un abrazo a',
  aliases: ["abrazo"]
});
