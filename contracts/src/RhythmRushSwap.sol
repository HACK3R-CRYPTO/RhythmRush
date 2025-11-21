// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RhythmRushToken.sol";

/**
 * @title RhythmRushSwap
 * @dev Simple swap contract to buy RUSH tokens with CELO (native currency)
 * Allows users to purchase RUSH tokens directly with CELO
 */
contract RhythmRushSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // RUSH token contract
    RhythmRushToken public rushToken;
    
    // Exchange rate: 1 CELO = 30 RUSH tokens (adjustable)
    uint256 public celoToRushRate = 30 * 10**18; // 30 RUSH per 1 CELO
    
    // Minimum purchase: 0.01 CELO
    uint256 public constant MIN_PURCHASE = 0.01 * 10**18;
    
    // Treasury address to receive CELO
    address public treasury;
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 celoAmount, uint256 rushAmount);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    /**
     * @dev Constructor
     * @param _rushToken Address of RhythmRushToken contract
     * @param _treasury Treasury address to receive CELO
     */
    constructor(
        address _rushToken,
        address _treasury
    ) Ownable(msg.sender) {
        require(_rushToken != address(0), "RUSH token cannot be zero address");
        require(_treasury != address(0), "Treasury cannot be zero address");
        rushToken = RhythmRushToken(_rushToken);
        treasury = _treasury;
    }
    
    /**
     * @dev Buy RUSH tokens with CELO
     */
    function buyRushTokens() external payable nonReentrant {
        require(msg.value >= MIN_PURCHASE, "Amount below minimum purchase");
        require(msg.value > 0, "Must send CELO");
        
        // Calculate RUSH tokens to mint
        uint256 rushAmount = (msg.value * celoToRushRate) / 1 ether;
        require(rushAmount > 0, "Invalid amount");
        
        // Transfer CELO to treasury first
        (bool success, ) = payable(treasury).call{value: msg.value}("");
        require(success, "CELO transfer failed");
        
        // Mint RUSH tokens to buyer
        rushToken.mint(msg.sender, rushAmount);
        
        emit TokensPurchased(msg.sender, msg.value, rushAmount);
    }
    
    /**
     * @dev Set exchange rate (only owner)
     * @param _newRate New rate: amount of RUSH tokens per 1 CELO (in wei)
     */
    function setExchangeRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be greater than 0");
        uint256 oldRate = celoToRushRate;
        celoToRushRate = _newRate;
        emit ExchangeRateUpdated(oldRate, _newRate);
    }
    
    /**
     * @dev Set treasury address (only owner)
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @dev Calculate RUSH tokens for given CELO amount
     * @param celoAmount Amount of CELO (in wei)
     * @return rushAmount Amount of RUSH tokens that will be received
     */
    function calculateRushAmount(uint256 celoAmount) external view returns (uint256) {
        return (celoAmount * celoToRushRate) / 1 ether;
    }
    
    /**
     * @dev Get current exchange rate
     * @return rate RUSH tokens per 1 CELO
     */
    function getExchangeRate() external view returns (uint256) {
        return celoToRushRate;
    }
    
    /**
     * @dev Emergency withdraw CELO (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No CELO to withdraw");
        (bool success, ) = payable(treasury).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}

