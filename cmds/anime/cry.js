import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'cry',
  description: 'Llorar por algo o alguien.',
  solo: 'está llorando.',
  withUser: 'está llorando por',
  aliases: []
});
