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
    if (!(typeof window !== 'undefined' && (window as any).ethereum)) {
      console.log("No ethereum provider found");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Fetching leaderboard...");
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      
      const length = await rewardsContract.getLeaderboardLength();
      const totalEntries = Number(length);
      console.log("Total leaderboard entries:", totalEntries);
      
      if (totalEntries > 0) {
        // Fetch all entries to deduplicate (max 100 from contract)
        const fetchCount = Math.min(100, totalEntries);
        console.log("Fetching", fetchCount, "players");
        const players = await rewardsContract.getTopPlayers(fetchCount);
        console.log("Raw players from contract:", players);
        
        // Format and normalize addresses
        const formattedPlayers = players.map((p: any) => ({
          player: p.player.toLowerCase(), // Normalize to lowercase
          score: Number(p.score),
          timestamp: Number(p.timestamp),
          claimed: p.claimed
        }));
        console.log("Formatted players:", formattedPlayers);
        
        // Deduplicate: Keep only the best score for each player
        const playerMap = new Map<string, LeaderboardEntry>();
        
        formattedPlayers.forEach((player: LeaderboardEntry) => {
          const normalizedAddress = player.player.toLowerCase();
          const existing = playerMap.get(normalizedAddress);
          
          if (!existing) {
            // First time seeing this player
            playerMap.set(normalizedAddress, player);
          } else if (player.score > existing.score) {
            // Better score - replace
            playerMap.set(normalizedAddress, player);
          } else if (player.score === existing.score && player.timestamp > existing.timestamp) {
            // Same score but more recent - replace
            playerMap.set(normalizedAddress, player);
          }
        });
        
        // Convert map to array, sort by score (descending), then take top 10
        const uniquePlayers = Array.from(playerMap.values())
          .sort((a, b) => {
            // Sort by score descending, then by timestamp descending (most recent first for same score)
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return b.timestamp - a.timestamp;
          })
          .slice(0, 10);
        
        console.log('Unique players after deduplication:', uniquePlayers);
        console.log('Setting top players:', uniquePlayers.length);
        setTopPlayers(uniquePlayers);
      } else {
        console.log("No entries in leaderboard");
        setTopPlayers([]);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setTopPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const statusBarContent = (
    <>
      <div className="status-bar-item">
        <div className="status-indicator bg-green-400"></div>
        <div>Leaderboard</div>
      </div>
      <div className="status-bar-item">9:41</div>
    </>
  );

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush" statusBarContent={statusBarContent}>
      <div className="page-container" style={{ padding: 'var(--spacing-md)' }}>
        <div className="text-center mb-4">
          <h1 className="title-section">
            <span className="text-rhythmrush-gold">TOP</span>
            <span className="text-white"> PLAYERS</span>
          </h1>
          <p className="text-white/80" style={{ fontSize: 'var(--text-base)' }}>
            Compete for RUSH rewards
          </p>
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
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {/* Podium for Top 3 - Only show if we have at least 3 players */}
            {topPlayers.length >= 3 ? (
              <div className="mb-6">
                <div className="flex items-end justify-center gap-2" style={{ height: 'clamp(180px, 45vw, 220px)' }}>
                  {/* 2nd Place - Left */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center"
                    style={{ width: '30%', maxWidth: '100px' }}
                  >
                    <div className="mb-2">
                      <span className="text-4xl" style={{ fontSize: 'clamp(32px, 8vw, 40px)' }}>🥈</span>
                    </div>
                    <div className={`card-blur w-full flex flex-col items-center justify-end ${
                      account?.address?.toLowerCase() === topPlayers[1].player.toLowerCase() 
                        ? 'border-rhythmrush-gold border-2' : ''
                    }`}
                    style={{ 
                      height: '70%',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                    }}>
                      <p className={`font-bold text-center truncate w-full ${
                        account?.address?.toLowerCase() === topPlayers[1].player.toLowerCase()
                          ? 'text-rhythmrush-gold' : 'text-white'
                      }`}
                      style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}>
                        {account?.address?.toLowerCase() === topPlayers[1].player.toLowerCase() 
                          ? "You" : formatAddress(topPlayers[1].player)}
                      </p>
                      <p className="text-rhythmrush-gold font-bold text-center"
                        style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}>
                        {topPlayers[1].score}
                      </p>
                    </div>
                    <div className="text-white/80 font-bold mt-1" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      2
                    </div>
                  </motion.div>

                  {/* 1st Place - Center (Tallest) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center"
                    style={{ width: '30%', maxWidth: '100px' }}
                  >
                    <div className="mb-2">
                      <span className="text-5xl" style={{ fontSize: 'clamp(40px, 10vw, 48px)' }}>🥇</span>
                    </div>
                    <div className={`card-blur w-full flex flex-col items-center justify-end ${
                      account?.address?.toLowerCase() === topPlayers[0].player.toLowerCase() 
                        ? 'border-rhythmrush-gold border-2 shadow-lg shadow-rhythmrush-gold/50' : ''
                    }`}
                    style={{ 
                      height: '100%',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                    }}>
                      <p className={`font-bold text-center truncate w-full ${
                        account?.address?.toLowerCase() === topPlayers[0].player.toLowerCase()
                          ? 'text-rhythmrush-gold' : 'text-white'
                      }`}
                      style={{ fontSize: 'clamp(11px, 2.75vw, 13px)' }}>
                        {account?.address?.toLowerCase() === topPlayers[0].player.toLowerCase() 
                          ? "You" : formatAddress(topPlayers[0].player)}
                      </p>
                      <p className="text-rhythmrush-gold font-bold text-center"
                        style={{ fontSize: 'clamp(18px, 4.5vw, 22px)' }}>
                        {topPlayers[0].score}
                      </p>
                    </div>
                    <div className="text-white/80 font-bold mt-1" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      1
                    </div>
                  </motion.div>

                  {/* 3rd Place - Right */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    className="flex flex-col items-center"
                    style={{ width: '30%', maxWidth: '100px' }}
                  >
                    <div className="mb-2">
                      <span className="text-4xl" style={{ fontSize: 'clamp(32px, 8vw, 40px)' }}>🥉</span>
                    </div>
                    <div className={`card-blur w-full flex flex-col items-center justify-end ${
                      account?.address?.toLowerCase() === topPlayers[2].player.toLowerCase() 
                        ? 'border-rhythmrush-gold border-2' : ''
                    }`}
                    style={{ 
                      height: '50%',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                    }}>
                      <p className={`font-bold text-center truncate w-full ${
                        account?.address?.toLowerCase() === topPlayers[2].player.toLowerCase()
                          ? 'text-rhythmrush-gold' : 'text-white'
                      }`}
                      style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}>
                        {account?.address?.toLowerCase() === topPlayers[2].player.toLowerCase() 
                          ? "You" : formatAddress(topPlayers[2].player)}
                      </p>
                      <p className="text-rhythmrush-gold font-bold text-center"
                        style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}>
                        {topPlayers[2].score}
                      </p>
                    </div>
                    <div className="text-white/80 font-bold mt-1" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                      3
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              // Show regular list if less than 3 players
              <div className="mb-6 space-y-2.5">
                {topPlayers.slice(0, 3).map((player, index) => {
                  const normalizedPlayerAddress = player.player.toLowerCase();
                  const normalizedAccountAddress = account?.address?.toLowerCase();
                  const isCurrentUser = normalizedAccountAddress === normalizedPlayerAddress;
                  const medals = ["🥇", "🥈", "🥉"];
                  
                  return (
                    <motion.div
                      key={`${normalizedPlayerAddress}-${player.score}-${player.timestamp}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                      className={`card-blur ${
                        isCurrentUser ? 'border-rhythmrush-gold border-2 shadow-lg shadow-rhythmrush-gold/50' : ''
                      }`}
                      style={{ 
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <span className="text-3xl" style={{ fontSize: 'clamp(28px, 7vw, 36px)' }}>
                              {medals[index]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate ${
                              isCurrentUser ? 'text-rhythmrush-gold' : 'text-white'
                            }`}
                            style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                              {isCurrentUser ? "You" : formatAddress(player.player)}
                            </p>
                            <p className="text-white/60 text-xs mt-0.5">
                              {new Date(player.timestamp * 1000).toLocaleDateString()} points
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-rhythmrush-gold font-bold" 
                            style={{ fontSize: 'clamp(18px, 4.5vw, 22px)' }}>
                            {player.score}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Regular List for Positions 4-10 */}
            {topPlayers.length > 3 && (
              <div className="space-y-2.5">
                {topPlayers.slice(3).map((player, index) => {
                  const actualIndex = index + 4; // Positions 4-10
                  const normalizedPlayerAddress = player.player.toLowerCase();
                  const normalizedAccountAddress = account?.address?.toLowerCase();
                  const isCurrentUser = normalizedAccountAddress === normalizedPlayerAddress;
                  
                  return (
                    <motion.div
                      key={`${normalizedPlayerAddress}-${player.score}-${player.timestamp}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + 3) * 0.1, type: "spring", stiffness: 100 }}
                      className={`card-blur ${
                        isCurrentUser ? 'border-rhythmrush-gold border-2 shadow-lg shadow-rhythmrush-gold/50' : ''
                      }`}
                      style={{ 
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold"
                              style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                              {actualIndex}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate ${
                              isCurrentUser ? 'text-rhythmrush-gold' : 'text-white'
                            }`}
                            style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                              {isCurrentUser ? "You" : formatAddress(player.player)}
                            </p>
                            <p className="text-white/60 text-xs mt-0.5">
                              {new Date(player.timestamp * 1000).toLocaleDateString()} points
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-rhythmrush-gold font-bold" 
                            style={{ fontSize: 'clamp(18px, 4.5vw, 22px)' }}>
                            {player.score}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchLeaderboard()}
            className="btn-secondary"
          >
            REFRESH
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/submit-score')}
            className="btn-primary"
          >
            SUBMIT SCORE
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/play')}
            className="btn-secondary"
          >
            BACK TO PLAY
          </motion.button>
        </div>
      </div>
    </IPhoneFrame>
  );
}

