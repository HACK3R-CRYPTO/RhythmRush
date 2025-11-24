const { ethers } = require("ethers");

const SWAP_CONTRACT_ADDRESS = "0x2744e8aAce17a217858FF8394C9d1198279215d9";
const RUSH_TOKEN_ADDRESS = "0x9A8629e7D3FcCDbC4d1DE24d43013452cfF23cF0";
const RPC_URL = "https://forno.celo-sepolia.celo-testnet.org/";

const SWAP_ABI = [
    "function getExchangeRate() view returns (uint256)",
    "function getCUSDExchangeRate() view returns (uint256)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)"
];

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, SWAP_ABI, provider);
    const rushContract = new ethers.Contract(RUSH_TOKEN_ADDRESS, ERC20_ABI, provider);

    console.log("Checking Swap Contract Status...");

    try {
        const rate = await swapContract.getExchangeRate();
        console.log("Exchange Rate (CELO -> RUSH):", rate.toString());
    } catch (e) {
        console.error("Error fetching exchange rate:", e.message);
    }

    try {
        const balance = await rushContract.balanceOf(SWAP_CONTRACT_ADDRESS);
        console.log("Swap Contract RUSH Balance:", ethers.utils.formatEther(balance));
    } catch (e) {
        console.error("Error fetching RUSH balance:", e.message);
    }
}

main();
