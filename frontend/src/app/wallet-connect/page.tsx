"use client";
import { ConnectButton } from "thirdweb/react";
import { useRouter } from 'next/navigation';
import { useActiveWallet } from "thirdweb/react";
import { client } from "@/client";
import { useEffect } from "react";
import { defineChain } from "thirdweb/chains";
import { motion } from "framer-motion";
import IPhoneFrame from "@/components/iPhoneFrame";

export default function WalletConnect() {
  const router = useRouter();
  const wallet = useActiveWallet();
  
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
    if (wallet) {
      router.replace('/mint');
    }
  }, [wallet, router]);

  const statusBarContent = (
    <>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400"></div>
        <div className="text-white text-xs font-medium">RhythmRush</div>
      </div>
      <div className="text-white text-xs">9:41</div>
    </>
  );

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
      <div className="h-full w-full flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="w-[100px] h-[100px] bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-2xl flex items-center justify-center mx-auto">
              <span className="text-5xl">🎵</span>
            </div>
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-2">
            <span className="text-rhythmrush-gold">RHYTHM</span>
            <span className="text-white">RUSH</span>
          </h1>
          <p className="text-white/80 text-lg">Connect your wallet to start</p>
        </div>

        <div className="w-full max-w-[340px] space-y-4">
          <div className="text-center">
            <p className="text-white text-lg mb-4 font-semibold">CONNECT YOUR WALLET</p>
            <div className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-2xl p-6 border border-white/20 transition-all">
              <ConnectButton
                chain={chain}
                client={client}
                onConnect={() => {
                  router.replace('/mint');
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
            </div>
            <p className="text-white/60 text-sm mt-4">
              Connect to Celo Sepolia to play
            </p>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
}

