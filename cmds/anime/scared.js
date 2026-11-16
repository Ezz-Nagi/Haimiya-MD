import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'scared',
  description: 'Mostrar miedo ante algo.',
  solo: 'está asustado.',
  withUser: 'está asustado junto a',
  aliases: []
});
