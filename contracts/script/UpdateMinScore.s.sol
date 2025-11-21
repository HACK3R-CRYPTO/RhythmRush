// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushRewards} from "../src/RhythmRushRewards.sol";

contract UpdateMinScoreScript is Script {
    // Deployed contract address on Celo Sepolia
    address constant REWARDS_CONTRACT = 0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280;
    
    // New minimum score threshold (reduced from 100 to 10)
    uint256 constant NEW_MIN_SCORE = 10;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        RhythmRushRewards rewards = RhythmRushRewards(REWARDS_CONTRACT);
        
        console.log("Current min score threshold:", rewards.minScoreThreshold());
        console.log("Updating to:", NEW_MIN_SCORE);
        
        rewards.setMinScoreThreshold(NEW_MIN_SCORE);
        
        console.log("Updated min score threshold to:", rewards.minScoreThreshold());
        
        vm.stopBroadcast();
    }
}

