import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'cold',
  description: 'Mostrar que tiene frío.',
  solo: 'tiene mucho frío.',
  withUser: 'se está congelando junto a',
  aliases: []
});
