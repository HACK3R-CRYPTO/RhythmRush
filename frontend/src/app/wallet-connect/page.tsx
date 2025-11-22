"use client";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { useRouter } from 'next/navigation';
import { client } from "@/client";
import { useEffect, useState } from "react";
import { defineChain } from "thirdweb/chains";
import { motion } from "framer-motion";
import IPhoneFrame from "@/components/iPhoneFrame";
import { isMiniPayAvailable, openMiniPayAddCash } from "@/utils/minipay";

export default function WalletConnect() {
  const router = useRouter();
  const wallet = useActiveWallet();
  const [isMiniPay, setIsMiniPay] = useState(false);
  
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

  useEffect(() => {
    setIsMiniPay(isMiniPayAvailable());
  }, []);

  useEffect(() => {
    if (wallet) {
      router.replace('/mint');
    }
  }, [wallet, router]);

  const statusBarContent = (
    <>
      <div className="status-bar-item">
        <div className="status-indicator bg-green-400"></div>
        <div>RhythmRush</div>
      </div>
      <div className="status-bar-item">9:41</div>
    </>
  );

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
      <div className="page-container">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="logo-container"
          >
            <span className="logo-icon">🎵</span>
          </motion.div>
          
          <h1 className="title-main">
            <span className="text-rhythmrush-gold">RHYTHM</span>
            <span className="text-white">RUSH</span>
          </h1>
          <p className="text-white/80" style={{ fontSize: 'var(--text-lg)' }}>
            Connect your wallet to start
          </p>
        </div>

        <div className="content-container">
          <div className="text-center">
            <p className="text-white text-lg mb-4 font-semibold">CONNECT YOUR WALLET</p>
            
            {isMiniPay && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                <p className="text-green-300 text-sm font-semibold mb-2">🎉 MiniPay Detected!</p>
                <p className="text-white/80 text-xs">
                  You're using MiniPay. Enjoy seamless, low-cost transactions!
                </p>
              </div>
            )}

            <div className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-2xl p-6 border border-white/20 transition-all">
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
              />
            </div>
            
            {isMiniPay && (
              <button
                onClick={openMiniPayAddCash}
                className="mt-3 w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-2 px-4 rounded-xl transition text-sm"
              >
                💰 Add Cash to MiniPay
              </button>
            )}

            <p className="text-white/60 text-sm mt-4">
              Connect to Celo Sepolia to play
            </p>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
}

