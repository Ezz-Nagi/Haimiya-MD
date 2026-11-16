import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'snuggle',
  description: 'Acurrucarse con alguien.',
  solo: 'se acurrucó cómodamente.',
  withUser: 'se acurrucó junto a',
  aliases: []
});
