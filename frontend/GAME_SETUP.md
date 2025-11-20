# Game Setup Guide

## Current Setup

The RhythmRush frontend is configured to redirect to an external Unity game. Currently, it uses a reference game URL for demonstration purposes.

## Options for Game Integration

### Option 1: Use Reference Game (Temporary - For Demo)

The current setup uses `https://play.metakraft.live/Build/` as a placeholder. This works for:
- Testing the flow
- Hackathon demo
- Development

**To use:** No changes needed. The game redirect is already configured.

### Option 2: Host Your Own Unity Game

If you have a Unity WebGL build:

1. **Host the game:**
   - Upload Unity WebGL build to hosting service (Vercel, Netlify, GitHub Pages, etc.)
   - Or use a CDN service

2. **Update game URL:**
   - Edit `src/config/game.ts`
   - Change `GAME_URL` to your hosted game URL
   - Or set `NEXT_PUBLIC_GAME_URL` in `.env` file

3. **Example:**
   ```typescript
   export const GAME_URL = 'https://your-game.vercel.app/';
   ```

### Option 3: Disable Game Redirect (Manual Score Submission)

For hackathon demo, you can disable the game redirect and let users submit scores manually:

1. Edit `src/config/game.ts`:
   ```typescript
   export const GAME_ENABLED = false;
   ```

2. Users can:
   - Mint Gem NFT
   - Go directly to "Submit Score" page
   - Enter their score manually
   - View leaderboard and claim rewards

This demonstrates the full play-to-earn flow without requiring a Unity game.

### Option 4: Create Simple HTML5 Game

You can create a simple rhythm game using:
- HTML5 Canvas
- JavaScript game libraries (Phaser, PixiJS, etc.)
- Web Audio API for rhythm

Then embed it in the play page or host separately.

## For Hackathon Submission

**Recommended approach:**
1. Keep `GAME_ENABLED = false` for now
2. Focus on demonstrating:
   - NFT minting flow
   - Score submission
   - Leaderboard
   - Reward claiming
3. Mention in demo video that game integration is coming
4. Show the full blockchain flow works

## Configuration Files

- `src/config/game.ts` - Game URL and enable/disable settings
- `.env` - Environment variable for game URL (optional)

## Testing the Flow

Even without a game, you can test:
1. Connect wallet
2. Mint Gem NFT
3. Submit score manually
4. View leaderboard
5. Claim rewards

All blockchain interactions work independently of the game.

