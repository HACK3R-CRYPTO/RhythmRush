"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@/context/WalletContext";
import { motion } from "framer-motion";
import IPhoneFrame from "@/components/iPhoneFrame";
import Loading from "@/components/Loading";
import { client } from "@/client";
import { defineChain, getContract } from "thirdweb";
import { readContract } from "thirdweb";
import { getContracts, CONTRACTS } from "@/config/contracts";
import { useActiveWalletChain } from "thirdweb/react";

const REWARDS_ABI = [
  {
    inputs: [{ name: "", type: "address" }],
    name: "playerScores",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getLeaderboardLength",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
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
        internalType: "struct RhythmRushRewards.LeaderboardEntry[]",
        name: "",
        type: "tuple[]"
      }
    ],
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
  const { account } = useWallet();
  const activeChain = useActiveWalletChain();
  const contracts = activeChain?.id 
    ? getContracts(activeChain.id) 
    : CONTRACTS.mainnet;
  
  const REWARDS_CONTRACT_ADDRESS = contracts.rewardsContract;
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{rank: number, entry: LeaderboardEntry} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const chain = defineChain({
    id: contracts.chainId,
    name: contracts.name,
    rpc: contracts.rpc,
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18
    }
  });

  const rewardsContract = getContract({
    client,
    chain,
    address: REWARDS_CONTRACT_ADDRESS
  });

  const fetchLeaderboard = async () => {
    try {
      console.log("Fetching leaderboard...");
      
      const length = await readContract({
        contract: rewardsContract,
        method: "function getLeaderboardLength() view returns (uint256)",
        params: [],
      });
      
      const totalEntries = Number(length);
      console.log("Total leaderboard entries:", totalEntries);
      
      if (totalEntries > 0) {
        // Fetch ALL entries to determine correct rank
        // Note: In production with thousands of users, we would need pagination or backend indexing
        // But for hackathon scale, fetching all is fine
        const fetchCount = totalEntries;
        console.log("Fetching", fetchCount, "players");
        
        const players = await readContract({
          contract: rewardsContract,
          method: "function getTopPlayers(uint256) view returns ((address player, uint256 score, uint256 timestamp, bool claimed)[])",
          params: [BigInt(fetchCount)],
        });
        
        // Format and normalize addresses
        const formattedPlayers = players.map((p: any) => ({
          player: p.player.toLowerCase(), // Normalize to lowercase
          score: Number(p.score),
          timestamp: Number(p.timestamp),
          claimed: p.claimed
        }));
        
        // Deduplicate: Keep only the best score for each player
        const playerMap = new Map<string, LeaderboardEntry>();
        
        formattedPlayers.forEach((player: LeaderboardEntry) => {
          const normalizedAddress = player.player.toLowerCase();
          const existing = playerMap.get(normalizedAddress);
          
          if (!existing) {
            playerMap.set(normalizedAddress, player);
          } else if (player.score > existing.score) {
            playerMap.set(normalizedAddress, player);
          } else if (player.score === existing.score && player.timestamp > existing.timestamp) {
            playerMap.set(normalizedAddress, player);
          }
        });
        
        // Convert map to array and sort
        const allUniquePlayers = Array.from(playerMap.values())
          .sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return b.timestamp - a.timestamp;
          });
        
        // Set top 10
        setTopPlayers(allUniquePlayers.slice(0, 10));

        // Find user rank
        if (account?.address) {
          const normalizedAccount = account.address.toLowerCase();
          // Check against ALL unique players (including real ones)
          const rankIndex = allUniquePlayers.findIndex(p => p.player.toLowerCase() === normalizedAccount);
          
          if (rankIndex !== -1) {
            setUserRank({
              rank: rankIndex + 1,
              entry: allUniquePlayers[rankIndex]
            });
          } else {
            // If user is not in the real list, they might be new or have 0 score
            // For now, we just set null, or we could show a "Unranked" state
            setUserRank(null);
          }
        }

      } else {
        console.log("No entries in leaderboard");
        setTopPlayers([]);
        setUserRank(null);
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
      <div className="flex flex-col h-full max-h-full">
        {/* Fixed Header */}
        <div className="pt-2 px-6 pb-1 flex-shrink-0 z-10 bg-rhythmrush/95 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-rhythmrush-gold drop-shadow-md">TOP</span>
              <span className="text-white drop-shadow-md"> PLAYERS</span>
            </h1>
            <p className="text-white/60 text-xs mt-0.5 font-medium">
              Compete for RUSH rewards
            </p>
          </div>
        </div>

        {/* Content Area - No scroll here */}
        <div className="flex-1 px-6 py-2 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-rhythmrush-gold border-t-transparent shadow-[0_0_15px_rgba(255,215,0,0.5)]"></div>
            </div>
          ) : topPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-white/60 text-lg font-bold">No scores yet</p>
              <p className="text-white/40 text-sm mt-2">Be the first to submit a score!</p>
            </div>
          ) : (
            <>
              {/* Podium for Top 3 - Fixed, not scrollable */}
              {topPlayers.length >= 3 && (
                <div className="mb-4 mt-2">
                  <div className="flex items-end justify-center gap-2" style={{ height: 'clamp(140px, 35vw, 180px)' }}>
                    {/* 2nd Place - Left */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                      className="flex flex-col items-center relative z-10"
                      style={{ width: '30%', maxWidth: '100px' }}
                    >
                      <div className="mb-2 transform -rotate-6">
                        <span className="text-4xl drop-shadow-lg" style={{ fontSize: 'clamp(28px, 7vw, 36px)' }}>🥈</span>
                      </div>
                      <div className={`w-full flex flex-col items-center justify-end relative overflow-hidden ${
                        account?.address?.toLowerCase() === topPlayers[1].player.toLowerCase() 
                          ? 'border-rhythmrush-gold border-2' : 'border-t border-white/20'
                      }`}
                      style={{ 
                        height: '70%',
                        padding: 'var(--spacing-sm)',
                        borderRadius: '16px 16px 0 0',
                        background: 'linear-gradient(to bottom, rgba(192,192,192,0.2), rgba(0,0,0,0.4))',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-400/50"></div>
                        <p className={`font-bold text-center truncate w-full ${
                          account?.address?.toLowerCase() === topPlayers[1].player.toLowerCase()
                            ? 'text-rhythmrush-gold' : 'text-white'
                        }`}
                        style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}>
                          {account?.address?.toLowerCase() === topPlayers[1].player.toLowerCase() 
                            ? "You" : formatAddress(topPlayers[1].player)}
                        </p>
                        <p className="text-white font-black text-center mt-1"
                          style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}>
                          {topPlayers[1].score}
                        </p>
                      </div>
                    </motion.div>

                    {/* 1st Place - Center (Tallest) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                      className="flex flex-col items-center relative z-20"
                      style={{ width: '34%', maxWidth: '110px' }}
                    >
                      <div className="mb-2">
                        <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" style={{ fontSize: 'clamp(36px, 9vw, 44px)' }}>👑</span>
                      </div>
                      <div className={`w-full flex flex-col items-center justify-end relative overflow-hidden ${
                        account?.address?.toLowerCase() === topPlayers[0].player.toLowerCase() 
                          ? 'border-rhythmrush-gold border-2 shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'border-t border-white/20 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                      }`}
                      style={{ 
                        height: '100%',
                        padding: 'var(--spacing-sm)',
                        borderRadius: '16px 16px 0 0',
                        background: 'linear-gradient(to bottom, rgba(255,215,0,0.2), rgba(0,0,0,0.4))',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/80 shadow-[0_0_10px_rgba(255,215,0,0.8)]"></div>
                        <p className={`font-bold text-center truncate w-full ${
                          account?.address?.toLowerCase() === topPlayers[0].player.toLowerCase()
                            ? 'text-rhythmrush-gold' : 'text-white'
                        }`}
                        style={{ fontSize: 'clamp(11px, 2.75vw, 13px)' }}>
                          {account?.address?.toLowerCase() === topPlayers[0].player.toLowerCase() 
                            ? "You" : formatAddress(topPlayers[0].player)}
                        </p>
                        <p className="text-rhythmrush-gold font-black text-center mt-1 text-shadow-sm"
                          style={{ fontSize: 'clamp(18px, 4.5vw, 24px)' }}>
                          {topPlayers[0].score}
                        </p>
                      </div>
                    </motion.div>

                    {/* 3rd Place - Right */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                      className="flex flex-col items-center relative z-10"
                      style={{ width: '30%', maxWidth: '100px' }}
                    >
                      <div className="mb-2 transform rotate-6">
                        <span className="text-4xl drop-shadow-lg" style={{ fontSize: 'clamp(28px, 7vw, 36px)' }}>🥉</span>
                      </div>
                      <div className={`w-full flex flex-col items-center justify-end relative overflow-hidden ${
                        account?.address?.toLowerCase() === topPlayers[2].player.toLowerCase() 
                          ? 'border-rhythmrush-gold border-2' : 'border-t border-white/20'
                      }`}
                      style={{ 
                        height: '50%',
                        padding: 'var(--spacing-sm)',
                        borderRadius: '16px 16px 0 0',
                        background: 'linear-gradient(to bottom, rgba(205,127,50,0.2), rgba(0,0,0,0.4))',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-700/50"></div>
                        <p className={`font-bold text-center truncate w-full ${
                          account?.address?.toLowerCase() === topPlayers[2].player.toLowerCase()
                            ? 'text-rhythmrush-gold' : 'text-white'
                        }`}
                        style={{ fontSize: 'clamp(10px, 2.5vw, 12px)' }}>
                          {account?.address?.toLowerCase() === topPlayers[2].player.toLowerCase() 
                            ? "You" : formatAddress(topPlayers[2].player)}
                        </p>
                        <p className="text-white font-black text-center mt-1"
                          style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}>
                          {topPlayers[2].score}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Scrollable List for Positions 4-10 */}
              {topPlayers.length > 3 && (
                <div className="overflow-y-auto max-h-[280px] space-y-2 scrollbar-hide">
                  {topPlayers.slice(3).map((player, index) => {
                    const actualIndex = index + 4; // Positions 4-10
                    const normalizedPlayerAddress = player.player.toLowerCase();
                    const normalizedAccountAddress = account?.address?.toLowerCase();
                    const isCurrentUser = normalizedAccountAddress === normalizedPlayerAddress;
                    
                    return (
                      <motion.div
                        key={`${normalizedPlayerAddress}-${player.score}-${player.timestamp}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                        className={`relative overflow-hidden bg-white/5 backdrop-blur-md border ${
                          isCurrentUser ? 'border-rhythmrush-gold border-2 shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'border-white/10'
                        }`}
                        style={{ 
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 relative z-10">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70 font-bold font-mono"
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
                              <p className="text-white/40 text-xs mt-0.5 font-mono">
                                {new Date(player.timestamp * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-white font-bold text-lg">
                              {player.score}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            </>
          )}
        </div>

        {/* Fixed Footer Area (Sticky Rank + Buttons) */}
        <div className="flex-shrink-0 px-6 pb-6 pt-2 bg-rhythmrush/95 backdrop-blur-sm z-20 border-t border-white/5">
          {/* Sticky User Rank (if outside top 10) */}
          {!isLoading && userRank && userRank.rank > 10 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="bg-rhythmrush-dark/90 backdrop-blur-md border border-rhythmrush-gold shadow-[0_0_20px_rgba(255,215,0,0.3)] rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rhythmrush-gold text-black font-bold font-mono text-sm">
                      {userRank.rank}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-rhythmrush-gold text-base">
                      You
                    </p>
                    <p className="text-white/40 text-xs mt-0.5 font-mono">
                      {new Date(userRank.entry.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-white font-bold text-lg">
                    {userRank.entry.score}
                  </p>
                  <p className="text-white/30 text-[10px] uppercase font-bold tracking-wider">Points</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchLeaderboard()}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.9497 7.05025C16.9497 7.05025 16.9497 7.05025 16.9497 7.05025C15.6373 5.73787 13.8755 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3V7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              REFRESH
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/submit-score')}
                className="bg-yellow-400 text-black font-bold text-sm sm:text-base py-3 px-2 rounded-xl shadow-lg hover:bg-yellow-300 transition-colors border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 whitespace-nowrap"
              >
                CLAIM REWARDS
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/play')}
                className="bg-white text-black font-bold py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-colors border-b-4 border-gray-300 active:border-b-0 active:translate-y-1"
              >
                BACK TO PLAY
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
}

