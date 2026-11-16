import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'sad',
  description: 'Mostrar tristeza.',
  solo: 'está triste.',
  withUser: 'está triste junto a',
  aliases: ["triste"]
});
