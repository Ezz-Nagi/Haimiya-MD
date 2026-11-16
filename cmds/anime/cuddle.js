import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'cuddle',
  description: 'Acurrucarse cariñosamente con alguien.',
  solo: 'se acurrucó cómodamente.',
  withUser: 'se acurrucó con',
  aliases: []
});
