import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'scream',
  description: 'Gritar de forma exagerada.',
  solo: 'está gritando al viento.',
  withUser: 'está gritando junto a',
  aliases: []
});
