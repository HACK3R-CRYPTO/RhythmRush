# RhythmRush Frontend

Next.js frontend application for RhythmRush play-to-earn game. Mobile-first design with iPhone frame UI. Buy RUSH tokens. Mint Gems. Play games. Earn rewards.

## Overview

Modern React application built with Next.js 15. Features wallet connection, token swapping, NFT minting, and interactive games. Designed for mobile devices with responsive iPhone frame interface.

## Features

- **Wallet Connection** - Connect with Thirdweb SDK. Supports multiple wallet providers.
- **Buy RUSH Tokens** - Purchase RUSH tokens directly with CELO. No DEX needed.
- **Mint NFT Gems** - Mint Gem NFTs to unlock game access.
- **RhythmRush Game** - Tap buttons in sync with rhythm. Score points. Submit automatically.
- **Simon Game** - Memory pattern game. Repeat sequences. Score based on speed.
- **Leaderboard** - View top players. Podium display for top 3. List for positions 4-10.
- **Sound Effects** - Audio feedback for game interactions. Fallback tones if files missing.
- **Keyboard Controls** - Play on laptop using 1-4 keys, arrow keys, or WASD.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Wallet extension (MetaMask, WalletConnect, etc.)
- CELO Sepolia testnet configured in wallet

## Installation

1. Navigate to frontend directory:

```bash
cd RhythmRush/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file (optional, for custom configuration):

```env
NEXT_PUBLIC_CHAIN_ID=11142220
NEXT_PUBLIC_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
```

## Development

Start development server:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Home/splash screen
│   │   ├── wallet-connect/    # Wallet connection page
│   │   ├── mint/              # Mint Gem page with RUSH purchase
│   │   ├── play/              # Game selection page
│   │   ├── game/              # RhythmRush game
│   │   ├── simon-game/        # Simon game
│   │   ├── submit-score/      # Score submission page
│   │   └── leaderboard/       # Leaderboard page
│   ├── components/            # Reusable React components
│   │   ├── iPhoneFrame.tsx    # iPhone frame wrapper
│   │   ├── Loading.tsx        # Loading spinner
│   │   └── SuccessBanner.tsx  # Success notification
│   ├── config/                # Configuration files
│   │   └── game.ts            # Game configuration
│   ├── styles/                # Global styles
│   └── client.ts              # Thirdweb client setup
├── public/                     # Static assets
│   └── sounds/                # Game sound effects
├── package.json               # Dependencies
├── next.config.ts             # Next.js configuration
└── README.md                  # This file
```

## Contract Addresses

Update these in the respective page files if contracts are redeployed:

- **RUSH Token**: `0x9f70e9CDe0576E549Fb8BB9135eB74c304b0868A`
- **Swap Contract**: `0x22E1952B7C44e57C917f19Df8c0d186A4f80E2B4`
- **Gem Contract**: `0xBdE05919CE1ee2E20502327fF74101A8047c37be`
- **Rewards Contract**: `0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280`

## Key Features Explained

### Buy RUSH Tokens

Users can purchase RUSH tokens directly with CELO:
- Select amount of RUSH tokens to buy
- See CELO cost calculated automatically
- Exchange rate: 1 CELO = 30 RUSH tokens
- Quick buttons for common amounts (34, 50, 100, 200 RUSH)
- Balance updates automatically after purchase

### Mint Gem

- Requires exactly 34 RUSH tokens
- One Gem unlocks all games
- Automatic approval flow
- Balance checks prevent insufficient funds

### Games

**RhythmRush:**
- 30-second rounds
- Tap glowing buttons in sync
- Perfect timing: 10 points
- Good timing: 5 points
- Keyboard controls supported
- Sound effects for feedback

**Simon Game:**
- Watch button sequence
- Repeat pattern correctly
- Score based on speed
- Game over on wrong answer
- Automatic score submission

### Leaderboard

- Podium display for top 3 players
- List view for positions 4-10
- Deduplicated by player address
- Shows best score per player
- Highlights your position

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Wallet**: Thirdweb SDK
- **Blockchain**: Ethers.js
- **Notifications**: React Hot Toast
- **Audio**: Web Audio API

## Environment Variables

Create `.env.local` for custom configuration:

```env
# Optional: Custom RPC URL
NEXT_PUBLIC_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/

# Optional: Custom Chain ID
NEXT_PUBLIC_CHAIN_ID=11142220
```

## Troubleshooting

### Wallet Not Connecting

1. Ensure wallet extension is installed
2. Check wallet is connected to Celo Sepolia network
3. Refresh page and try again
4. Check browser console for errors

### Balance Not Updating

1. Click refresh button next to balance
2. Check console for errors
3. Verify contract addresses are correct
4. Ensure you're on correct network

### Games Not Loading

1. Check browser console for errors
2. Ensure sounds folder exists in public directory
3. Verify game components are imported correctly
4. Check network requests in DevTools

### Transaction Fails

1. Check you have sufficient CELO for gas
2. Verify contract addresses are correct
3. Check browser console for error details
4. Ensure you're on Celo Sepolia network

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)


