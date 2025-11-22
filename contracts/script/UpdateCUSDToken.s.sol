// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushSwap} from "../src/RhythmRushSwap.sol";

contract UpdateCUSDTokenScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Deployed swap contract address
        address swapAddress = 0x2744e8aAce17a217858FF8394C9d1198279215d9;
        
        // New cUSD token address for Celo Sepolia
        address newCUSDToken = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Updating cUSD token address in RhythmRushSwap...");
        console.log("Swap Contract:", swapAddress);
        console.log("Current cUSD Token:", address(RhythmRushSwap(swapAddress).cUSDToken()));
        console.log("New cUSD Token:", newCUSDToken);
        
        RhythmRushSwap swap = RhythmRushSwap(swapAddress);
        swap.setCUSDToken(newCUSDToken);
        
        console.log("cUSD token address updated successfully!");
        console.log("New cUSD Token:", address(swap.cUSDToken()));
        
        vm.stopBroadcast();
    }
}

