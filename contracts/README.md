# RhythmRush Smart Contracts

Smart contracts for RhythmRush game. Deploy to Celo. Test locally. Verify on Blockscout.

## What These Contracts Do

RhythmRushToken: ERC20 token for payments and rewards. Players use RUSH tokens to mint Gems. Top players earn RUSH rewards.

RhythmRushSwap: Buy RUSH tokens with CELO or cUSD. Exchange rates set by owner. Mints tokens directly to buyers.

RhythmRushGem: ERC721 NFT contract. Players mint Gems to unlock games. One Gem costs 34 RUSH tokens.

RhythmRushRewards: Tracks scores. Distributes rewards. Leaderboard management. Prize pool distribution.

## Prerequisites

Install Foundry. Get CELO for gas fees. Have a wallet ready.

Foundry installation: https://book.getfoundry.sh/getting-started/installation

## Installation

Clone the repository. Navigate to contracts folder. Install dependencies.

```bash
git clone <repository-url>
cd RhythmRush/contracts
forge install
```

Build contracts:

```bash
forge build
```

Run tests:

```bash
forge test
```

All tests must pass before deployment.

## Configuration

Create a `.env` file in the contracts directory:

```
PRIVATE_KEY=0xyour_private_key_with_0x_prefix
TREASURY_ADDRESS=your_treasury_address
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Important notes:
- Private key must include 0x prefix
- Treasury address receives initial 500M RUSH tokens
- Etherscan API key works for Celo Mainnet and Celo Sepolia

## Get Testnet Tokens

Get testnet tokens before deploying:

- Celo Sepolia Faucet: https://faucet.celo.org/celo-sepolia
- Google Cloud Faucet: https://cloud.google.com/application/web3/faucet/celo/sepolia

You need CELO for gas fees.

## Deployment

### Deploy All Contracts

Deploy everything to Celo Sepolia:

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo-sepolia --broadcast --verify
```

This deploys all four contracts. Sets up relationships. Activates claim conditions. Verifies on Blockscout.

### Deploy Token and Swap Only

Deploy latest contracts with cUSD support:

```bash
forge script script/DeployTokenAndSwap.s.sol:DeployTokenAndSwapScript --rpc-url celo-sepolia --broadcast --verify
```

This deploys new token and swap contracts. Includes cUSD payment support.

### Update Existing Contracts

After deploying new token and swap, update Gem contract:

```bash
forge script script/UpdateContracts.s.sol:UpdateContractsScript --rpc-url celo-sepolia --broadcast
```

This updates Gem contract payment token. Sets token rewards contract address.

### Deploy to Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url celo --broadcast --verify
```

## Deployed Contracts

Contracts are deployed on both networks. The frontend automatically uses the correct addresses based on the connected network.

### Celo Mainnet (Production):

RhythmRushToken: 0xdA0E2109E96aC6ddAf2856fb1FafA5124A4a8209

RhythmRushSwap: 0x4013F9F2E2FdF3189F85dB8642a30b3A3F5D862A

RhythmRushGem: 0xC722211F260E96acEDea1bbdEBaa739456CeC5C7

RhythmRushRewards: 0xC8395B038B7B7b05a7d8161068cAd5CDFe7fbFe2

cUSD Token: 0x765DE816845861e75A25fCA122bb6898B8B1282a

Treasury: 0x3210607AC8126770E850957cE7373ee7e59e3A29

View contracts on [Celoscan](https://celoscan.io/).

### Celo Sepolia Testnet (Development):

RhythmRushToken: 0x9A8629e7D3FcCDbC4d1DE24d43013452cfF23cF0

RhythmRushSwap: 0x2744e8aAce17a217858FF8394C9d1198279215d9

RhythmRushGem: 0xBdE05919CE1ee2E20502327fF74101A8047c37be

RhythmRushRewards: 0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280

cUSD Token: 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b

View contracts on [Blockscout](https://celo-sepolia.blockscout.com/).

## Usage

### Buy RUSH Tokens with CELO

Send CELO to swap contract. Receive RUSH tokens.

Exchange rate: 1 CELO equals 30 RUSH tokens.

Minimum purchase: 0.01 CELO.

### Buy RUSH Tokens with cUSD

Approve cUSD spending first. Call buyRushTokensWithCUSD function.

Exchange rate: 0.17 cUSD equals 30 RUSH tokens.

Minimum purchase: 0.01 cUSD.

### Mint NFT Gems

Approve 34 RUSH tokens. Call claim function on Gem contract.

One Gem unlocks all games.

### Submit Scores

Call submitScore function on rewards contract.

Minimum score: 10 points.

### Claim Rewards

Top players call claimRewards function.

Reward distribution:
- First place: 40 percent of prize pool
- Second place: 25 percent of prize pool
- Third place: 15 percent of prize pool
- Places four through ten: 10 percent split among seven players
- Participation: 10 percent split among all eligible players

### Fund Prize Pool

Owner calls fundPrizePool function.

Mints RUSH tokens directly to contract.

## Exchange Rates

CELO to RUSH: 1 CELO equals 30 RUSH tokens.

cUSD to RUSH: 0.17 cUSD equals 30 RUSH tokens.

Gem price: 34 RUSH tokens per Gem.

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

The frontend automatically detects the connected network and uses the corresponding contract addresses. Contract addresses are managed in `frontend/src/config/contracts.ts`.

### Connect to Celo Network

The frontend automatically supports both networks. Use the contracts configuration:

```typescript
import { getContracts, CONTRACTS } from "@/config/contracts";
import { useActiveWalletChain } from "thirdweb/react";

// In your component
const activeChain = useActiveWalletChain();
const contracts = activeChain?.id 
  ? getContracts(activeChain.id) 
  : CONTRACTS.mainnet;

// Use contracts.rushToken, contracts.gemContract, etc.
```

### Get Contract Instance

```typescript
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb";
import { getContracts, CONTRACTS } from "@/config/contracts";

const contracts = getContracts(chainId); // chainId from wallet
const chain = defineChain({
  id: contracts.chainId,
  name: contracts.name,
  rpc: contracts.rpc,
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  }
});

const gemContract = getContract({
  client: client,
  chain: chain,
  address: contracts.gemContract
});
```

### Buy RUSH Tokens with CELO

```typescript
import { ethers } from "ethers";

const swapAddress = "0x2744e8aAce17a217858FF8394C9d1198279215d9";
const swapABI = [
  {
    inputs: [],
    name: "buyRushTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const swapContract = new ethers.Contract(swapAddress, swapABI, signer);

const celoAmount = ethers.utils.parseEther("1.1333");
const tx = await swapContract.buyRushTokens({
  value: celoAmount,
  gasLimit: 200000
});
await tx.wait();
```

### Buy RUSH Tokens with cUSD

```typescript
const cusdAddress = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b";
const cusdABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  }
];

const swapABI = [
  {
    inputs: [{ name: "cusdAmount", type: "uint256" }],
    name: "buyRushTokensWithCUSD",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const cusdContract = new ethers.Contract(cusdAddress, cusdABI, signer);
await cusdContract.approve(swapAddress, ethers.constants.MaxUint256);

const cusdAmount = ethers.utils.parseEther("0.17");
const swapContract = new ethers.Contract(swapAddress, swapABI, signer);
const tx = await swapContract.buyRushTokensWithCUSD(cusdAmount);
await tx.wait();
```

### Mint a Gem

```typescript
await rushToken.write("approve", {
  args: [gemContractAddress, BigInt(34 * 10**18)]
});

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

RhythmRush contracts are deployed on both Celo Mainnet and Celo Sepolia Testnet. The frontend automatically detects which network the user is connected to and uses the corresponding contract addresses.

### Celo Mainnet (Production):
- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io/
- cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a

### Celo Sepolia Testnet (Development):
- Chain ID: 11142220
- RPC: https://forno.celo-sepolia.celo-testnet.org/
- Explorer: https://celo-sepolia.blockscout.com/
- cUSD: 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b

## Contract Verification

Contracts verify automatically during deployment using Etherscan API key.

Verification works on Celo Mainnet and Celo Sepolia.

Manual verification:

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
│   ├── RhythmRushToken.sol
│   ├── RhythmRushSwap.sol
│   ├── RhythmRushGem.sol
│   └── RhythmRushRewards.sol
├── test/
│   └── RhythmRush.t.sol
├── script/
│   ├── Deploy.s.sol
│   ├── DeployTokenAndSwap.s.sol
│   └── UpdateContracts.s.sol
├── foundry.toml
└── README.md
```

## Security

Contracts include security features:
- ReentrancyGuard prevents reentrancy attacks
- SafeERC20 handles token transfers safely
- Input validation on all functions
- Owner-only functions protected
- Supply limits enforced

## Troubleshooting

Deployment fails:
- Check `.env` file has correct values
- Ensure you have enough CELO for gas fees
- Verify network connectivity
- Check contract compilation: `forge build`

Verification fails:
- Ensure `ETHERSCAN_API_KEY` is set in `.env`
- Check API key is valid
- Wait a few minutes after deployment before verification
- Try manual verification on Blockscout

Tests fail:
- Run `forge clean` and rebuild
- Check Solidity version matches (0.8.24)
- Verify dependencies installed: `forge install`

## Contract Update Notes

After deploying new contracts:
- Update Gem contract payment token address
- Update frontend with new contract addresses
- Verify all contracts on Blockscout
- Test full flow: buy RUSH, mint Gem, play, submit score

## Support

For issues or questions:
- Celo Documentation: https://docs.celo.org
- Foundry Book: https://book.getfoundry.sh
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
