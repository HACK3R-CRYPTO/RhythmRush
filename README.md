# RhythmRush

Play-to-earn rhythm game on Celo. Mint NFT Gems. Play games. Earn RUSH tokens. Compete on the leaderboard.

## The Problem

You love rhythm games. You spend hours playing. You get good scores. You want rewards for your skill. Most games give you nothing. Your time and skill go unrewarded. You want to earn while you play. You want ownership of your game assets. You want fair rewards based on performance.

## The Solution

RhythmRush rewards skilled players. You mint one NFT Gem to access all games. You play rhythm challenges and memory games. You submit your scores. Top performers earn RUSH tokens. Your NFT Gems belong to you. Your rewards belong to you. Everything runs on Celo blockchain. Low fees. Fast transactions. Mobile friendly.

## Games

**RhythmRush Game**
- Tap the glowing button in sync with the rhythm
- Perfect timing (0-600ms) = 10 points
- Good timing (600-1000ms) = 5 points
- 30-second rounds with automatic score submission
- Sound effects for button taps and feedback

**Simon Game**
- Watch the sequence of colored buttons
- Repeat the pattern correctly
- Score based on speed and sequences completed
- Game over on wrong answer
- Automatic score submission

## How It Works

You start by getting RUSH tokens. Buy RUSH tokens directly with CELO using the swap contract. Or get them from a DEX or treasury. You approve spending for the Gem contract. You mint one NFT Gem using 34 RUSH tokens. The Gem unlocks access to all games. You play games and achieve high scores. Your scores submit automatically to the leaderboard. Top players earn RUSH token rewards.

**Reward Distribution:**
- 1st place: 40% of prize pool
- 2nd place: 25% of prize pool
- 3rd place: 15% of prize pool
- Places 4-10: 10% split among 7 players
- Participation: 10% split among all eligible players

Minimum score threshold: 10 points.

## Your Journey

**Step one:** Get RUSH tokens. Buy RUSH tokens with CELO directly in the app. Exchange rate: 1 CELO = 30 RUSH tokens. Or buy them on a DEX or receive them from the treasury.

**Step two:** Mint your Gem. Approve 34 RUSH tokens. Mint one Gem NFT. One Gem unlocks all games.

**Step three:** Play games. Your Gem unlocks access. Play RhythmRush or Simon. Improve your skills. Enjoy sound effects and responsive gameplay.

**Step four:** Submit your score. Scores submit automatically after each game. Your score enters the leaderboard. Leaderboard shows top 10 with podium display for top 3.

**Step five:** Compete for rewards. Top players earn RUSH tokens. Rewards mint directly to your wallet when prize pool is funded.

## Features

- **Mobile-first design** - Responsive iPhone frame UI. Works perfectly on mobile devices.
- **MiniPay Integration** - Seamless wallet connection with MiniPay. Low-cost transactions with cUSD support.
- **Buy RUSH with CELO** - Purchase RUSH tokens directly with CELO. No DEX needed. Exchange rate: 1 CELO = 30 RUSH.
- **Sound effects** - Button taps play sounds. Feedback sounds for perfect, good, and miss.
- **Keyboard controls** - Play on laptop using 1-4 keys, arrow keys, or WASD.
- **Podium leaderboard** - Top 3 players displayed on podium stands. Positions 4-10 listed below.
- **Multiple games** - RhythmRush and Simon games. More games coming soon.
- **Automatic score submission** - Scores submit to blockchain automatically. No manual input needed.
- **Secure score tracking** - Scores stored in sessionStorage. Protected from URL tampering.
- **On-chain rewards** - All scores and rewards stored on Celo blockchain. Permanent record.

## What You Own

Your NFT Gems belong to you. Trade them. Sell them. Keep them. Your RUSH tokens belong to you. Spend them. Hold them. Burn them. Your scores stay on chain. Permanent record of your achievements.

## Why Celo

Celo offers low transaction fees. Your rewards stay in your pocket. Fast confirmations mean quick payouts. Mobile first design works on your phone. Built for real world use.

## Built for Celo Hackathon

RhythmRush is built for the Celo mobile gaming hackathon. We focus on play to earn mechanics. Mobile first design means you play anywhere. Smart contracts handle reward distribution automatically. Top players earn real rewards. Built on Celo for low fees and fast transactions. Ready to scale to real users.

## Deployed Contracts (Celo Sepolia)

- **RhythmRushToken**: `0x9f70e9CDe0576E549Fb8BB9135eB74c304b0868A` (New token with swap functionality)
- **RhythmRushSwap**: `0x22E1952B7C44e57C917f19Df8c0d186A4f80E2B4` (Buy RUSH with CELO)
- **RhythmRushGem**: `0xBdE05919CE1ee2E20502327fF74101A8047c37be`
- **RhythmRushRewards**: `0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280`

View on [Blockscout](https://celo-sepolia.blockscout.com/)

## Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to play.

### Contract Setup

See `contracts/README.md` for detailed contract setup and deployment instructions.

Quick start:
```bash
cd contracts
forge install
forge build
forge test
```

Create `.env` file:
```
PRIVATE_KEY=0xyour_private_key_with_0x_prefix
TREASURY_ADDRESS=your_treasury_address
ETHERSCAN_API_KEY=your_api_key
```

Deploy to Celo Sepolia:
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo-sepolia --broadcast --verify
```

## Project Structure

```
RhythmRush/
├── contracts/          # Smart contracts (Foundry)
│   ├── src/           # Solidity contracts
│   │   ├── RhythmRushToken.sol    # ERC20 token
│   │   ├── RhythmRushSwap.sol     # Swap contract (CELO to RUSH)
│   │   ├── RhythmRushGem.sol      # ERC721 NFT
│   │   └── RhythmRushRewards.sol   # Rewards distribution
│   ├── test/          # Test files
│   └── script/        # Deployment scripts
├── frontend/          # Next.js frontend
│   ├── src/app/       # Pages and routes
│   │   ├── mint/      # Mint Gem page with RUSH purchase
│   │   ├── game/      # RhythmRush game
│   │   ├── simon-game/ # Simon game
│   │   └── leaderboard/ # Leaderboard page
│   ├── src/components/ # React components
│   └── public/        # Static assets and sounds
└── README.md          # This file
```

## Technology Stack

- **Smart Contracts**: Solidity 0.8.24, Foundry, OpenZeppelin Contracts
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Celo Sepolia Testnet
- **Wallet**: Thirdweb SDK, Ethers.js, MiniPay Integration
- **MiniPay**: @celo/abis, @celo/identity, viem@2
- **Animations**: Framer Motion
- **Audio**: Web Audio API with fallback tones
- **Notifications**: React Hot Toast

## Coming Soon

Farcaster integration coming soon. Play with your Farcaster community. Share scores on your cast. Compete with friends. More ways to connect and earn.
