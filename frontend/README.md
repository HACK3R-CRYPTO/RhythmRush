# RhythmRush Frontend

Next.js frontend for RhythmRush game. Connect wallet. Buy tokens. Mint Gems. Play games. Earn rewards.

## What This Frontend Does

You connect your wallet. You buy RUSH tokens. You mint Gem NFTs. You play games. You submit scores. You view leaderboard. You claim rewards.

## Prerequisites

Install Node.js 18 or higher. Install npm or yarn. Have a wallet extension ready. Configure Celo Sepolia testnet in your wallet.

## Installation

Navigate to frontend directory:

```bash
cd RhythmRush/frontend
```

Install dependencies:

```bash
npm install
```

Create `.env.local` file (optional):

```env
NEXT_PUBLIC_CHAIN_ID=11142220
NEXT_PUBLIC_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
```

## Development

Start development server:

```bash
npm run dev
```

Visit http://localhost:3000 in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── wallet-connect/
│   │   ├── mint/
│   │   ├── play/
│   │   ├── game/
│   │   ├── simon-game/
│   │   ├── submit-score/
│   │   └── leaderboard/
│   ├── components/
│   │   ├── iPhoneFrame.tsx
│   │   ├── Loading.tsx
│   │   └── SuccessBanner.tsx
│   ├── utils/
│   │   └── minipay.ts
│   ├── config/
│   │   └── game.ts
│   ├── styles/
│   └── client.ts
├── public/
│   └── sounds/
├── package.json
├── next.config.ts
└── README.md
```

## Contract Addresses

Current deployed contracts on Celo Sepolia:

RUSH Token: 0x9A8629e7D3FcCDbC4d1DE24d43013452cfF23cF0

Swap Contract: 0x2744e8aAce17a217858FF8394C9d1198279215d9

Gem Contract: 0xBdE05919CE1ee2E20502327fF74101A8047c37be

Rewards Contract: 0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280

cUSD Token: 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b

Update these in `src/app/mint/page.tsx` if contracts are redeployed.

## MiniPay Integration

RhythmRush detects MiniPay automatically. Shows cUSD balance. Enables cUSD payments. Provides low-cost transactions.

### Features

Automatic detection via `window.ethereum.isMiniPay`.

cUSD balance display for MiniPay users.

cUSD payments to buy RUSH tokens (MiniPay users only).

Exchange rate: 0.17 cUSD equals 30 RUSH tokens.

Add cash button links to MiniPay add cash screen.

Low transaction fees via MiniPay.

### Implementation

Detection (`src/utils/minipay.ts`):
```typescript
export function isMiniPayAvailable(): boolean {
  return !!(window as any).ethereum?.isMiniPay;
}
```

cUSD balance check (`src/utils/minipay.ts`):
```typescript
export async function checkCUSDBalance(
  address: string,
  isTestnet: boolean = true
): Promise<string> {
  // Uses @celo/abis and viem to query cUSD balance
  // Returns balance as string in ether units
}
```

Payment method selector (`src/app/mint/page.tsx`):
- Shown only for MiniPay users
- Allows choosing between CELO and cUSD
- Defaults to cUSD for MiniPay users
- Shows helpful tip for non-MiniPay users

Smart contract integration:
- Uses `buyRushTokensWithCUSD()` function in swap contract
- Requires ERC20 approval before purchase
- Handles cUSD token transfers securely

### Testing MiniPay

Install MiniPay app on mobile device.

Expose local server using ngrok:

```bash
ngrok http 3000
```

Access ngrok URL in MiniPay browser.

Connect wallet. MiniPay auto-detects.

Add cUSD using Add Cash to MiniPay button.

Test payment. Select cUSD payment method. Buy RUSH tokens.

## Key Features

### Buy RUSH Tokens

Purchase RUSH tokens directly:
- CELO payment available for all wallets (1 CELO equals 30 RUSH)
- cUSD payment available only for MiniPay users (0.17 cUSD equals 30 RUSH)
- Select amount of RUSH tokens to buy
- See cost calculated automatically
- Quick buttons for common amounts (34, 50, 100, 200 RUSH)
- Balance updates automatically after purchase

### Mint Gem

Requires exactly 34 RUSH tokens.

One Gem unlocks all games.

Automatic approval flow.

Balance checks prevent insufficient funds.

### Games

RhythmRush:
- Thirty second rounds
- Tap glowing buttons in sync
- Perfect timing scores 10 points
- Good timing scores 5 points
- Keyboard controls supported (1-4, arrows, WASD)
- Sound effects for feedback
- Automatic score submission

Simon Game:
- Watch button sequence
- Repeat pattern correctly
- Score based on speed
- Game over on wrong answer
- Automatic score submission
- Prevents new game until score submitted

### Leaderboard

Podium display for top three players.

List view for positions four through ten.

Deduplicated by player address.

Shows best score per player.

Highlights your position.

## Technology Stack

Framework: Next.js 15 (App Router)

Language: TypeScript

UI Library: React 18

Styling: Tailwind CSS

Animations: Framer Motion

Wallet: Thirdweb SDK

Blockchain: Ethers.js

MiniPay: @celo/abis, viem

Notifications: React Hot Toast

Audio: Web Audio API

## Environment Variables

Create `.env.local` for custom configuration:

```env
NEXT_PUBLIC_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
NEXT_PUBLIC_CHAIN_ID=11142220
```

## Mobile Responsiveness

App uses iPhone frame on desktop. Removes frame on mobile devices for full-screen experience.

Mobile detection uses:
- Screen width (less than 768px)
- Touch device capabilities
- User agent detection

## Troubleshooting

Wallet not connecting:
- Ensure wallet extension is installed
- Check wallet is connected to Celo Sepolia network
- Refresh page and try again
- Check browser console for errors

MiniPay not detected:
- Ensure you are using MiniPay app or Opera Mini browser
- Check `window.ethereum.isMiniPay` in console
- Verify you are accessing via mobile device
- Try refreshing the page

Balance not updating:
- Click refresh button next to balance
- Check console for errors
- Verify contract addresses are correct
- Ensure you are on correct network

Games not loading:
- Check browser console for errors
- Ensure sounds folder exists in public directory
- Verify game components are imported correctly
- Check network requests in DevTools

Transaction fails:
- Check you have sufficient CELO for gas
- Verify contract addresses are correct
- Check browser console for error details
- Ensure you are on Celo Sepolia network
- For cUSD payments, ensure you have approved spending

cUSD payment not available:
- Verify MiniPay is detected (`isMiniPayAvailable()` returns true)
- Check you have sufficient cUSD balance
- Ensure you have approved cUSD spending
- Verify swap contract address is correct

## Browser Support

Chrome or Edge (recommended)

Firefox

Safari

Mobile browsers (iOS Safari, Chrome Mobile)

MiniPay browser (Opera Mini)

## Contract Update Notes

When contracts are redeployed:

Update contract addresses in `src/app/mint/page.tsx`:
- `RUSH_TOKEN_ADDRESS`
- `SWAP_CONTRACT_ADDRESS`
- `GEM_CONTRACT_ADDRESS`

Update contract addresses in `src/app/play/page.tsx`:
- `GEM_CONTRACT_ADDRESS`

Verify all contract interactions work:
- Buy RUSH tokens
- Mint Gem
- Submit scores
- View leaderboard

Test MiniPay integration:
- Detection works
- cUSD balance displays
- cUSD payment flow works

## Support

For issues or questions:
- Celo Documentation: https://docs.celo.org
- MiniPay Documentation: https://minipay.opera.com
- Thirdweb Documentation: https://portal.thirdweb.com
- Next.js Documentation: https://nextjs.org/docs
