"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import toast from 'react-hot-toast';
import IPhoneFrame from "@/components/iPhoneFrame";
import { motion } from "framer-motion";

const REWARDS_CONTRACT_ADDRESS = "0xC36b614D6e8Ef0dD5c50c8031a1ED0B7a7442280";

const REWARDS_ABI = [
  {
    inputs: [{ name: "score", type: "uint256" }],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

export default function GamePage() {
  const router = useRouter();
  const account = useActiveAccount();
  const returnUrl = '/submit-score'; // Always go to submit-score, no params
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [progress, setProgress] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"perfect" | "good" | "miss" | "">("");
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetStartTimeRef = useRef<number>(0); // When current target started glowing
  const scoreRef = useRef<number>(0); // Keep track of current score for closure
  const gameDuration = 30000; // 30 seconds

  const buttons = [1, 2, 3, 4];

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0; // Reset ref as well
    setGameActive(true);
    setTimeRemaining(30);
    setCurrentTarget(1);
    setFeedback("");
    setFeedbackType("");
    startTimeRef.current = Date.now();
    targetStartTimeRef.current = Date.now(); // Track when target 1 started glowing

    // Beat interval - change target every 1.2 seconds
    beatIntervalRef.current = setInterval(() => {
      setCurrentTarget((prev) => {
        const next = (prev % 4) + 1;
        targetStartTimeRef.current = Date.now(); // Update when new target starts
        return next;
      });
    }, 1200);

    // Game timer
    gameTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((gameDuration - elapsed) / 1000));
      const progressPercent = Math.min((elapsed / gameDuration) * 100, 100);
      
      setTimeRemaining(remaining);
      setProgress(progressPercent);

      if (elapsed >= gameDuration) {
        endGame();
      }
    }, 100);
  };

  const submitScoreToBlockchain = async (finalScore: number) => {
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
      // Store score in sessionStorage if wallet not connected
      sessionStorage.setItem('rhythmRush_score', finalScore.toString());
      sessionStorage.setItem('rhythmRush_score_timestamp', Date.now().toString());
      router.push(returnUrl);
      return;
    }

    try {
      setIsSubmitting(true);
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      const rewardsWithSigner = rewardsContract.connect(signer);

      const tx = await rewardsWithSigner.submitScore(finalScore);
      await tx.wait();

      toast.success(`Score of ${finalScore} submitted! 🎉`, {
        duration: 3000
      });

      // Clear any stored score
      sessionStorage.removeItem('rhythmRush_score');
      sessionStorage.removeItem('rhythmRush_score_timestamp');
      
      router.push(returnUrl);
    } catch (error: any) {
      console.error("Error submitting score:", error);
      toast.error(error?.message || "Failed to submit score");
      // Store score in sessionStorage as fallback
      sessionStorage.setItem('rhythmRush_score', finalScore.toString());
      sessionStorage.setItem('rhythmRush_score_timestamp', Date.now().toString());
      router.push(returnUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  const endGame = () => {
    setGameActive(false);
    setProgress(100);
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    
    // Get the final score from ref (always has latest value)
    const finalScore = scoreRef.current;
    
    // Validate score is reasonable (max possible: ~300 points in 30 seconds with perfect timing)
    // Allow some buffer for future game modes
    const MAX_REASONABLE_SCORE = 1000;
    if (finalScore > MAX_REASONABLE_SCORE) {
      toast.error("Invalid score detected. Please play again.");
      return;
    }
    
    // Submit score directly to blockchain (no URL params)
    setTimeout(() => {
      submitScoreToBlockchain(finalScore);
    }, 2000);
  };

  const handleButtonClick = (clickedBeat: number) => {
    if (!gameActive) return;

    // User should click the CURRENT glowing button (currentTarget)
    const timeSinceTargetStart = Date.now() - targetStartTimeRef.current;
    
    // Perfect timing window: 0-600ms after target starts
    // Good timing window: 600-1000ms after target starts
    // Miss: wrong button or too late
    
    if (clickedBeat === currentTarget) {
      if (timeSinceTargetStart <= 600) {
        // Perfect timing - clicked quickly after target appeared
        setScore((prev) => {
          const newScore = prev + 10;
          scoreRef.current = newScore; // Update ref with latest score
          return newScore;
        });
        setFeedback("Perfect! +10");
        setFeedbackType("perfect");
      } else if (timeSinceTargetStart <= 1000) {
        // Good timing - clicked within window but not perfect
        setScore((prev) => {
          const newScore = prev + 5;
          scoreRef.current = newScore; // Update ref with latest score
          return newScore;
        });
        setFeedback("Good! +5");
        setFeedbackType("good");
      } else {
        // Too late - target is about to change
        setFeedback("Too late! Tap faster!");
        setFeedbackType("miss");
      }
    } else {
      // Wrong button
      setFeedback("Miss! Tap the glowing button!");
      setFeedbackType("miss");
    }

    setTimeout(() => {
      setFeedback("");
      setFeedbackType("");
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, []);

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
    <IPhoneFrame backgroundClassName="bg-transparent" statusBarContent={statusBarContent}>
      <div 
        className="w-full overflow-hidden relative flex flex-col items-center"
        style={{ 
          height: 'calc(100% - 44px)', 
          marginTop: '44px',
          paddingTop: 'clamp(8px, 2vh, 16px)',
          paddingBottom: 'clamp(8px, 2vh, 16px)',
          paddingLeft: 'clamp(8px, 2vw, 16px)',
          paddingRight: 'clamp(8px, 2vw, 16px)',
          background: 'linear-gradient(135deg, #7B61FF 0%, #5d4ed3 100%)',
          gap: 'clamp(4px, 1vh, 12px)',
          justifyContent: 'space-between'
        }}
      >
        {/* Header */}
        <div className="w-full text-center flex-shrink-0" style={{ paddingTop: 'clamp(4px, 1vh, 8px)' }}>
          <h1 className="font-bold text-white drop-shadow-lg mb-1" style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}>
            🎵 RhythmRush 🎵
          </h1>
          
          <div style={{ marginBottom: 'clamp(4px, 1vh, 8px)' }}>
            <div className="font-bold text-yellow-400 drop-shadow-lg" style={{ fontSize: 'clamp(32px, 8vw, 48px)' }}>
              {score}
            </div>
            <div className="text-yellow-400" style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>
              {timeRemaining}s
            </div>
          </div>

          {/* Progress Bar */}
          <div 
            className="bg-white/20 rounded-full mx-auto overflow-hidden"
            style={{ 
              width: '85%',
              maxWidth: '320px',
              height: 'clamp(3px, 0.8vh, 6px)',
              marginBottom: 'clamp(4px, 1vh, 8px)'
            }}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Target Display */}
          <motion.div
            key={currentTarget}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3 }}
            className="font-bold text-white drop-shadow-lg"
            style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginTop: 'clamp(4px, 1vh, 8px)' }}
          >
            Tap {currentTarget}!
          </motion.div>
        </div>

        {/* Buttons Section */}
        <div className="w-full flex-shrink-0" style={{ paddingLeft: 'clamp(8px, 2vw, 16px)', paddingRight: 'clamp(8px, 2vw, 16px)' }}>
          <div 
            className="grid grid-cols-4 gap-2 mx-auto"
            style={{ maxWidth: '360px', width: '100%' }}
          >
            {buttons.map((beat) => (
              <motion.button
                key={beat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleButtonClick(beat)}
                className={`
                  aspect-square rounded-full border-2.5 border-white
                  flex items-center justify-center font-bold text-white
                  transition-all duration-100 w-full
                  ${beat === currentTarget 
                    ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.8)] animate-pulse' 
                    : 'bg-white/20 hover:bg-white/30'
                  }
                  ${feedbackType === "perfect" && beat === currentTarget ? "bg-green-500 border-green-500" : ""}
                  ${feedbackType === "miss" && beat === currentTarget ? "bg-red-500 border-red-500" : ""}
                `}
                style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}
              >
                {beat}
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center font-bold ${
                feedbackType === "perfect" ? "text-green-400" :
                feedbackType === "good" ? "text-yellow-400" :
                "text-red-400"
              }`}
              style={{ marginTop: 'clamp(8px, 2vh, 12px)', fontSize: 'clamp(12px, 3vw, 14px)' }}
            >
              {feedback}
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full flex-shrink-0" style={{ paddingLeft: 'clamp(8px, 2vw, 16px)', paddingRight: 'clamp(8px, 2vw, 16px)' }}>
          {!gameActive ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startGame}
              className="w-full mx-auto bg-yellow-400 text-black font-bold rounded-xl shadow-lg"
              style={{ 
                maxWidth: '340px',
                paddingTop: 'clamp(10px, 2.5vh, 14px)',
                paddingBottom: 'clamp(10px, 2.5vh, 14px)',
                fontSize: 'clamp(14px, 3.5vw, 16px)'
              }}
            >
              START GAME
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={endGame}
              className="w-full mx-auto bg-gray-500 text-white font-bold rounded-xl shadow-lg opacity-50"
              style={{ 
                maxWidth: '340px',
                paddingTop: 'clamp(10px, 2.5vh, 14px)',
                paddingBottom: 'clamp(10px, 2.5vh, 14px)',
                fontSize: 'clamp(14px, 3.5vw, 16px)'
              }}
            >
              END GAME
            </motion.button>
          )}

          {/* Instructions or Game Over */}
          {!gameActive && score === 0 && (
            <div 
              className="text-white/90 text-center mx-auto leading-relaxed"
              style={{ 
                marginTop: 'clamp(8px, 2vh, 12px)',
                paddingLeft: 'clamp(8px, 2vw, 16px)',
                paddingRight: 'clamp(8px, 2vw, 16px)',
                maxWidth: '360px',
                fontSize: 'clamp(10px, 2.5vw, 12px)'
              }}
            >
              <p><span className="text-yellow-400 font-bold">How to Play:</span></p>
              <p className="mt-1">Watch for the <span className="text-yellow-400 font-bold">glowing yellow button</span>!</p>
              <p className="mt-1">Tap the <span className="text-yellow-400 font-bold">glowing button</span> quickly to score points.</p>
              <p className="mt-1">Perfect timing (0-600ms) = 10 points</p>
              <p className="mt-1">Good timing (600-1000ms) = 5 points</p>
            </div>
          )}
          {!gameActive && score > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
              style={{ 
                marginTop: 'clamp(8px, 2vh, 12px)',
                paddingLeft: 'clamp(8px, 2vw, 16px)',
                paddingRight: 'clamp(8px, 2vw, 16px)'
              }}
            >
              <p className="font-bold text-yellow-400 mb-2" style={{ fontSize: 'clamp(18px, 4.5vw, 20px)' }}>
                Game Over!
              </p>
              <p className="text-white" style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>
                Final Score: <span className="text-yellow-400 font-bold">{score}</span> points
              </p>
              <p className="text-white/70 mt-2" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                Submitting score...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </IPhoneFrame>
  );
}
