// Contract addresses for both Celo Mainnet and Sepolia Testnet

export const CONTRACTS = {
  // Celo Mainnet (Chain ID: 42220)
  mainnet: {
    chainId: 42220,
    rpc: "https://forno.celo.org",
    name: "Celo",
    rushToken: "0xdA0E2109E96aC6ddAf2856fb1FafA5124A4a8209",
    gemContract: "0xC722211F260E96acEDea1bbdEBaa739456CeC5C7",
    rewardsContract: "0xC8395B038B7B7b05a7d8161068cAd5CDFe7fbFe2",
    swapContract: "0x4013F9F2E2FdF3189F85dB8642a30b3A3F5D862A",
    cusdToken: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    explorer: "https://celoscan.io",
  },
  // Celo Sepolia Testnet (Chain ID: 11142220)
  testnet: {
    chainId: 11142220,
    rpc: "https://forno.celo-sepolia.celo-testnet.org/",
    name: "Celo Sepolia",
    rushToken: "0x9A8629e7D3FcCDbC4d1DE24d43013452cfF23cF0",
    gemContract: "0xBdE05919CE1ee2E20502327fF74101A8047c37be",
    rewardsContract: "0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280",
    swapContract: "0x2744e8aAce17a217858FF8394C9d1198279215d9",
    cusdToken: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
    explorer: "https://celo-sepolia.blockscout.com",
  },
} as const;

// Get contract addresses based on chain ID
export function getContracts(chainId: number) {
  if (chainId === CONTRACTS.mainnet.chainId) {
    return CONTRACTS.mainnet;
  } else if (chainId === CONTRACTS.testnet.chainId) {
    return CONTRACTS.testnet;
  } else {
    // Default to mainnet if unknown chain
    console.warn(`Unknown chain ID ${chainId}, defaulting to mainnet`);
    return CONTRACTS.mainnet;
  }
}

// Check if chain ID is supported
export function isSupportedChain(chainId: number): boolean {
  return chainId === CONTRACTS.mainnet.chainId || chainId === CONTRACTS.testnet.chainId;
}

