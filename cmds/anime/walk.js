import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'walk',
  description: 'Dar un paseo con alguien.',
  solo: 'salió a caminar.',
  withUser: 'salió a caminar con',
  aliases: []
});
