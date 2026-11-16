import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'heat',
  description: 'Mostrar que tiene mucho calor.',
  solo: 'tiene muchísimo calor.',
  withUser: 'siente el calor junto a',
  aliases: []
});
