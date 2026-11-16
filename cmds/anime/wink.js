import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'wink',
  description: 'Guiñarle un ojo a alguien.',
  solo: 'guiñó un ojo al espejo.',
  withUser: 'le guiñó un ojo a',
  aliases: []
});
