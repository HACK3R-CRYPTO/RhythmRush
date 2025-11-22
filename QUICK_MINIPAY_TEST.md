# Quick MiniPay Test Guide

## Fastest Way to Test MiniPay

### Step 1: Start Everything

Terminal 1:
cd RhythmRush/frontend
npm run dev

Terminal 2:
ngrok http 3000

Copy the HTTPS URL. Example: https://abc123.ngrok-free.app

### Step 2: Test on Phone

1. Open MiniPay app on your phone
2. Use browser inside MiniPay
3. Go to: https://abc123.ngrok-free.app/wallet-connect
4. Look for green badge

### Step 3: What You Should See

If MiniPay is detected:
- Green badge: MiniPay Detected
- Add Cash to MiniPay button
- After connecting: cUSD balance on mint page

If not detected:
- No badge. This is normal if MiniPay wallet is not enabled
- Regular wallet connection still works
- App functions normally

## For Demo Video

If MiniPay works:
Show the actual detection and features

If MiniPay does not work:
1. Show the code in frontend/src/utils/minipay.ts
2. Explain: This code detects MiniPay automatically
3. Show UI components that appear for MiniPay users
4. Explain the benefits

## Code to Show in Video

Detection Code:
frontend/src/utils/minipay.ts
export function isMiniPayAvailable(): boolean {
  return !!(window.ethereum && window.ethereum.isMiniPay);
}

UI Component:
frontend/src/app/wallet-connect/page.tsx
{isMiniPay && (
  <div className="mb-4 p-4 bg-green-500/20">
    <p>MiniPay Detected</p>
  </div>
)}

cUSD Balance:
frontend/src/app/mint/page.tsx
{isMiniPay && (
  <div>cUSD Balance: {cUSDBalance} cUSD</div>
)}

## What Judges Want to See

1. Integration exists. Code is there
2. Features implemented. Detection, balance, deeplink
3. Documentation. Complete docs
4. Understanding. You know what MiniPay is

You do not need perfect testing. Show the code and explain the features.
