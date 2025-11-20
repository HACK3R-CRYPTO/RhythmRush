"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useActiveWallet, useActiveAccount, ConnectButton } from "thirdweb/react";
import { client } from "@/client";
import { defineChain, getContract } from "thirdweb";
import { readContract } from "thirdweb";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import IPhoneFrame from "@/components/iPhoneFrame";
import { GAMES } from "@/config/game";

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
  const wallet = useActiveWallet();
  const account = useActiveAccount();
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

    // Check wallet connection first
    if (wallet && account?.address) {
      console.log("Wallet connected, checking Gem balance...");
      checkGemBalance();
    } else {
      console.log("Wallet not connected");
      setIsMinted(false);
      setGemBalance(0);
    }
  }, [account?.address, wallet]);

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
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          wallet && account 
            ? (isMinted ? 'bg-green-400' : 'bg-yellow-400') 
            : 'bg-red-400'
        }`}></div>
        <div className="text-white text-xs">
          {wallet && account 
            ? (isMinted ? `${gemBalance} Gem${gemBalance > 1 ? 's' : ''}` : "No Gem")
            : "Not Connected"}
        </div>
      </div>
      <div className="text-white text-xs">9:41</div>
    </>
  );

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
      <div className="h-full w-full flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
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
            className="mb-6"
          >
            <div className="w-[120px] h-[120px] bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-2xl flex items-center justify-center mx-auto">
              <span className="text-6xl">🎵</span>
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold mb-2">
            <span className="text-rhythmrush-gold">RHYTHM</span>
            <span className="text-white">RUSH</span>
          </h1>
          <p className="text-white/80 text-lg">Ready to play?</p>
        </motion.div>

        <div className="w-full max-w-[340px] space-y-4">
          {!wallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 mb-4"
            >
              <p className="text-yellow-300 font-semibold text-center mb-4">
                🔌 Connect Your Wallet
              </p>
              <ConnectButton
                chain={chain}
                client={client}
                onConnect={() => {
                  // Wallet connected, wait a bit then check balance
                  setTimeout(() => {
                    if (account?.address) {
                      checkGemBalance();
                    }
                  }, 1500);
                }}
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
              />
              <p className="text-white/60 text-xs text-center mt-3">
                Connect to Celo Sepolia to play
              </p>
            </motion.div>
          )}

          {wallet && account && (
            <>
              {isChecking && (
                <div className="text-center text-white/60 text-sm mb-2">
                  Checking Gem balance...
                </div>
              )}
              {!isChecking && (
                <button
                  onClick={checkGemBalance}
                  className="text-white/60 text-xs mb-2 hover:text-white transition"
                >
                  🔄 Refresh Balance
                </button>
              )}
              {/* Game Selection */}
              {isMinted ? (
                <div className="w-full space-y-3">
                  <p className="text-white/80 text-sm text-center mb-2">Choose a game:</p>
                  {Object.values(GAMES).map((game) => (
                    <motion.button
                      key={game.path}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleGameSelect(game.path)}
                      disabled={isChecking}
                      className="w-full py-4 rounded-xl font-bold text-lg transition shadow-lg bg-rhythmrush-gold hover:bg-yellow-400 text-black flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl">{game.icon}</span>
                      <div className="text-left">
                        <div className="font-bold">{game.name}</div>
                        <div className="text-xs opacity-70">{game.description}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isChecking}
                  className="w-full py-4 rounded-xl font-bold text-lg transition shadow-lg bg-gray-500 text-white cursor-not-allowed"
                >
                  MINT GEM TO PLAY
                </motion.button>
              )}
            </>
          )}

          {isMinted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-4"
            >
              <p className="text-blue-300 font-semibold text-sm text-center">
                💎 You own {gemBalance} Gem{gemBalance > 1 ? 's' : ''} - Ready to play!
              </p>
              <p className="text-white/70 text-xs text-center mt-1">
                Choose from multiple games above
              </p>
              <p className="text-white/70 text-xs text-center mt-1">
                Score automatically submitted after game
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/submit-score')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition border border-white/20"
            >
              SUBMIT SCORE
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/leaderboard')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition border border-white/20"
            >
              LEADERBOARD
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMintMore}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition border border-white/20 mt-4"
          >
            MINT MORE GEMS
          </motion.button>

          {wallet && account && (
            <>
              {isMinted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center"
                >
                  <p className="text-green-300 font-semibold">
                    ✅ You own {gemBalance} Gem{gemBalance > 1 ? 's' : ''}!
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    You're ready to play and earn RUSH tokens
                  </p>
                </motion.div>
              )}
              {!isMinted && !isChecking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center"
                >
                  <p className="text-red-300 font-semibold">
                    ❌ No Gems found
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    Mint a Gem to start playing
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </IPhoneFrame>
  );
}

