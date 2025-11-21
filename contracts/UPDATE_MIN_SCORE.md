# Update Minimum Score Threshold

The minimum score threshold has been reduced from 100 to 10 points to make the game more accessible.

## Update Contract (Required)

Run this script to update the deployed contract:

```bash
cd contracts
source .env
forge script script/UpdateMinScore.s.sol:UpdateMinScoreScript --rpc-url celo-sepolia --broadcast
```

This will update the minimum score threshold from 100 to 10 points.

## Frontend Already Updated

The frontend default has been updated to 10 points. Once you run the script above, the contract will match.

## What Changed

- **Before**: Minimum score = 100 points
- **After**: Minimum score = 10 points

This makes it much easier for players to submit scores and qualify for rewards!

