import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'sniff',
  description: 'Olfatear algo o a alguien.',
  solo: 'está olfateando el ambiente.',
  withUser: 'está olfateando a',
  aliases: []
});
