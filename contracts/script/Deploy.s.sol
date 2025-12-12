// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushGem} from "../src/RhythmRushGem.sol";
import {RhythmRushRewards} from "../src/RhythmRushRewards.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";
import {RhythmRushSwap} from "../src/RhythmRushSwap.sol";
import {RhythmRushSwap} from "../src/RhythmRushSwap.sol";

contract DeployScript is Script {
    // Celo Mainnet addresses
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    
    // Celo Alfajores Testnet addresses
    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Determine network
        uint256 chainId = block.chainid;
        
        console.log("Deploying RhythmRush contracts...");
        console.log("Chain ID:", chainId);
        console.log("Treasury:", treasury);
        
        // Step 1: Deploy RhythmRushToken (RUSH)
        RhythmRushToken rushToken = new RhythmRushToken(treasury);
        console.log("RhythmRushToken (RUSH) deployed at:", address(rushToken));
        
        // Step 2: Deploy NFT Gem contract (uses RUSH token for payment)
        RhythmRushGem gem = new RhythmRushGem(
            "RhythmRush Gem",
            "RRG",
            10000, // Max supply
            address(rushToken), // Use RUSH token for payment
            treasury
        );
        
        console.log("RhythmRushGem deployed at:", address(gem));
        
        // Step 3: Deploy Rewards contract (uses RUSH token for rewards)
        RhythmRushRewards rewards = new RhythmRushRewards(
            address(rushToken), // Use RUSH token for rewards
            10 // Minimum score threshold (reduced from 100)
        );
        
        console.log("RhythmRushRewards deployed at:", address(rewards));
        
        // Step 4: Deploy Swap contract (allows buying RUSH with CELO or cUSD)
        // Determine cUSD address based on chain ID
        address cusdToken;
        if (chainId == 42220) {
            // Celo Mainnet
            cusdToken = CUSD_MAINNET;
        } else if (chainId == 11142220) {
            // Celo Sepolia
            cusdToken = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;
        } else {
            // Default to Alfajores for other testnets
            cusdToken = CUSD_ALFAJORES;
        }
        
        RhythmRushSwap swap = new RhythmRushSwap(
            address(rushToken),
            cusdToken,
            treasury
        );
        console.log("RhythmRushSwap deployed at:", address(swap));
        console.log("cUSD Token:", cusdToken);
        
        // Step 5: Set rewards contract in token (allows minting)
        rushToken.setRewardsContract(address(rewards));
        console.log("Rewards contract set in token");
        
        // Step 6: Set swap contract in token (allows minting)
        rushToken.setSwapContract(address(swap));
        console.log("Swap contract set in token");
        
        // Step 7: Activate claim
        gem.setClaimConditions(true, block.timestamp);
        console.log("Claim activated!");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("RhythmRushToken (RUSH):", address(rushToken));
        console.log("Gem Contract:", address(gem));
        console.log("Rewards Contract:", address(rewards));
        console.log("Swap Contract:", address(swap));
        console.log("Treasury:", treasury);
        console.log("\nToken Details:");
        console.log("  Name:", rushToken.name());
        console.log("  Symbol:", rushToken.symbol());
        console.log("  Total Supply:", rushToken.totalSupply());
        console.log("  Max Supply:", rushToken.MAX_SUPPLY());
        console.log("\nSwap Details:");
        console.log("  Exchange Rate:", swap.getExchangeRate(), "RUSH per 1 CELO");
        console.log("\nIMPORTANT: Update frontend with new contract addresses!");
    }
}

