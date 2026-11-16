import { createAnimeInteraction } from '../../lib/anime-interaction.js';

export default createAnimeInteraction({
  command: 'draw',
  description: 'Hacer un dibujo de alguien.',
  solo: 'está haciendo un dibujo.',
  withUser: 'está dibujando a',
  aliases: []
});
