"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@/context/WalletContext";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import IPhoneFrame from "@/components/iPhoneFrame";

const REWARDS_CONTRACT_ADDRESS = "0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280";

const REWARDS_ABI = [
  {
    inputs: [{ name: "score", type: "uint256" }],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "playerScores",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "minScoreThreshold",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

export default function SubmitScorePage() {
  const router = useRouter();
  const { account } = useWallet();
  
  // Remove any score params from URL if someone tries to pass them
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('score=')) {
      // Remove score param from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('score');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  const [score, setScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [minThreshold, setMinThreshold] = useState<number>(10);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [thresholdLoaded, setThresholdLoaded] = useState(false);

  // Get score from sessionStorage (secure, not from URL)
  const getScoreFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedScore = sessionStorage.getItem('rhythmRush_score');
      const timestamp = sessionStorage.getItem('rhythmRush_score_timestamp');
      
      // Score must be recent (within 5 minutes) to prevent replay attacks
      if (storedScore && timestamp) {
        const scoreAge = Date.now() - parseInt(timestamp);
        if (scoreAge < 5 * 60 * 1000) { // 5 minutes
          return storedScore;
        } else {
          // Clear old score
          sessionStorage.removeItem('rhythmRush_score');
          sessionStorage.removeItem('rhythmRush_score_timestamp');
        }
      }
    }
    return "";
  };

  const scoreFromStorage = getScoreFromStorage();

  // Check if score came from sessionStorage (not URL)
  useEffect(() => {
    if (scoreFromStorage) {
      setScore(scoreFromStorage);
    }
  }, [scoreFromStorage]);

  useEffect(() => {
    if (account) {
      fetchPlayerScore();
      fetchMinThreshold().then(() => setThresholdLoaded(true));
    }
  }, [account]);

  const fetchPlayerScore = async () => {
    if (!account?.address || !(typeof window !== 'undefined' && (window as any).ethereum)) return;

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      const score = await rewardsContract.playerScores(account.address);
      setPlayerScore(Number(score));
    } catch (error) {
      console.error("Error fetching player score:", error);
    }
  };

  const fetchMinThreshold = async () => {
    if (!(typeof window !== 'undefined' && (window as any).ethereum)) return;

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      const threshold = await rewardsContract.minScoreThreshold();
      setMinThreshold(Number(threshold));
      return Number(threshold);
    } catch (error) {
      console.error("Error fetching threshold:", error);
      return 100; // Default threshold
    }
  };

  const handleSubmitScore = useCallback(async () => {
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
      toast.error("Please connect your wallet");
      return;
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < minThreshold) {
      toast.error(`Score must be at least ${minThreshold} points`);
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      const rewardsWithSigner = rewardsContract.connect(signer);

      const tx = await rewardsWithSigner.submitScore(scoreNum);
      await tx.wait();

      toast.success(`Score of ${scoreNum} submitted! 🎉`, {
        duration: 3000
      });

      setScore("");
      setHasAutoSubmitted(true);
      // Clear stored score after successful submission
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('rhythmRush_score');
        sessionStorage.removeItem('rhythmRush_score_timestamp');
      }
      fetchPlayerScore();
    } catch (error: any) {
      console.error("Error submitting score:", error);
      toast.error(error?.message || "Failed to submit score");
    } finally {
      setIsSubmitting(false);
    }
  }, [account, score, minThreshold, isSubmitting]);

  // Auto-submit score when coming from game (from sessionStorage, not URL)
  useEffect(() => {
    const scoreParam = scoreFromStorage;
    if (scoreParam && account && thresholdLoaded && !hasAutoSubmitted && !isSubmitting) {
      const scoreNum = parseInt(scoreParam);
      // Validate score is reasonable (max 1000 points)
      const MAX_REASONABLE_SCORE = 1000;
      if (!isNaN(scoreNum) && scoreNum >= minThreshold && scoreNum <= MAX_REASONABLE_SCORE) {
        // Small delay to ensure wallet is ready
        const timer = setTimeout(() => {
          handleSubmitScore();
        }, 1000);
        return () => clearTimeout(timer);
      } else if (!isNaN(scoreNum) && scoreNum < minThreshold) {
        toast.error(`Score ${scoreNum} is below minimum threshold of ${minThreshold} points`);
      } else if (!isNaN(scoreNum) && scoreNum > MAX_REASONABLE_SCORE) {
        toast.error("Invalid score detected. Please play again.");
        // Clear invalid score
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('rhythmRush_score');
          sessionStorage.removeItem('rhythmRush_score_timestamp');
        }
      }
    }
  }, [scoreFromStorage, account, thresholdLoaded, hasAutoSubmitted, isSubmitting, minThreshold, handleSubmitScore]);

  const handleClaimRewards = async () => {
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setIsSubmitting(true);
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      const rewardsWithSigner = rewardsContract.connect(signer);

      const tx = await rewardsWithSigner.claimRewards();
      await tx.wait();

      toast.success("Rewards claimed successfully! 🎉", {
        duration: 3000
      });

      fetchPlayerScore();
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      
      // Check for specific revert reasons
      const errorMessage = error?.message || "";
      const errorData = error?.data?.originalError?.data || error?.data?.message || "";
      
      if (errorMessage.includes("No prize pool available") || errorData.includes("No prize pool available")) {
        toast.error("Prize pool is currently empty. Please try again later! 🏦");
      } else {
        toast.error(error?.message || "Failed to claim rewards");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="content-container"
        >
          <div className="text-center">
            <h1 className="title-section">
              <span className="text-rhythmrush-gold">SUBMIT</span>
              <span className="text-white"> SCORE</span>
            </h1>
            {!scoreFromStorage && (
              <p className="text-white/80" style={{ fontSize: 'var(--text-base)' }}>
                Play the game to submit your score
              </p>
            )}
          </div>

          {/* Gem Flow Explanation */}
          {scoreFromStorage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6"
            >
              <p className="text-blue-300 font-semibold text-sm text-center mb-1">
                💎 Gem Required to Play
              </p>
              <p className="text-white/80 text-xs text-center">
                You need a Gem NFT to play. Mint one from the Mint page to start earning rewards!
              </p>
            </motion.div>
          )}

          {/* Show score from game if coming from game */}
          {scoreFromStorage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-blur"
            >
              <div className="text-center">
                <label className="text-white/80 text-sm mb-2 block">
                  Your Game Score
                </label>
                <div className="text-rhythmrush-gold font-bold text-5xl mb-2">
                  {scoreFromStorage}
                </div>
                {isSubmitting ? (
                  <p className="text-yellow-400 font-semibold text-sm mt-2">
                    ⏳ Submitting score to blockchain...
                  </p>
                ) : hasAutoSubmitted ? (
                  <p className="text-green-400 font-semibold text-sm mt-2">
                    ✅ Score submitted successfully!
                  </p>
                ) : parseInt(scoreFromStorage) < minThreshold ? (
                  <p className="text-red-400 font-semibold text-sm mt-2">
                    ⚠️ Score below minimum ({minThreshold} points)
                  </p>
                ) : (
                  <p className="text-white/60 text-sm">
                    Score will be automatically submitted
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Show best score if available */}
          {playerScore !== null && playerScore > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-blur"
            >
              <div className="flex justify-between items-center">
                <span className="text-white/80">Your Best Score:</span>
                <span className="text-rhythmrush-gold font-bold text-xl">{playerScore}</span>
              </div>
            </motion.div>
          )}

          {/* No manual input - scores must come from playing the game */}
          {!scoreFromStorage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6 mb-6"
            >
              <p className="text-yellow-300 font-semibold text-center mb-2">
                🎮 Play the Game to Submit Scores
              </p>
              <p className="text-white/80 text-sm text-center">
                Scores can only be submitted by playing the game. Go to the Play page to start a game session.
              </p>
            </motion.div>
          )}

          {/* Claim Rewards button */}
          {playerScore !== null && (playerScore as number) >= minThreshold && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClaimRewards}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ background: '#10B981' }}
            >
              {isSubmitting ? "Claiming..." : "CLAIM RUSH REWARDS"}
            </motion.button>
          )}

          <div className="space-y-3" style={{ marginTop: 'var(--spacing-md)' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/play')}
              className="btn-secondary"
            >
              BACK TO PLAY
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/leaderboard')}
              className="btn-secondary"
            >
              VIEW LEADERBOARD
            </motion.button>
          </div>
        </motion.div>
      </div>
    </IPhoneFrame>
  );
}

