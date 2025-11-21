# MiniPay Quick Start Guide

## What is MiniPay?

MiniPay is a stablecoin wallet built into Opera Mini browser. It allows users to:
- Use phone numbers as wallet addresses
- Make low-cost transactions with cUSD
- Access dApps directly from the wallet

## How to Test MiniPay Integration

### Simple 3-Step Process

#### Step 1: Install MiniPay
- **Android**: Download [MiniPay app](https://play.google.com/store/apps/details?id=com.opera.minipay) OR use Opera Mini browser
- **iOS**: Download [MiniPay app](https://apps.apple.com/de/app/minipay-easy-global-wallet/id6504087257)

#### Step 2: Set Up ngrok (for local testing)

1. Sign up at [ngrok.com](https://ngrok.com) (free)
2. Install ngrok (follow their instructions)
3. Start your app: `cd frontend && npm run dev`
4. In another terminal: `ngrok http 3000`
5. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

#### Step 3: Test in MiniPay

1. Open MiniPay app/browser on your phone
2. Navigate to your ngrok URL
3. You should see:
   - ✅ Green "MiniPay Detected!" badge
   - ✅ "Add Cash to MiniPay" button
   - ✅ cUSD balance on mint page

## What You'll See

### On Desktop (No MiniPay)
- Regular wallet connection
- No MiniPay badge
- No cUSD balance display

### In MiniPay Browser/App
- 🟢 Green "MiniPay Detected!" badge
- 💰 "Add Cash to MiniPay" button
- 💵 cUSD balance displayed
- All features work normally

## Testing Checklist

- [ ] MiniPay app installed
- [ ] ngrok running (`ngrok http 3000`)
- [ ] App running (`npm run dev`)
- [ ] Open ngrok URL in MiniPay
- [ ] See MiniPay badge on wallet connect page
- [ ] Connect wallet successfully
- [ ] See cUSD balance on mint page

## Common Questions

**Q: Do I need MiniPay to use the app?**
A: No! The app works with any wallet. MiniPay just adds extra features.

**Q: Can I test on desktop?**
A: Yes, but you won't see MiniPay features. Use a phone with MiniPay for full testing.

**Q: What if I don't see the MiniPay badge?**
A: Make sure you're accessing via MiniPay browser/app, not regular browser.

**Q: How do I get testnet cUSD?**
A: Use Celo Sepolia faucet: https://faucet.celo.org/celo-sepolia

## Production Use

Once deployed:
- No ngrok needed
- Users access via your production URL
- MiniPay detection works automatically
- Works with any wallet (MiniPay or not)

## Need Help?

Check browser console for debug logs:
- Look for "🔍 Wallet Detection" messages
- Verify `window.ethereum.isMiniPay` exists

