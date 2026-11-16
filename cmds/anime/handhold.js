import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'handhold',
  description: 'Tomar de la mano a alguien.',
  solo: 'se tomó de la mano consigo mismo.',
  withUser: 'le tomó la mano a',
  aliases: []
});
