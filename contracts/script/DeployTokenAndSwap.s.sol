// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";
import {RhythmRushSwap} from "../src/RhythmRushSwap.sol";

contract DeployTokenAndSwapScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying RhythmRushToken and RhythmRushSwap...");
        console.log("Treasury:", treasury);
        
        // Step 1: Deploy RhythmRushToken (RUSH) with swap functionality
        RhythmRushToken rushToken = new RhythmRushToken(treasury);
        console.log("RhythmRushToken (RUSH) deployed at:", address(rushToken));
        
        // Step 2: Deploy Swap contract
        // cUSD address on Celo Sepolia: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
        address cusdToken = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
        RhythmRushSwap swap = new RhythmRushSwap(
            address(rushToken),
            cusdToken,
            treasury
        );
        console.log("RhythmRushSwap deployed at:", address(swap));
        
        // Step 3: Set swap contract in token (allows minting)
        rushToken.setSwapContract(address(swap));
        console.log("Swap contract set in token");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("RhythmRushToken (RUSH):", address(rushToken));
        console.log("RhythmRushSwap:", address(swap));
        console.log("Treasury:", treasury);
        console.log("\nToken Details:");
        console.log("  Name:", rushToken.name());
        console.log("  Symbol:", rushToken.symbol());
        console.log("  Total Supply:", rushToken.totalSupply());
        console.log("  Max Supply:", rushToken.MAX_SUPPLY());
        console.log("\nSwap Details:");
        console.log("  Exchange Rate:", swap.getExchangeRate(), "RUSH per 1 CELO");
        console.log("\nIMPORTANT NEXT STEPS:");
        console.log("1. Update Gem contract payment token to:", address(rushToken));
        console.log("2. Update Rewards contract token address to:", address(rushToken));
        console.log("3. Set rewards contract in token: rushToken.setRewardsContract(REWARDS_ADDRESS)");
        console.log("4. Update frontend with new token and swap addresses");
    }
}

