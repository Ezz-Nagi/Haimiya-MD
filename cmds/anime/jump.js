import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'jump',
  description: 'Saltar de felicidad.',
  solo: 'está saltando de felicidad.',
  withUser: 'está saltando feliz junto a',
  aliases: []
});
