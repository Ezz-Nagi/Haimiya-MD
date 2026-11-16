import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'trip',
  description: 'Tropezar de forma cómica.',
  solo: 'se tropezó accidentalmente.',
  withUser: 'tropezó cerca de',
  aliases: []
});
