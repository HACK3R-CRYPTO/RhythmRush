// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";

contract SetSwapContractScript is Script {
    // Deployed contract addresses on Celo Sepolia
    address constant RUSH_TOKEN = 0x4F47D6843095F3b53C67B02C9B72eB1d579051ba;
    address constant SWAP_CONTRACT = 0x9f70e9CDe0576E549Fb8BB9135eB74c304b0868A;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Setting swap contract in token...");
        console.log("RUSH Token:", RUSH_TOKEN);
        console.log("Swap Contract:", SWAP_CONTRACT);
        
        RhythmRushToken rushToken = RhythmRushToken(RUSH_TOKEN);
        
        // Check current owner
        address owner = rushToken.owner();
        console.log("Token owner:", owner);
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        
        // Set swap contract
        rushToken.setSwapContract(SWAP_CONTRACT);
        console.log("Swap contract set successfully!");
        
        vm.stopBroadcast();
    }
}

