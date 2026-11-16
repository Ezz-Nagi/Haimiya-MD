import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'dance',
  description: 'Bailar con alguien.',
  solo: 'está bailando.',
  withUser: 'está bailando con',
  aliases: ["bailar"]
});
