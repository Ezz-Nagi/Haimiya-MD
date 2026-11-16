import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'shy',
  description: 'Ponerse tímido frente a alguien.',
  solo: 'se sonrojó tímidamente.',
  withUser: 'se puso tímido frente a',
  aliases: ["timido"]
});
