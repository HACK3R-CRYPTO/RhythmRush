# RhythmRush Smart Contracts

Smart contracts for RhythmRush, a play-to-earn rhythm game on Celo blockchain. Players mint NFT Gems to access the game and earn RUSH tokens for top scores.

## Overview

This repository contains three main smart contracts:

- **RhythmRushToken (RUSH)** - ERC20 token for payments and rewards
- **RhythmRushGem** - ERC721 NFT contract for game access tokens
- **RhythmRushRewards** - Score tracking and reward distribution

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- A wallet with CELO for gas fees (testnet tokens available from faucets)
- Basic knowledge of Solidity and smart contract development

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd RhythmRush/contracts
```

2. Install dependencies:

```bash
forge install
```

3. Build contracts:

```bash
forge build
```

4. Run tests:

```bash
forge test
```

All tests should pass before deployment.

## Configuration

Create a `.env` file in the contracts directory:

```
PRIVATE_KEY=0xyour_private_key_with_0x_prefix
TREASURY_ADDRESS=your_treasury_address
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Important:**
- Private key must include `0x` prefix
- Treasury address receives initial 500M RUSH tokens
- Etherscan API key works for both Celo Mainnet and Celo Sepolia

## Get Testnet Tokens

Before deploying to Celo Sepolia, get testnet tokens:

- [Celo Sepolia Faucet](https://faucet.celo.org/celo-sepolia)
- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/celo/sepolia)

You need CELO for gas fees.

## Deployment

### Deploy to Celo Sepolia Testnet

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo-sepolia --broadcast --verify
```

This command:
- Deploys all three contracts
- Sets up contract relationships
- Activates claim conditions
- Verifies contracts on Blockscout

### Deploy to Celo Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo --broadcast --verify
```

## Deployed Contracts

### Celo Sepolia Testnet

- **RhythmRushToken**: `0x4F47D6843095F3b53C67B02C9B72eB1d579051ba`
- **RhythmRushGem**: `0xBdE05919CE1ee2E20502327fF74101A8047c37be`
- **RhythmRushRewards**: `0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280`

View on [Blockscout](https://celo-sepolia.blockscout.com/)

## Usage

### Minting NFT Gems

Players mint Gems by paying 34 RUSH tokens:

```solidity
// 1. Approve tokens first
rushToken.approve(gemContractAddress, 34 * 10**18);

// 2. Mint Gem
gemContract.claim(
    playerAddress,
    1, // quantity
    rushTokenAddress,
    34 * 10**18, // price per gem
    allowlistProof, // empty struct
    "0x" // data
);
```

### Submitting Scores

Players submit scores after gameplay:

```solidity
rewardsContract.submitScore(score);
```

Minimum score threshold: 10 points.

### Claiming Rewards

Top players claim RUSH token rewards:

```solidity
rewardsContract.claimRewards();
```

**Reward Distribution:**
- 1st place: 40% of prize pool
- 2nd place: 25% of prize pool
- 3rd place: 15% of prize pool
- Places 4-10: 10% split among 7 players
- Participation: 10% split among all eligible players

### Funding Prize Pool

Owner funds the prize pool:

```solidity
rewardsContract.fundPrizePool(amount);
```

This mints RUSH tokens directly to the contract.

## Testing

Run all tests:

```bash
forge test
```

Run with detailed output:

```bash
forge test -vvv
```

Run specific test:

```bash
forge test --match-test testMintGem
```

## Frontend Integration

### Connect to Celo Network

```typescript
import { defineChain } from "thirdweb/chains";

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  rpc: "https://forno.celo-sepolia.celo-testnet.org/",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  }
});
```

### Get Contract Instance

```typescript
import { getContract } from "thirdweb/react";

const gemContract = getContract({
  client: client,
  chain: celoSepolia,
  address: "0xBdE05919CE1ee2E20502327fF74101A8047c37be"
});
```

### Example: Mint a Gem

```typescript
// Approve tokens
await rushToken.write("approve", {
  args: [gemContractAddress, BigInt(34 * 10**18)]
});

// Mint Gem
await gemContract.write("claim", {
  args: [
    userAddress,
    1,
    rushTokenAddress,
    BigInt(34 * 10**18),
    { proof: [], quantityLimitPerWallet: 0, pricePerToken: 0, currency: "0x0000000000000000000000000000000000000000" },
    "0x"
  ]
});
```

## Network Configuration

### Celo Sepolia Testnet
- Chain ID: `11142220`
- RPC: `https://forno.celo-sepolia.celo-testnet.org/`
- Explorer: `https://celo-sepolia.blockscout.com/`

### Celo Mainnet
- Chain ID: `42220`
- RPC: `https://forno.celo.org`
- Explorer: `https://celoscan.io/`

## Contract Verification

Contracts are automatically verified using your Etherscan API key during deployment. Verification works on:
- Celo Mainnet (Celoscan)
- Celo Sepolia (Blockscout)

Both accept standard Etherscan API keys.

To manually verify a contract:

```bash
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_PATH>:<CONTRACT_NAME> \
  --chain-id 11142220 \
  --verifier blockscout \
  --verifier-url https://celo-sepolia.blockscout.com/api \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args <ARGS>
```

## Project Structure

```
contracts/
├── src/
│   ├── RhythmRushToken.sol    # ERC20 token contract
│   ├── RhythmRushGem.sol      # ERC721 NFT contract
│   └── RhythmRushRewards.sol  # Rewards distribution
├── test/
│   └── RhythmRush.t.sol       # Test suite
├── script/
│   └── Deploy.s.sol          # Deployment script
├── foundry.toml              # Foundry configuration
└── README.md                 # This file
```

## Security

Contracts include security features:
- ReentrancyGuard prevents reentrancy attacks
- SafeERC20 handles token transfers safely
- Input validation on all functions
- Owner-only functions protected
- Supply limits enforced

## Troubleshooting

### Deployment Fails

1. Check `.env` file has correct values
2. Ensure you have enough CELO for gas fees
3. Verify network connectivity
4. Check contract compilation: `forge build`

### Verification Fails

1. Ensure `ETHERSCAN_API_KEY` is set in `.env`
2. Check API key is valid
3. Wait a few minutes after deployment before verification
4. Try manual verification on Blockscout/Celoscan

### Tests Fail

1. Run `forge clean` and rebuild
2. Check Solidity version matches (0.8.24)
3. Verify dependencies installed: `forge install`

## License

MIT License. See LICENSE file for details.

## Support

For issues or questions:
- [Celo Documentation](https://docs.celo.org)
- [Foundry Book](https://book.getfoundry.sh)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
