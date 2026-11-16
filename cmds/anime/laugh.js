import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'laugh',
  description: 'Reírse con alguien.',
  solo: 'se está riendo.',
  withUser: 'se está riendo con',
  aliases: []
});
