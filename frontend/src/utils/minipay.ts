/**
 * MiniPay Integration Utilities
 * Detects MiniPay wallet and provides utilities for MiniPay-specific features
 */

// Check if MiniPay wallet is available
export function isMiniPayAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  const hasEthereum = !!(window as any).ethereum;
  const isMiniPay = !!((window as any).ethereum && ((window as any).ethereum as any).isMiniPay);
  
  // Debug logging
  if (hasEthereum) {
    console.log('🔍 Wallet Detection:', {
      hasEthereum,
      isMiniPay,
      walletType: isMiniPay ? 'MiniPay' : 'Other Wallet'
    });
  }
  
  return isMiniPay;
}

// Get connected address from MiniPay
export async function getMiniPayAddress(): Promise<string | null> {
  if (!isMiniPayAvailable()) return null;

  try {
    const accounts = await ((window as any).ethereum as any).request({
      method: "eth_requestAccounts",
      params: [],
    });

    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting MiniPay address:", error);
    return null;
  }
}

// Check cUSD balance using viem
export async function checkCUSDBalance(
  address: string,
  isTestnet: boolean = true
): Promise<string> {
  try {
    const { createPublicClient, http, getContract, formatEther } = await import("viem");
    const { celo, celoSepolia } = await import("viem/chains");
    const { stableTokenABI } = await import("@celo/abis");

    // cUSD addresses
    const STABLE_TOKEN_ADDRESS_TESTNET = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Celo Sepolia
    const STABLE_TOKEN_ADDRESS_MAINNET = "0x765DE816845861e75A25fCA122bb6898B8B1282a"; // Celo Mainnet

    const publicClient = createPublicClient({
      chain: isTestnet ? celoSepolia : celo,
      transport: http(),
    });

    const stableTokenAddress = isTestnet 
      ? STABLE_TOKEN_ADDRESS_TESTNET 
      : STABLE_TOKEN_ADDRESS_MAINNET;

    const StableTokenContract = getContract({
      abi: stableTokenABI,
      address: stableTokenAddress as `0x${string}`,
      client: publicClient,
    });

    const balanceInBigNumber = await StableTokenContract.read.balanceOf([
      address as `0x${string}`,
    ]);

    const balanceInEthers = formatEther(balanceInBigNumber);

    return balanceInEthers;
  } catch (error) {
    console.error("Error checking cUSD balance:", error);
    return "0";
  }
}

// Open MiniPay add cash screen
export function openMiniPayAddCash(): void {
  if (typeof window !== 'undefined') {
    window.open('https://minipay.opera.com/add_cash', '_blank');
  }
}

// Check if transaction succeeded
export async function checkTransactionStatus(
  transactionHash: string,
  isTestnet: boolean = true
): Promise<boolean> {
  try {
    const { createPublicClient, http } = await import("viem");
    const { celo, celoSepolia } = await import("viem/chains");

    const publicClient = createPublicClient({
      chain: isTestnet ? celoSepolia : celo,
      transport: http(),
    });

    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    return receipt.status === "success";
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return false;
  }
}

