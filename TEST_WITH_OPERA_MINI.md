# Testing MiniPay with Opera Mini

## Step-by-Step Testing Guide

### Step 1: Start Your Development Server

Open Terminal 1:
```bash
cd RhythmRush/frontend
npm run dev
```

Your app should start on `http://localhost:3000`

### Step 2: Set Up ngrok

**If you don't have ngrok:**

1. Go to [ngrok.com](https://ngrok.com)
2. Sign up for free account
3. Download ngrok for Windows
4. Extract and add to PATH, or run from folder

**Start ngrok:**

Open Terminal 2:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123-def456.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Step 3: Test in Opera Mini

1. **Open Opera Mini** on your phone
2. **Navigate to your ngrok URL** (e.g., `https://abc123-def456.ngrok-free.app`)
3. **What to expect:**
   - App loads normally
   - Go to `/wallet-connect` page
   - You should see green "🎉 MiniPay Detected!" badge
   - "Add Cash to MiniPay" button appears

### Step 4: Connect Wallet

1. Click "Connect Wallet" button
2. Opera Mini/MiniPay will prompt for connection
3. Approve the connection
4. You should be redirected to `/mint` page

### Step 5: Check cUSD Balance

1. On the mint page, look for:
   - Green highlighted section showing "cUSD Balance: X.XX cUSD"
   - This appears above CELO and RUSH balances

## Troubleshooting

### Opera Mini Not Detecting MiniPay

**Check 1:** Make sure you're using Opera Mini (not Opera browser)
- Opera Mini has MiniPay built-in
- Regular Opera browser doesn't have MiniPay

**Check 2:** Open browser console (if possible)
- Look for: `window.ethereum.isMiniPay` should be `true`
- Check console logs for "🔍 Wallet Detection" messages

**Check 3:** Try MiniPay standalone app instead
- Download: [Android](https://play.google.com/store/apps/details?id=com.opera.minipay)
- Sometimes works better than Opera Mini

### ngrok URL Not Loading

**Problem:** "This site can't be reached"

**Solutions:**
- Make sure `npm run dev` is running
- Make sure ngrok is running (`ngrok http 3000`)
- Try refreshing the page
- Check ngrok dashboard for active tunnels

### MiniPay Badge Not Showing

**Possible reasons:**
1. Not using Opera Mini (using regular browser)
2. MiniPay not enabled in Opera Mini settings
3. Need to enable MiniPay wallet first

**Solution:**
- Open Opera Mini settings
- Look for "MiniPay" or "Wallet" settings
- Enable MiniPay if disabled
- Restart Opera Mini

### Wallet Connection Fails

**Check:**
- Make sure you're on Celo Sepolia testnet
- Opera Mini might need network configuration
- Try switching networks in MiniPay settings

## What Success Looks Like

✅ **On Wallet Connect Page:**
- Green badge: "🎉 MiniPay Detected!"
- Message about seamless transactions
- "Add Cash to MiniPay" button visible

✅ **After Connecting:**
- Redirected to mint page
- Wallet address shown in status bar

✅ **On Mint Page:**
- Green section showing cUSD balance
- CELO balance shown
- RUSH balance shown
- All balances update correctly

## Quick Test Checklist

- [ ] Development server running (`npm run dev`)
- [ ] ngrok running (`ngrok http 3000`)
- [ ] Copied ngrok HTTPS URL
- [ ] Opened Opera Mini on phone
- [ ] Navigated to ngrok URL
- [ ] App loads successfully
- [ ] MiniPay badge appears
- [ ] Wallet connects successfully
- [ ] cUSD balance displays

## Alternative: Test Without Phone

If you can't test on phone right now:

1. **Check code integration:**
   - Open browser console on desktop
   - Type: `window.ethereum?.isMiniPay`
   - Should return `undefined` (normal for desktop)

2. **Verify detection logic:**
   - Code checks `window.ethereum.isMiniPay`
   - If true → shows MiniPay features
   - If false/undefined → shows regular UI

3. **For demo video:**
   - Show the code integration
   - Explain MiniPay detection
   - Show that it works with any wallet

## Next Steps

Once testing works:
1. Record demo video showing MiniPay integration
2. Show MiniPay badge appearing
3. Show cUSD balance display
4. Show seamless wallet connection

Your integration is ready! 🎉

