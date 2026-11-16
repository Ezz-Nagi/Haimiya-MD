import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'eat',
  description: 'Comer junto a alguien.',
  solo: 'está disfrutando de su comida.',
  withUser: 'está comiendo junto a',
  aliases: ["comer", "nom"]
});
