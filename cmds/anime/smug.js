import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'smug',
  description: 'Mostrar una expresión presumida.',
  solo: 'está presumiendo.',
  withUser: 'está presumiendo frente a',
  aliases: []
});
