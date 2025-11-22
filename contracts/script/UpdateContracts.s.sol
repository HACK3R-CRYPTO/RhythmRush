// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushGem} from "../src/RhythmRushGem.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";

contract UpdateContractsScript is Script {
    // Existing contract addresses
    address constant GEM_CONTRACT = 0xBdE05919CE1ee2E20502327fF74101A8047c37be;
    address constant REWARDS_CONTRACT = 0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280;
    
    // New deployed addresses
    address constant NEW_TOKEN = 0x9f70e9CDe0576E549Fb8BB9135eB74c304b0868A;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Updating contracts to use new token...");
        
        // Step 1: Update Gem contract payment token
        console.log("\n1. Updating Gem contract payment token...");
        RhythmRushGem gem = RhythmRushGem(GEM_CONTRACT);
        gem.setPaymentToken(NEW_TOKEN);
        console.log("   Gem payment token updated to:", NEW_TOKEN);
        
        // Step 2: Set rewards contract in new token
        console.log("\n2. Setting rewards contract in new token...");
        RhythmRushToken rushToken = RhythmRushToken(NEW_TOKEN);
        rushToken.setRewardsContract(REWARDS_CONTRACT);
        console.log("   Rewards contract set in token:", REWARDS_CONTRACT);
        
        vm.stopBroadcast();
        
        console.log("\n=== Update Complete ===");
        console.log("New Token Address:", NEW_TOKEN);
        console.log("Gem Contract:", GEM_CONTRACT);
        console.log("Rewards Contract:", REWARDS_CONTRACT);
        console.log("\nNote: Rewards contract still uses old token.");
        console.log("     Consider redeploying Rewards contract if needed.");
    }
}

