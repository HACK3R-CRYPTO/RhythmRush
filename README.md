RhythmRush

The Problem

You love rhythm games. You spend hours playing. You get good scores. You want rewards for your skill. Most games give you nothing. Your time and skill go unrewarded. You want to earn while you play. You want ownership of your game assets. You want fair rewards based on performance.

The Solution

RhythmRush rewards skilled players. You mint NFT Gems to access the game. You play rhythm challenges. You submit your scores. Top performers earn RUSH tokens. Your NFT Gems belong to you. Your rewards belong to you. Everything runs on Celo blockchain. Low fees. Fast transactions. Mobile friendly.

How It Works

You start by getting RUSH tokens. You approve spending for the Gem contract. You mint an NFT Gem using 34 RUSH tokens. The Gem unlocks game access. You play rhythm challenges. You achieve high scores. You submit your score to the leaderboard. Top players earn RUSH token rewards. First place gets 40 percent of the prize pool. Second place gets 25 percent. Third place gets 15 percent. Places four through ten split 10 percent. All eligible players split 10 percent participation rewards.

Your Journey

Step one: Get RUSH tokens. Buy them on a DEX or receive them from the treasury.

Step two: Mint your Gem. Approve 34 RUSH tokens. Call the claim function. Receive your NFT Gem.

Step three: Play the game. Your Gem unlocks access. Play rhythm challenges. Improve your skills.

Step four: Submit your score. After each game session, submit your best score. Your score enters the leaderboard.

Step five: Claim your rewards. When you rank high enough, claim your RUSH tokens. Rewards mint directly to your wallet.

What You Own

Your NFT Gems belong to you. Trade them. Sell them. Keep them. Your RUSH tokens belong to you. Spend them. Hold them. Burn them. Your scores stay on chain. Permanent record of your achievements.

For Developers

RhythmRush uses three smart contracts. RhythmRushToken handles payments and rewards. RhythmRushGem mints NFT access tokens. RhythmRushRewards tracks scores and distributes prizes.

Install Foundry to work with contracts. Clone this repository. Run forge install for dependencies. Run forge build to compile. Run forge test to verify.

Deploy contracts by creating a .env file:
PRIVATE_KEY=your_private_key
TREASURY_ADDRESS=your_treasury_address
CELOSCAN_API_KEY=your_api_key

Deploy to Alfajores testnet:
forge script script/Deploy.s.sol:DeployScript --rpc-url alfajores --broadcast --verify

Deploy to Celo mainnet:
forge script script/Deploy.s.sol:DeployScript --rpc-url celo --broadcast --verify

Contract Details

RhythmRushToken is an ERC20 token. Maximum supply is 1 billion tokens. Initial supply is 500 million to treasury. Rewards contract mints tokens for players. Players burn tokens to reduce supply. Owner pause transfers if needed.

RhythmRushGem is an ERC721 NFT contract. Maximum supply is 10,000 Gems. Price is 34 RUSH tokens per Gem. Payments go to treasury address. Compatible with Thirdweb frontend. Matches existing frontend interface.

RhythmRushRewards tracks player scores. Maintains leaderboard of top players. Distributes RUSH token rewards. Requires minimum score threshold. Mints tokens directly to players.

Security

Contracts use ReentrancyGuard to prevent attacks. SafeERC20 handles token transfers safely. All functions validate inputs. Owner functions require ownership. Supply limits prevent over minting.

Testing

Run forge test to execute all tests. Run forge test -vvv for detailed output. Run forge test --match-test testMintGem for specific tests.

Frontend Integration

Connect your frontend to Celo network. Use deployed contract addresses. Import contract ABIs. Handle wallet connections. Approve RUSH tokens before minting. Call claim function to mint Gems. Submit scores after gameplay. Claim rewards when eligible.

Example code for approving tokens:
await rushToken.approve(gemContractAddress, pricePerGem * quantity)

Example code for minting Gem:
await gemContract.claim(
  userAddress,
  1,
  rushTokenAddress,
  pricePerGem,
  allowlistProof,
  "0x"
)

Example code for submitting score:
await rewardsContract.submitScore(score)

Example code for claiming rewards:
await rewardsContract.claimRewards()

Network Information

Celo Mainnet uses chain ID 42220. RPC endpoint is https://forno.celo.org.

Alfajores Testnet uses chain ID 44787. RPC endpoint is https://alfajores-forno.celo-testnet.org.

License

MIT License. Use freely for your projects.
