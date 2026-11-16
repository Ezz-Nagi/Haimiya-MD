import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'sing',
  description: 'Cantarle a alguien.',
  solo: 'está cantando alegremente.',
  withUser: 'le está cantando a',
  aliases: []
});
