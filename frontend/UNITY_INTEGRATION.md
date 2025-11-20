# Unity Game Integration Guide

## Ready for Later - Unity Integration Setup

The frontend is already configured to support Unity games. When you're ready to build your Unity game, follow these steps:

## Quick Setup (3 Steps)

### Step 1: Build Unity Game for WebGL

1. Open Unity Editor
2. File → Build Settings
3. Select WebGL platform
4. Click Build
5. Choose output folder

### Step 2: Host Your Unity Build

Upload the build folder to:
- **Vercel** (recommended): Drag & drop build folder
- **Netlify**: Drag & drop build folder  
- **GitHub Pages**: Push to repo, enable Pages
- **Your own server**: Upload via FTP

### Step 3: Update Config

Edit `src/config/game.ts`:

```typescript
export const GAME_TYPE: 'html5' | 'unity' = 'unity';
export const UNITY_GAME_URL = 'https://your-unity-game.vercel.app/';
```

That's it! The game will now use Unity instead of HTML5.

## Unity Game Requirements

Your Unity game must send the score back to the frontend when the game ends.

### Method 1: postMessage (Recommended)

In your Unity C# script, when game ends:

```csharp
using System.Runtime.InteropServices;

public class GameManager : MonoBehaviour 
{
    [DllImport("__Internal")]
    private static extern void SendScoreToParent(int score);
    
    public void OnGameEnd(int finalScore) 
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
            SendScoreToParent(finalScore);
        #endif
    }
}
```

In your Unity project's `Assets/Plugins/` folder, create `SendScoreToParent.jslib`:

```javascript
mergeInto(LibraryManager.library, {
    SendScoreToParent: function (score) {
        window.parent.postMessage({
            type: 'GAME_SCORE',
            score: score
        }, '*');
    }
});
```

### Method 2: URL Redirect

In your Unity C# script:

```csharp
public void OnGameEnd(int finalScore) 
{
    string returnUrl = Application.absoluteURL.Contains("return=") 
        ? Application.absoluteURL.Split('=')[1] 
        : "/submit-score";
    
    string redirectUrl = $"{returnUrl}?score={finalScore}";
    Application.ExternalEval($"window.location.href = '{redirectUrl}';");
}
```

## Testing Unity Integration

1. Build your Unity game for WebGL
2. Host it locally or on a test server
3. Update `UNITY_GAME_URL` to point to your test build
4. Set `GAME_TYPE = 'unity'` in config
5. Test the full flow: Play → Score → Submit

## Which is Better?

### HTML5 Game (Current)
✅ **Ready now** - No build needed  
✅ **Fast** - Instant load, no download  
✅ **Simple** - Easy to modify  
✅ **Perfect for hackathon demo**  
❌ Less polished than Unity

### Unity Game (Future)
✅ **Professional** - Better graphics & gameplay  
✅ **More features** - Advanced game mechanics  
✅ **Scalable** - Can add complex features  
❌ Requires Unity knowledge  
❌ Build & host process  
❌ Larger file size

## Recommendation

**For Hackathon Demo:** Use HTML5 game (current setup)  
- It works perfectly right now
- Demonstrates full blockchain integration
- No extra setup needed
- Focus on showcasing blockchain features

**For Production:** Build Unity game later  
- Better user experience
- More engaging gameplay
- Professional polish
- Can take time to build properly

## Current Status

✅ HTML5 game: **Ready & Working**  
⏳ Unity integration: **Code Ready, Waiting for Unity Build**

The frontend code is already set up to handle Unity games. Just switch `GAME_TYPE` when your Unity game is ready!

