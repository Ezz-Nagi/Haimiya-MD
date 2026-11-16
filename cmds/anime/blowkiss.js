import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'blowkiss',
  description: 'Lanzar un beso al aire.',
  solo: 'se mandó un beso al espejo.',
  withUser: 'le lanzó un beso a',
  aliases: []
});
