import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'sleep',
  description: 'Dormir plácidamente.',
  solo: 'se quedó dormido.',
  withUser: 'se quedó dormido junto a',
  aliases: []
});
