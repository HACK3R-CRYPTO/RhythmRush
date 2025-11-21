// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushRewards} from "../src/RhythmRushRewards.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";

contract SetRewardsInTokenScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Set these after deploying new token
        address newTokenAddress = vm.envAddress("NEW_TOKEN_ADDRESS");
        address rewardsAddress = vm.envAddress("REWARDS_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Setting rewards contract in new token...");
        console.log("New Token Address:", newTokenAddress);
        console.log("Rewards Contract:", rewardsAddress);
        
        RhythmRushToken rushToken = RhythmRushToken(newTokenAddress);
        rushToken.setRewardsContract(rewardsAddress);
        
        console.log("Rewards contract set in token successfully!");
        
        vm.stopBroadcast();
    }
}

