# Unity Game Setup for RhythmRush

## Understanding Unity WebGL Games

Unity WebGL games are browser-based games built with Unity engine. They run in the browser without plugins.

## Option 1: Create a Simple Unity Rhythm Game

### Step 1: Install Unity

1. Download Unity Hub: https://unity.com/download
2. Install Unity Editor (2021.3 LTS or newer)
3. Create new project with WebGL template

### Step 2: Build Simple Rhythm Game

Basic rhythm game features:
- Tap/click buttons in sync with music
- Score based on timing accuracy
- Display final score
- Simple UI

### Step 3: Build for WebGL

1. In Unity: File → Build Settings
2. Select WebGL platform
3. Click Build
4. Choose output folder
5. Unity generates HTML, JS, and data files

### Step 4: Host the Game

Upload the build folder to:
- Vercel (free)
- Netlify (free)
- GitHub Pages (free)
- Your own server

### Step 5: Update Frontend

Update `src/config/game.ts`:
```typescript
export const GAME_URL = 'https://your-game.vercel.app/';
export const GAME_ENABLED = true;
```

## Option 2: Use Existing Unity Game Template

Search Unity Asset Store for:
- "Rhythm Game Template"
- "Music Game Template"
- "Tap Game Template"

Many templates available for free or low cost.

## Option 3: Simple HTML5 Game (Easier Alternative)

Instead of Unity, create a simple HTML5 rhythm game:

### Create `public/game.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>RhythmRush Game</title>
    <style>
        body { margin: 0; padding: 0; background: #1a1a1a; }
        #game-container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="gameCanvas"></canvas>
    </div>
    <script>
        // Simple rhythm game logic here
        // Use Web Audio API for music
        // Canvas for rendering
    </script>
</body>
</html>
```

Then embed in play page or host separately.

## Option 4: Use Reference Game (Temporary)

For hackathon demo, you can:
1. Use the reference URL temporarily
2. Or create a simple score simulator
3. Focus on blockchain integration

## Option 5: Score Simulator (Quick Demo)

Create a simple page that simulates gameplay:

```typescript
// Simulate game play
const simulateGame = () => {
  // Show countdown
  // Display rhythm buttons
  // Calculate score based on clicks
  // Return final score
}
```

## Recommended Approach for Hackathon

**Quick solution:**
1. Create a simple HTML5 rhythm game
2. Host on Vercel/Netlify
3. Game sends score back to frontend
4. Frontend submits score to blockchain

**Or:**
1. Use a simple score input page (already built)
2. Focus demo on blockchain features
3. Mention game integration coming soon

## Integration Flow

1. Player clicks "START GAME"
2. Opens game in new window/tab
3. Player plays game
4. Game calculates score
5. Game redirects back with score parameter
6. Frontend receives score
7. Auto-submits to blockchain

## Example Game Integration

```typescript
// In your Unity game (C#)
public void OnGameEnd(int finalScore) {
    // Redirect back to frontend with score
    Application.ExternalCall("window.parent.postMessage", 
        JSON.stringify({ score: finalScore, type: "GAME_SCORE" }), 
        "*");
}

// In frontend (React)
useEffect(() => {
    window.addEventListener('message', (event) => {
        if (event.data.type === 'GAME_SCORE') {
            setScore(event.data.score);
            router.push('/submit-score?score=' + event.data.score);
        }
    });
}, []);
```

## For Now (Hackathon Demo)

The current setup works perfectly:
- Players mint Gems
- Players submit scores manually
- Leaderboard shows rankings
- Rewards are distributed

You can add the Unity game later. The blockchain integration is complete and functional.

