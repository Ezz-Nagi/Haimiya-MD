import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'highfive',
  description: 'Chocar los cinco con alguien.',
  solo: 'chocó los cinco con el aire.',
  withUser: 'chocó los cinco con',
  aliases: []
});
