import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'dramatic',
  description: 'Hacer un drama exagerado.',
  solo: 'está haciendo un drama.',
  withUser: 'está haciendo un drama frente a',
  aliases: []
});
