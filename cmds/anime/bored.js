import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'bored',
  description: 'Mostrar aburrimiento.',
  solo: 'está aburrido.',
  withUser: 'está aburrido junto a',
  aliases: []
});
