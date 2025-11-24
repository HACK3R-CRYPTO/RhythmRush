"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@/context/WalletContext";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/client";
import { defineChain, getContract } from "thirdweb";
import { readContract } from "thirdweb";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import IPhoneFrame from "@/components/iPhoneFrame";
import { GAMES } from "@/config/game";
import { AddressDisplay } from "@/components/molecules/AddressDisplay";

const GEM_CONTRACT_ADDRESS = "0xBdE05919CE1ee2E20502327fF74101A8047c37be";

const GEM_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

// Celo Sepolia Testnet
const chain = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  rpc: "https://forno.celo-sepolia.celo-testnet.org/",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18
  }
});

export default function PlayPage() {
  const router = useRouter();
  const { isConnected, account, wallet } = useWallet();
  const [isMinted, setIsMinted] = useState(false);
  const [gemBalance, setGemBalance] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const gemContract = getContract({
    client: client,
    chain: chain,
    address: GEM_CONTRACT_ADDRESS
  });

  useEffect(() => {
    // Debug: Log wallet state
    console.log("Play Page - Wallet state:", { 
      hasWallet: !!wallet, 
      hasAccount: !!account, 
      address: account?.address 
    });

    // Hide ConnectButton's connected state UI when wallet is connected
    if (wallet && account?.address) {
      // Hide any ConnectButton dropdowns or connected state UI
      setTimeout(() => {
        const connectButtons = document.querySelectorAll('[data-testid="connect-button"]');
        connectButtons.forEach((btn: Element) => {
          const element = btn as HTMLElement;
          const parent = element.closest('[class*="tw-connect"]');
          if (parent && parent !== element) {
            (parent as HTMLElement).style.display = 'none';
          }
        });
      }, 100);
      
      console.log("Wallet connected, checking Gem balance...");
      checkGemBalance();
    } else {
      console.log("Wallet not connected");
      setIsMinted(false);
      setGemBalance(0);
    }
  }, [account?.address, isConnected]);

  const checkGemBalance = async () => {
    if (!account?.address) {
      setIsMinted(false);
      setGemBalance(0);
      return;
    }

    setIsChecking(true);
    try {
      // Try Thirdweb first
      try {
        const balance = await readContract({
          contract: gemContract,
          method: "function balanceOf(address owner) view returns (uint256)",
          params: [account.address]
        });
        const balanceNum = Number(balance);
        setGemBalance(balanceNum);
        setIsMinted(balanceNum > 0);
      } catch (thirdwebError) {
        // Fallback to ethers if Thirdweb fails
        console.log("Thirdweb read failed, trying ethers...", thirdwebError);
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.providers.Web3Provider((window as any).ethereum);
          const gemContractEthers = new ethers.Contract(GEM_CONTRACT_ADDRESS, GEM_ABI, provider);
          const balance = await gemContractEthers.balanceOf(account.address);
          const balanceNum = Number(balance);
          setGemBalance(balanceNum);
          setIsMinted(balanceNum > 0);
        }
      }
    } catch (error) {
      console.error("Error checking Gem balance:", error);
      // Try alternative method with ethers
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider((window as any).ethereum);
          const gemContractEthers = new ethers.Contract(GEM_CONTRACT_ADDRESS, GEM_ABI, provider);
          const balance = await gemContractEthers.balanceOf(account.address);
          const balanceNum = Number(balance);
          setGemBalance(balanceNum);
          setIsMinted(balanceNum > 0);
        } catch (fallbackError) {
          console.error("Fallback check also failed:", fallbackError);
          toast.error("Failed to check Gem balance. Please refresh the page.");
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleGameSelect = async (gamePath: string) => {
    // Re-check balance before playing
    if (!account?.address) {
      toast.error('Please connect your wallet first', {
        duration: 3000
      });
      router.push('/wallet-connect');
      return;
    }

    // Refresh balance check
    await checkGemBalance();

    if (!isMinted) {
      toast.error('You need to mint a Gem before playing', {
        duration: 3000
      });
      router.push('/mint');
      return;
    }

    // Navigate to selected game
    router.push(gamePath);
  };

  const handleMintMore = () => {
    router.push('/mint');
  };

  const statusBarContent = (
    <>
      <AddressDisplay 
        address={account?.address} 
        isConnected={!!wallet && !!account} 
      />
      <div className="status-bar-item">
        {wallet && account && (
          <div className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
            isMinted 
              ? 'bg-green-500/20 border-green-500/50 text-green-400' 
              : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}>
            <span>{isMinted ? gemBalance : 0}</span>
            <span className="text-[10px]">💎</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
          style={{ marginBottom: 'clamp(16px, 4vh, 32px)' }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ marginBottom: 'clamp(12px, 3vh, 24px)' }}
          >
            <div 
              className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-2xl flex items-center justify-center mx-auto"
              style={{
                width: 'clamp(80px, 20vw, 120px)',
                height: 'clamp(80px, 20vw, 120px)'
              }}
            >
              <span style={{ fontSize: 'clamp(40px, 10vw, 60px)' }}>🎵</span>
            </div>
          </motion.div>

          <h1 
            className="font-bold"
            style={{ 
              fontSize: 'clamp(32px, 8vw, 48px)',
              marginBottom: 'clamp(4px, 1vh, 8px)'
            }}
          >
            <span className="text-rhythmrush-gold">RHYTHM</span>
            <span className="text-white">RUSH</span>
          </h1>
          <p 
            className="text-white/80"
            style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}
          >
            Ready to play?
          </p>
        </motion.div>

        <div className="content-container">
          {!wallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 mb-4"
            >
              <p className="text-yellow-300 font-semibold text-center mb-4">
                🔌 Connect Your Wallet
              </p>
              <div className="wallet-connect-wrapper">
                <ConnectButton
                  client={client}
                  chain={chain}
                  connectButton={{
                    style: {
                      width: '100%',
                      backgroundColor: '#FFD700',
                      color: '#000',
                      fontWeight: 'bold',
                      borderRadius: '12px',
                      padding: '12px 24px',
                    }
                  }}
                  connectModal={{
                    size: "compact",
                    welcomeScreen: {
                      title: "Welcome to RhythmRush",
                      subtitle: "Connect your wallet to start playing",
                    },
                  }}
                  onConnect={() => {
                    // Wallet connected, wait a bit then check balance
                    setTimeout(() => {
                      if (account?.address) {
                        checkGemBalance();
                      }
                    }, 1500);
                  }}
                />
              </div>
              <p className="text-white/60 text-xs text-center mt-3">
                Connect to Celo Sepolia to play
              </p>
            </motion.div>
          )}
          

          {wallet && account && (
            <>
              {!isChecking && (
                <button
                  onClick={checkGemBalance}
                  className="text-white/60 text-xs hover:text-white transition self-end"
                  style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}
                >
                  🔄 Refresh
                </button>
              )}
              
              {/* Game Selection */}
              {isMinted ? (
                <div className="w-full space-y-2">
                  {Object.values(GAMES).map((game) => (
                    <motion.button
                      key={game.path}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGameSelect(game.path)}
                      disabled={isChecking}
                      className="btn-primary flex items-center gap-3"
                      style={{
                        paddingLeft: 'var(--spacing-lg)',
                        paddingRight: 'var(--spacing-lg)'
                      }}
                    >
                      <span style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}>{game.icon}</span>
                      <div className="text-left flex-1">
                        <div className="font-bold">{game.name}</div>
                        <div 
                          className="opacity-70"
                          style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}
                        >
                          {game.description}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/mint')}
                  disabled={isChecking}
                  className="w-full rounded-xl font-bold transition shadow-lg bg-rhythmrush-gold hover:bg-yellow-400 text-black disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed"
                  style={{
                    paddingTop: 'clamp(12px, 3vh, 16px)',
                    paddingBottom: 'clamp(12px, 3vh, 16px)',
                    fontSize: 'clamp(14px, 3.5vw, 16px)'
                  }}
                >
                  MINT GEM TO PLAY
                </motion.button>
              )}
            </>
          )}

          <div 
            className="grid grid-cols-2 gap-3 w-full"
            style={{ marginTop: 'var(--spacing-md)' }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/submit-score')}
              className="btn-secondary"
            >
              SCORE
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/leaderboard')}
              className="btn-secondary"
            >
              LEADERBOARD
            </motion.button>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
}

