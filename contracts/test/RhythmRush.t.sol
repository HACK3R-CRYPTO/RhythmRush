// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {RhythmRushGem} from "../src/RhythmRushGem.sol";
import {RhythmRushRewards} from "../src/RhythmRushRewards.sol";
import {RhythmRushToken} from "../src/RhythmRushToken.sol";

contract RhythmRushTest is Test {
    RhythmRushGem public gemContract;
    RhythmRushRewards public rewardsContract;
    RhythmRushToken public rushToken;
    
    address public owner = address(1);
    address public treasury = address(2);
    address public player1 = address(3);
    address public player2 = address(4);
    
    uint256 constant PRICE_PER_GEM = 34 * 10**18;
    uint256 constant MAX_SUPPLY = 10000;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy RhythmRushToken (RUSH)
        rushToken = new RhythmRushToken(treasury);
        
        // Deploy NFT contract (uses RUSH token)
        gemContract = new RhythmRushGem(
            "RhythmRush Gem",
            "RRG",
            MAX_SUPPLY,
            address(rushToken),
            treasury
        );
        
        // Deploy rewards contract (uses RUSH token)
        rewardsContract = new RhythmRushRewards(
            address(rushToken),
            100 // Minimum score threshold
        );
        
        // Set rewards contract in token (allows minting)
        rushToken.setRewardsContract(address(rewardsContract));
        
        // Activate claim
        gemContract.setClaimConditions(true, block.timestamp);
        
        vm.stopPrank();
        
        // Give players some RUSH tokens
        vm.prank(treasury);
        rushToken.transfer(player1, 1000 * 10**18);
        vm.prank(treasury);
        rushToken.transfer(player2, 1000 * 10**18);
        
        // Fund prize pool
        rewardsContract.fundPrizePool(10000 * 10**18);
    }
    
    function testMintGem() public {
        vm.startPrank(player1);
        
        uint256 quantity = 1;
        uint256 cost = PRICE_PER_GEM * quantity;
        
        rushToken.approve(address(gemContract), cost);
        gemContract.claim(
            player1, 
            quantity, 
            address(rushToken), 
            PRICE_PER_GEM,
            RhythmRushGem.AllowlistProof(new bytes32[](0), 0, 0, address(0)),
            ""
        );
        
        assertEq(gemContract.balanceOf(player1), 1);
        assertEq(gemContract.ownerOf(1), player1);
        
        vm.stopPrank();
    }
    
    function testMintMultipleGems() public {
        vm.startPrank(player1);
        
        uint256 quantity = 5;
        uint256 cost = PRICE_PER_GEM * quantity;
        
        rushToken.approve(address(gemContract), cost);
        gemContract.claim(
            player1, 
            quantity, 
            address(rushToken), 
            PRICE_PER_GEM,
            RhythmRushGem.AllowlistProof(new bytes32[](0), 0, 0, address(0)),
            ""
        );
        
        assertEq(gemContract.balanceOf(player1), quantity);
        assertEq(gemContract.totalMinted(), quantity);
        
        vm.stopPrank();
    }
    
    function testSubmitScore() public {
        vm.startPrank(player1);
        
        rewardsContract.submitScore(500);
        
        assertEq(rewardsContract.playerScores(player1), 500);
        
        vm.stopPrank();
    }
    
    function testClaimRewards() public {
        // Submit scores
        vm.startPrank(player1);
        rewardsContract.submitScore(1000);
        vm.stopPrank();
        
        vm.startPrank(player2);
        rewardsContract.submitScore(800);
        vm.stopPrank();
        
        // Claim rewards (player1 should be first place)
        vm.startPrank(player1);
        uint256 balanceBefore = rushToken.balanceOf(player1);
        rewardsContract.claimRewards();
        uint256 balanceAfter = rushToken.balanceOf(player1);
        
        assertGt(balanceAfter, balanceBefore);
        vm.stopPrank();
    }
    
    function test_RevertWhen_ClaimWithoutScore() public {
        vm.startPrank(player1);
        vm.expectRevert();
        rewardsContract.claimRewards(); // Should fail
        vm.stopPrank();
    }
    
    function test_RevertWhen_MintWithoutPayment() public {
        vm.startPrank(player1);
        vm.expectRevert();
        gemContract.claim(
            player1, 
            1, 
            address(rushToken), 
            PRICE_PER_GEM,
            RhythmRushGem.AllowlistProof(new bytes32[](0), 0, 0, address(0)),
            ""
        ); // Should fail - no approval
        vm.stopPrank();
    }
    
    function testTokenMinting() public {
        uint256 amount = 1000 * 10**18;
        vm.prank(owner);
        rushToken.mint(player1, amount);
        
        assertEq(rushToken.balanceOf(player1), 2000 * 10**18); // 1000 from setUp + 1000 minted
    }
    
    function testRewardsContractCanMint() public {
        uint256 amount = 500 * 10**18;
        vm.prank(address(rewardsContract));
        rushToken.mint(player1, amount);
        
        assertEq(rushToken.balanceOf(player1), 1500 * 10**18);
    }
}
