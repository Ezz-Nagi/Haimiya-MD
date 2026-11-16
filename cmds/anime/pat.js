import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'pat',
  description: 'Acariciar la cabeza de alguien.',
  solo: 'se acarició la cabeza con ternura.',
  withUser: 'le acarició la cabeza a',
  aliases: []
});
