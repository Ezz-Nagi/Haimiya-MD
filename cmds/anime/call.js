import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'call',
  description: 'Llamar a alguien.',
  solo: 'está haciendo una llamada.',
  withUser: 'está llamando a',
  aliases: []
});
