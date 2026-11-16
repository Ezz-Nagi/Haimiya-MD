import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'angry',
  description: 'Mostrar enfado con alguien.',
  solo: 'está bastante enfadado.',
  withUser: 'está enfadado con',
  aliases: []
});
