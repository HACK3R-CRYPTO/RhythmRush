// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushRewards} from "../src/RhythmRushRewards.sol";

contract FundRewards is Script {
    address constant REWARDS_ADDRESS = 0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        RhythmRushRewards rewards = RhythmRushRewards(REWARDS_ADDRESS);
        
        // Fund with 1 million tokens
        uint256 amount = 1_000_000 * 1e18;
        rewards.fundPrizePool(amount);
        
        console.log("Funded prize pool with:", amount);
        console.log("New prize pool balance:", rewards.prizePool());
        
        vm.stopBroadcast();
    }
}
