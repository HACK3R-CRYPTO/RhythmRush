// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RhythmRushToken.sol";

/**
 * @title RhythmRushSwap
 * @dev Swap contract to buy RUSH tokens with CELO (native currency) or cUSD (ERC20)
 * Allows users to purchase RUSH tokens directly with CELO or cUSD
 */
contract RhythmRushSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // RUSH token contract
    RhythmRushToken public rushToken;
    
    // cUSD token contract
    IERC20 public cUSDToken;
    
    // Exchange rate: 1 CELO = 30 RUSH tokens (adjustable)
    uint256 public celoToRushRate = 30 * 10**18; // 30 RUSH per 1 CELO
    
    // Exchange rate: 0.17 cUSD = 30 RUSH tokens
    // Formula: rushAmount = (cusdAmount * cusdToRushRate) / 1 ether
    // If cusdAmount = 0.17 * 10^18 and rushAmount = 30 * 10^18:
    // 30 * 10^18 = (0.17 * 10^18 * cusdToRushRate) / 10^18
    // 30 * 10^18 = 0.17 * cusdToRushRate
    // cusdToRushRate = (30 * 10^18) / 0.17 = (30 * 10^18 * 100) / 17
    // Using integer division: (3000 * 10^18) / 17 ≈ 176470588235294117647
    uint256 public cusdToRushRate = uint256(3000 * 10**18) / 17; // 30 RUSH per 0.17 cUSD
    
    // Minimum purchase: 0.01 CELO or 0.01 cUSD
    uint256 public constant MIN_PURCHASE = 0.01 * 10**18;
    
    // Treasury address to receive CELO and cUSD
    address public treasury;
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 celoAmount, uint256 rushAmount);
    event TokensPurchasedWithCUSD(address indexed buyer, uint256 cusdAmount, uint256 rushAmount);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event CUSDExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event CUSDTokenUpdated(address indexed oldToken, address indexed newToken);
    
    /**
     * @dev Constructor
     * @param _rushToken Address of RhythmRushToken contract
     * @param _cusdToken Address of cUSD token contract
     * @param _treasury Treasury address to receive CELO and cUSD
     */
    constructor(
        address _rushToken,
        address _cusdToken,
        address _treasury
    ) Ownable(msg.sender) {
        require(_rushToken != address(0), "RUSH token cannot be zero address");
        require(_cusdToken != address(0), "cUSD token cannot be zero address");
        require(_treasury != address(0), "Treasury cannot be zero address");
        rushToken = RhythmRushToken(_rushToken);
        cUSDToken = IERC20(_cusdToken);
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
     * @dev Buy RUSH tokens with cUSD
     * @param cusdAmount Amount of cUSD to spend (in wei)
     */
    function buyRushTokensWithCUSD(uint256 cusdAmount) external nonReentrant {
        require(cusdAmount >= MIN_PURCHASE, "Amount below minimum purchase");
        require(cusdAmount > 0, "Must send cUSD");
        
        // Calculate RUSH tokens to mint
        // Formula: (cusdAmount * cusdToRushRate) / 1 ether
        // cusdToRushRate is set for 0.17 cUSD = 30 RUSH
        uint256 rushAmount = (cusdAmount * cusdToRushRate) / 1 ether;
        require(rushAmount > 0, "Invalid amount");
        
        // Transfer cUSD from user to treasury
        cUSDToken.safeTransferFrom(msg.sender, treasury, cusdAmount);
        
        // Mint RUSH tokens to buyer
        rushToken.mint(msg.sender, rushAmount);
        
        emit TokensPurchasedWithCUSD(msg.sender, cusdAmount, rushAmount);
    }
    
    /**
     * @dev Set cUSD exchange rate (only owner)
     * @param _newRate New rate: amount of RUSH tokens per 0.17 cUSD (in wei)
     */
    function setCUSDExchangeRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be greater than 0");
        uint256 oldRate = cusdToRushRate;
        cusdToRushRate = _newRate;
        emit CUSDExchangeRateUpdated(oldRate, _newRate);
    }
    
    /**
     * @dev Set cUSD token address (only owner)
     * @param _cusdToken New cUSD token address
     */
    function setCUSDToken(address _cusdToken) external onlyOwner {
        require(_cusdToken != address(0), "cUSD token cannot be zero address");
        address oldToken = address(cUSDToken);
        cUSDToken = IERC20(_cusdToken);
        emit CUSDTokenUpdated(oldToken, _cusdToken);
    }
    
    /**
     * @dev Calculate RUSH tokens for given cUSD amount
     * @param cusdAmount Amount of cUSD (in wei)
     * @return rushAmount Amount of RUSH tokens that will be received
     */
    function calculateRushAmountFromCUSD(uint256 cusdAmount) external view returns (uint256) {
        return (cusdAmount * cusdToRushRate) / 1 ether;
    }
    
    /**
     * @dev Get current cUSD exchange rate
     * @return rate RUSH tokens per 0.17 cUSD
     */
    function getCUSDExchangeRate() external view returns (uint256) {
        return cusdToRushRate;
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
    
    /**
     * @dev Emergency withdraw cUSD (only owner)
     */
    function emergencyWithdrawCUSD() external onlyOwner {
        uint256 balance = cUSDToken.balanceOf(address(this));
        require(balance > 0, "No cUSD to withdraw");
        cUSDToken.safeTransfer(treasury, balance);
    }
}

