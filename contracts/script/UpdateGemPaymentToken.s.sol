// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushGem} from "../src/RhythmRushGem.sol";

contract UpdateGemPaymentTokenScript is Script {
    // Existing Gem contract address
    address constant GEM_CONTRACT = 0xBdE05919CE1ee2E20502327fF74101A8047c37be;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // TODO: Update this with your new token address after deployment
        address newTokenAddress = vm.envAddress("NEW_TOKEN_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Updating Gem contract payment token...");
        console.log("Gem Contract:", GEM_CONTRACT);
        console.log("New Token Address:", newTokenAddress);
        
        RhythmRushGem gem = RhythmRushGem(GEM_CONTRACT);
        gem.setPaymentToken(newTokenAddress);
        
        console.log("Payment token updated successfully!");
        
        vm.stopBroadcast();
    }
}

