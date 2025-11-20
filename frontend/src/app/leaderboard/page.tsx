"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import IPhoneFrame from "@/components/iPhoneFrame";

const REWARDS_CONTRACT_ADDRESS = "0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280";

const REWARDS_ABI = [
  {
    inputs: [{ name: "count", type: "uint256" }],
    name: "getTopPlayers",
    outputs: [
      {
        components: [
          { name: "player", type: "address" },
          { name: "score", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "claimed", type: "bool" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getLeaderboardLength",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

interface LeaderboardEntry {
  player: string;
  score: number;
  timestamp: number;
  claimed: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    if (!window.ethereum) {
      setIsLoading(false);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      
      const length = await rewardsContract.getLeaderboardLength();
      const count = Math.min(10, Number(length));
      
      if (count > 0) {
        const players = await rewardsContract.getTopPlayers(count);
        const formattedPlayers = players.map((p: any) => ({
          player: p.player,
          score: Number(p.score),
          timestamp: Number(p.timestamp),
          claimed: p.claimed
        }));
        setTopPlayers(formattedPlayers);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const statusBarContent = (
    <>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400"></div>
        <div className="text-white text-xs">Leaderboard</div>
      </div>
      <div className="text-white text-xs">9:41</div>
    </>
  );

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
      <div className="h-full w-full flex flex-col p-6 overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-rhythmrush-gold">TOP</span>
            <span className="text-white"> PLAYERS</span>
          </h1>
          <p className="text-white/80">Compete for RUSH rewards</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-rhythmrush-gold border-t-transparent"></div>
          </div>
        ) : topPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No scores yet</p>
            <p className="text-white/40 text-sm mt-2">Be the first to submit a score!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPlayers.map((player, index) => {
              const isCurrentUser = account?.address?.toLowerCase() === player.player.toLowerCase();
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border ${
                    isCurrentUser ? 'border-rhythmrush-gold border-2' : 'border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getRankEmoji(index)}</span>
                      <div>
                        <p className={`font-semibold ${isCurrentUser ? 'text-rhythmrush-gold' : 'text-white'}`}>
                          {isCurrentUser ? "You" : formatAddress(player.player)}
                        </p>
                        <p className="text-white/60 text-xs">
                          {new Date(player.timestamp * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-rhythmrush-gold font-bold text-xl">{player.score}</p>
                      <p className="text-white/60 text-xs">points</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchLeaderboard()}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition border border-white/20"
          >
            REFRESH
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/submit-score')}
            className="w-full bg-rhythmrush-gold hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition"
          >
            SUBMIT SCORE
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/play')}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition border border-white/20"
          >
            BACK TO PLAY
          </motion.button>
        </div>
      </div>
    </IPhoneFrame>
  );
}

