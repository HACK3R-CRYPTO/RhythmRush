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

// Define Celo Sepolia chain
const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  rpc: "https://forno.celo-sepolia.celo-testnet.org/",
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

  // Auto-switch to Celo Sepolia if connected to wrong chain
  // This is especially important for social logins (in-app wallets)
  useEffect(() => {
    if (isConnected && activeChain && activeChain.id !== celoSepolia.id) {
      console.log(`Wrong chain detected (${activeChain.id}). Switching to Celo Sepolia...`);
      switchChain(celoSepolia).catch((err) => {
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
