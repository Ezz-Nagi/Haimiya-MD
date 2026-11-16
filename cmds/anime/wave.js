import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'wave',
  description: 'Saludar a alguien con la mano.',
  solo: 'está saludando con la mano.',
  withUser: 'está saludando a',
  aliases: []
});
