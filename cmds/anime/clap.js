import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'clap',
  description: 'Aplaudir a alguien.',
  solo: 'está aplaudiendo.',
  withUser: 'está aplaudiendo a',
  aliases: []
});
