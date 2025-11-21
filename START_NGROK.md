# How to Start ngrok

## Quick Command

Since you're on Windows and in the ngrok folder, run:

```bash
ngrok.exe http 3000
```

Or if ngrok is in your PATH:

```bash
ngrok http 3000
```

## Step-by-Step

1. **Make sure your app is running:**
   ```bash
   cd RhythmRush/frontend
   npm run dev
   ```
   Should show: "Ready on http://localhost:3000"

2. **Open a NEW terminal/command prompt**

3. **Navigate to ngrok folder** (or use full path):
   ```bash
   cd C:\Users\Developer\Downloads\ngrok-v3-stable-windows-amd64
   ```

4. **Start ngrok:**
   ```bash
   ngrok.exe http 3000
   ```

5. **You'll see output like:**
   ```
   Session Status                online
   Account                       Your Name (Plan: Free)
   Version                       x.x.x
   Region                        United States (us)
   Forwarding                    https://abc123-def456.ngrok-free.app -> http://localhost:3000
   
   Connections                   ttl     opn     rt1     rt5     p50     p90
                                 0       0       0.00    0.00    0.00    0.00
   ```

6. **Copy the HTTPS URL** (the one starting with `https://`)
   Example: `https://abc123-def456.ngrok-free.app`

7. **Open Opera Mini on your phone** and go to that URL!

## Important Notes

- Keep ngrok running while testing
- Keep `npm run dev` running too
- Use the HTTPS URL (not HTTP)
- The URL changes each time you restart ngrok (unless you have a paid plan)

## Troubleshooting

**"ngrok.exe: command not found"**
- Make sure you're in the ngrok folder
- Or use full path: `C:\Users\Developer\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe http 3000`

**"port 3000 already in use"**
- Make sure `npm run dev` is running
- Or use a different port: `ngrok.exe http 3001` (and update your app port)

**"authtoken required"**
- Sign up at ngrok.com
- Get your authtoken from dashboard
- Run: `ngrok.exe config add-authtoken YOUR_TOKEN`

