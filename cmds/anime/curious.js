import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'curious',
  description: 'Mostrar curiosidad por alguien.',
  solo: 'está lleno de curiosidad.',
  withUser: 'siente curiosidad por',
  aliases: []
});
