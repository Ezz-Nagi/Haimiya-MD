import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'smile',
  description: 'Sonreírle a alguien.',
  solo: 'está sonriendo.',
  withUser: 'le sonrió a',
  aliases: []
});
