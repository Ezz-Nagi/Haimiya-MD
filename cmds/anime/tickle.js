import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'tickle',
  description: 'Hacerle cosquillas a alguien.',
  solo: 'se está haciendo cosquillas.',
  withUser: 'le está haciendo cosquillas a',
  aliases: []
});
