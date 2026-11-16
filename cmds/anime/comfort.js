import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'comfort',
  description: 'Consolar a alguien.',
  solo: 'se está dando ánimos.',
  withUser: 'está consolando a',
  aliases: []
});
