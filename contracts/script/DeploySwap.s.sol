// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushSwap} from "../src/RhythmRushSwap.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";

contract DeploySwapScript is Script {
    // Deployed contract addresses on Celo Sepolia
    address constant RUSH_TOKEN = 0x4F47D6843095F3b53C67B02C9B72eB1d579051ba;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying RhythmRushSwap contract...");
        console.log("RUSH Token:", RUSH_TOKEN);
        console.log("Treasury:", treasury);
        
        // Deploy Swap contract
        RhythmRushSwap swap = new RhythmRushSwap(
            RUSH_TOKEN,
            treasury
        );
        
        console.log("RhythmRushSwap deployed at:", address(swap));
        
        // Set swap contract in token (allows minting)
        RhythmRushToken rushToken = RhythmRushToken(RUSH_TOKEN);
        rushToken.setSwapContract(address(swap));
        console.log("Swap contract set in token");
        
        // Log exchange rate
        console.log("Exchange rate:", swap.getExchangeRate(), "RUSH per 1 CELO");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("RhythmRushSwap:", address(swap));
        console.log("RUSH Token:", RUSH_TOKEN);
        console.log("Treasury:", treasury);
        console.log("Exchange Rate: 1 CELO = 30 RUSH");
    }
}

