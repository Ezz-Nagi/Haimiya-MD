import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'kiss',
  description: 'Besar a alguien.',
  solo: 'se mandó un beso al aire.',
  withUser: 'le dio un beso a',
  aliases: ["muak"]
});
