"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  useActiveAccount, 
  useActiveWallet, 
  useActiveWalletChain, 
  useSwitchActiveWalletChain,
  useDisconnect,
} from "thirdweb/react";
import { Wallet, Account } from "thirdweb/wallets";
import { defineChain } from "thirdweb";
import { CONTRACTS, isSupportedChain } from "@/config/contracts";

// Define both Celo networks
const celoMainnet = defineChain({
  id: CONTRACTS.mainnet.chainId,
  name: CONTRACTS.mainnet.name,
  rpc: CONTRACTS.mainnet.rpc,
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  }
});

const celoSepolia = defineChain({
  id: CONTRACTS.testnet.chainId,
  name: CONTRACTS.testnet.name,
  rpc: CONTRACTS.testnet.rpc,
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  }
});

interface WalletContextType {
  isConnected: boolean;
  account: Account | undefined;
  wallet: Wallet | undefined;
  disconnect: () => void;
  chainId: number | undefined;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const { disconnect: disconnectWallet } = useDisconnect();
  
  const [isConnected, setIsConnected] = useState(false);

  // Update connection state based on account presence
  useEffect(() => {
    setIsConnected(!!account);
  }, [account]);

  // Auto-switch to supported Celo network if connected to unsupported chain
  // Supports both Mainnet and Sepolia Testnet
  // This is especially important for social logins (in-app wallets)
  useEffect(() => {
    if (isConnected && activeChain && !isSupportedChain(activeChain.id)) {
      console.log(`Unsupported chain detected (${activeChain.id}). Switching to Celo Mainnet...`);
      switchChain(celoMainnet).catch((err) => {
        console.error("Failed to switch chain:", err);
      });
    }
  }, [isConnected, activeChain, switchChain]);

  const handleDisconnect = () => {
    if (wallet) {
      disconnectWallet(wallet);
    }
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      account,
      wallet,
      disconnect: handleDisconnect,
      chainId: activeChain?.id
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
