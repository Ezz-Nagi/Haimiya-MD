import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'nope',
  description: 'Expresar desacuerdo con alguien.',
  solo: 'expresó claramente su desacuerdo.',
  withUser: 'le está diciendo que no a',
  aliases: []
});
