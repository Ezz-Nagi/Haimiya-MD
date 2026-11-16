import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'happy',
  description: 'Compartir un momento feliz.',
  solo: 'está muy feliz.',
  withUser: 'está feliz junto a',
  aliases: ["feliz"]
});
