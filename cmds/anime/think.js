import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'think',
  description: 'Pensar en alguien.',
  solo: 'está pensando profundamente.',
  withUser: 'no puede dejar de pensar en',
  aliases: []
});
