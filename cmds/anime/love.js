import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'love',
  description: 'Expresar cariño a alguien.',
  solo: 'se está dando cariño.',
  withUser: 'le demuestra cariño a',
  aliases: []
});
