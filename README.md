# RhythmRush

## The Problem

You love rhythm games. You spend hours playing. You get good scores. You want rewards for your skill. Most games give you nothing. Your time and skill go unrewarded. You want to earn while you play. You want ownership of your game assets. You want fair rewards based on performance.

## The Solution

RhythmRush rewards skilled players. You mint NFT Gems to access the game. You play rhythm challenges. You submit your scores. Top performers earn RUSH tokens. Your NFT Gems belong to you. Your rewards belong to you. Everything runs on Celo blockchain. Low fees. Fast transactions. Mobile friendly.

## How It Works

You start by getting RUSH tokens. You approve spending for the Gem contract. You mint an NFT Gem using 34 RUSH tokens. The Gem unlocks game access. You play rhythm challenges. You achieve high scores. You submit your score to the leaderboard. Top players earn RUSH token rewards. First place gets 40 percent of the prize pool. Second place gets 25 percent. Third place gets 15 percent. Places four through ten split 10 percent. All eligible players split 10 percent participation rewards.

## Your Journey

Step one: Get RUSH tokens. Buy them on a DEX or receive them from the treasury.

Step two: Mint your Gem. Approve 34 RUSH tokens. Call the claim function. Receive your NFT Gem.

Step three: Play the game. Your Gem unlocks access. Play rhythm challenges. Improve your skills.

Step four: Submit your score. After each game session, submit your best score. Your score enters the leaderboard.

Step five: Claim your rewards. When you rank high enough, claim your RUSH tokens. Rewards mint directly to your wallet.

## What You Own

Your NFT Gems belong to you. Trade them. Sell them. Keep them. Your RUSH tokens belong to you. Spend them. Hold them. Burn them. Your scores stay on chain. Permanent record of your achievements.

## Why Celo

Celo offers low transaction fees. Your rewards stay in your pocket. Fast confirmations mean quick payouts. Mobile first design works on your phone. Built for real world use.

## Built for Celo Hackathon

RhythmRush is built for the Celo mobile gaming hackathon. We focus on play to earn mechanics. Mobile first design means you play anywhere. Smart contracts handle reward distribution automatically. Top players earn real rewards. Built on Celo for low fees and fast transactions. Ready to scale to real users.

## Coming Soon

Farcaster integration coming soon. Play with your Farcaster community. Share scores on your cast. Compete with friends. More ways to connect and earn.

## Getting Started

Install Foundry. Clone this repository. Run forge install for dependencies. Run forge build to compile. Run forge test to verify.

Deploy contracts by creating a .env file:
PRIVATE_KEY=your_private_key
TREASURY_ADDRESS=your_treasury_address
CELOSCAN_API_KEY=your_api_key

Deploy to Alfajores testnet:
forge script script/Deploy.s.sol:DeployScript --rpc-url alfajores --broadcast --verify

Deploy to Celo mainnet:
forge script script/Deploy.s.sol:DeployScript --rpc-url celo --broadcast --verify

## License

MIT License. Use freely for your projects.
