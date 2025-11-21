# Sound Files Setup

## Copy Simon Game Sounds

To enable sound effects in the Simon Game, copy the sound files from the Simon-Game directory:

### Steps:

1. Copy these files from `Simon-Game/sounds/` to `RhythmRush/frontend/public/sounds/`:
   - `red.mp3`
   - `blue.mp3`
   - `green.mp3`
   - `yellow.mp3`
   - `wrong.mp3`

### Quick Copy Command (Windows):

```powershell
Copy-Item "C:\Users\Developer\Desktop\my work\hackathon\WalletConnect\celo\Simon-Game\sounds\*" -Destination "RhythmRush\frontend\public\sounds\" -Recurse
```

### Quick Copy Command (Mac/Linux):

```bash
cp -r "Simon-Game/sounds/"* "RhythmRush/frontend/public/sounds/"
```

## Sound Files Required:

- ✅ `red.mp3` - Red button sound
- ✅ `blue.mp3` - Blue button sound  
- ✅ `green.mp3` - Green button sound
- ✅ `yellow.mp3` - Yellow button sound
- ✅ `wrong.mp3` - Wrong answer sound

## After Copying:

The Simon Game will automatically use these sounds when buttons are clicked. No code changes needed!

