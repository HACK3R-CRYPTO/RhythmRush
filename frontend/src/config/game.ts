// Game configuration
// RhythmRush supports multiple games

// Game Types
export type GameType = 'rhythm' | 'simon' | 'unity';

// Available games
export const GAMES = {
  rhythm: {
    name: 'Rhythm Rush',
    description: 'Tap buttons in rhythm',
    path: '/game',
    icon: '🎵'
  },
  simon: {
    name: 'Simon Game',
    description: 'Memory pattern game',
    path: '/simon-game',
    icon: '🧠'
  }
} as const;

// Default game
export const DEFAULT_GAME: GameType = 'rhythm';

// Enable game
export const GAME_ENABLED = true;

