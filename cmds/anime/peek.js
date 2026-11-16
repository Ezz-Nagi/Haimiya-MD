import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'peek',
  description: 'Espiar discretamente a alguien.',
  solo: 'se asomó con curiosidad.',
  withUser: 'está espiando a',
  aliases: []
});
