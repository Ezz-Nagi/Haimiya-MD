import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'pout',
  description: 'Hacer pucheros frente a alguien.',
  solo: 'está haciendo pucheros.',
  withUser: 'está haciendo pucheros frente a',
  aliases: []
});
