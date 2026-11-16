import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'stare',
  description: 'Mirar fijamente a alguien.',
  solo: 'se quedó mirando al vacío.',
  withUser: 'está mirando fijamente a',
  aliases: []
});
