import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'kisscheek',
  description: 'Dar un beso en la mejilla.',
  solo: 'se dio un beso en la mejilla frente al espejo.',
  withUser: 'le dio un beso en la mejilla a',
  aliases: ["beso"]
});
