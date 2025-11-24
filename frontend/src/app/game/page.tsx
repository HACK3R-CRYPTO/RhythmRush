"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@/context/WalletContext";
import toast from 'react-hot-toast';
import IPhoneFrame from "@/components/iPhoneFrame";
import { motion } from "framer-motion";
import { client } from "@/client";
import { defineChain, getContract } from "thirdweb";
import { prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";

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
  const { account } = useWallet();
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
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const toneGeneratorsRef = useRef<{ [key: string]: () => void }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const gameDuration = 30000; // 30 seconds
  const BEAT_INTERVAL = 800; // Faster! (was 1200)

  const buttons = [1, 2, 3, 4];

  // Initialize audio files
  useEffect(() => {
    // Create audio elements for each button
    buttons.forEach((beat) => {
      const audio = new Audio();
      audio.src = `/sounds/button${beat}.mp3`;
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioRefs.current[`button${beat}`] = audio;
    });
    
    // Feedback sounds
    const perfectAudio = new Audio('/sounds/perfect.mp3');
    perfectAudio.preload = 'auto';
    perfectAudio.volume = 0.6;
    audioRefs.current['perfect'] = perfectAudio;
    
    const goodAudio = new Audio('/sounds/good.mp3');
    goodAudio.preload = 'auto';
    goodAudio.volume = 0.6;
    audioRefs.current['good'] = goodAudio;
    
    const missAudio = new Audio('/sounds/wrong.mp3');
    missAudio.preload = 'auto';
    missAudio.volume = 0.5;
    audioRefs.current['miss'] = missAudio;
    
    // Initialize audio context for tone generation
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.log('Audio context not available');
        }
      }
      return audioContextRef.current;
    };
    
    const generateTone = (frequency: number, duration: number = 0.1) => {
      return () => {
        try {
          const ctx = initAudioContext();
          if (!ctx) return;
          
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
          // Silently fail if audio not available
        }
      };
    };
    
    // Store tone generators as fallback (different frequencies for each button)
    toneGeneratorsRef.current['tone1'] = generateTone(440); // A4
    toneGeneratorsRef.current['tone2'] = generateTone(523.25); // C5
    toneGeneratorsRef.current['tone3'] = generateTone(659.25); // E5
    toneGeneratorsRef.current['tone4'] = generateTone(783.99); // G5
  }, []);

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

  const rewardsContract = getContract({
    client,
    chain,
    address: REWARDS_CONTRACT_ADDRESS
  });

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

    // Beat interval - change target every BEAT_INTERVAL ms
    beatIntervalRef.current = setInterval(() => {
      setCurrentTarget((prev) => {
        const next = (prev % 4) + 1;
        targetStartTimeRef.current = Date.now(); // Update when new target starts
        // Play sound when target changes (visual cue)
        playSound(`button${next}`);
        return next;
      });
    }, BEAT_INTERVAL);

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
    if (!account) {
      // Store score in sessionStorage if wallet not connected
      sessionStorage.setItem('rhythmRush_score', finalScore.toString());
      sessionStorage.setItem('rhythmRush_score_timestamp', Date.now().toString());
      router.push(returnUrl);
      return;
    }

    try {
      setIsSubmitting(true);

      const submitTx = prepareContractCall({
        contract: rewardsContract,
        method: "function submitScore(uint256)",
        params: [BigInt(finalScore)],
      });

      const { transactionHash } = await sendTransaction({
        account,
        transaction: submitTx,
      });

      await waitForReceipt({
        client,
        chain,
        transactionHash,
      });

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

  const playSound = (soundName: string) => {
    try {
      const audio = audioRefs.current[soundName];
      if (audio && typeof audio.play === 'function') {
        // Try to play audio file
        audio.currentTime = 0;
        audio.play().catch(() => {
          // If file doesn't exist or fails, try tone fallback
          const buttonNum = soundName.replace('button', '');
          if (buttonNum && toneGeneratorsRef.current[`tone${buttonNum}`]) {
            const toneFunc = toneGeneratorsRef.current[`tone${buttonNum}`];
            if (typeof toneFunc === 'function') {
              toneFunc();
            }
          }
        });
      } else {
        // Fallback to tone if audio file not found
        const buttonNum = soundName.replace('button', '');
        if (buttonNum && toneGeneratorsRef.current[`tone${buttonNum}`]) {
          const toneFunc = toneGeneratorsRef.current[`tone${buttonNum}`];
          if (typeof toneFunc === 'function') {
            toneFunc();
          }
        }
      }
    } catch (e) {
      // Silently fail if audio not available
    }
  };

  const handleButtonClick = useCallback((clickedBeat: number) => {
    if (!gameActive) return;

    // Play button tap sound
    playSound(`button${clickedBeat}`);

    // User should click the CURRENT glowing button (currentTarget)
    const timeSinceTargetStart = Date.now() - targetStartTimeRef.current;
    
    // Perfect timing window: 0-400ms after target starts
    // Good timing window: 400-700ms after target starts
    // Miss: wrong button or too late
    
    if (clickedBeat === currentTarget) {
      if (timeSinceTargetStart <= 400) {
        // Perfect timing - clicked quickly after target appeared
        playSound('perfect');
        setScore((prev) => {
          const newScore = prev + 10;
          scoreRef.current = newScore; // Update ref with latest score
          return newScore;
        });
        setFeedback("Perfect! +10");
        setFeedbackType("perfect");
      } else if (timeSinceTargetStart <= 700) {
        // Good timing - clicked within window but not perfect
        playSound('good');
        setScore((prev) => {
          const newScore = prev + 5;
          scoreRef.current = newScore; // Update ref with latest score
          return newScore;
        });
        setFeedback("Good! +5");
        setFeedbackType("good");
      } else {
        // Too late - target is about to change
        playSound('miss');
        setFeedback("Too late! Tap faster!");
        setFeedbackType("miss");
      }
    } else {
      // Wrong button
      playSound('miss');
      setFeedback("Miss! Tap the glowing button!");
      setFeedbackType("miss");
    }

    setTimeout(() => {
      setFeedback("");
      setFeedbackType("");
    }, 800);
  }, [gameActive, currentTarget]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle keyboard input when game is active
      if (!gameActive) return;

      // Prevent default behavior for game keys
      const key = event.key;
      
      // Map keys to buttons: 1,2,3,4 or Arrow keys or WASD
      let buttonNumber: number | null = null;
      
      if (key === '1' || key === 'ArrowLeft' || key === 'a' || key === 'A') {
        buttonNumber = 1;
      } else if (key === '2' || key === 'ArrowUp' || key === 'w' || key === 'W') {
        buttonNumber = 2;
      } else if (key === '3' || key === 'ArrowRight' || key === 'd' || key === 'D') {
        buttonNumber = 3;
      } else if (key === '4' || key === 'ArrowDown' || key === 's' || key === 'S') {
        buttonNumber = 4;
      }

      // If valid key pressed, trigger button click
      if (buttonNumber !== null) {
        event.preventDefault();
        handleButtonClick(buttonNumber);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameActive, handleButtonClick]);

  useEffect(() => {
    return () => {
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, []);

  const statusBarContent = (
    <>
      <div className="status-bar-item flex items-center gap-1">
        <button 
          onClick={() => router.push('/play')}
          className="flex items-center justify-center w-8 h-8 -ml-1 text-white hover:text-rhythmrush-gold transition-colors z-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="status-indicator bg-green-400"></div>
        <div className="font-bold text-sm">RhythmRush</div>
      </div>
      <div className="status-bar-item font-bold text-sm">9:41</div>
    </>
  );

  return (
    <IPhoneFrame 
      backgroundClassName="bg-gradient-to-br from-[#7B61FF] to-[#5d4ed3]" 
      statusBarContent={statusBarContent}
    >
      <div className="w-full h-full flex flex-col pt-12 pb-8 px-4 justify-between">
        {/* Header */}
        <div className="w-full text-center flex-shrink-0">
          <h1 className="font-bold text-white drop-shadow-lg mb-2 text-2xl">
            🎵 RhythmRush 🎵
          </h1>
          
          <div className="mb-4">
            <div className="font-bold text-yellow-400 drop-shadow-lg text-5xl mb-1">
              {score}
            </div>
            <div className="text-yellow-400 text-lg">
              {timeRemaining}s
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full mx-auto overflow-hidden w-[85%] max-w-[320px] h-1.5 mb-4">
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
            transition={{ duration: 0.2 }}
            className="font-bold text-white drop-shadow-lg text-3xl mt-2"
          >
            Tap {currentTarget}!
          </motion.div>
        </div>

        {/* Buttons Section */}
        <div className="w-full flex-shrink-0 px-2">
          <div className="grid grid-cols-4 gap-3 mx-auto max-w-[360px]">
            {buttons.map((beat) => (
              <motion.button
                key={beat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleButtonClick(beat)}
                className={`
                  aspect-square rounded-full border-4
                  flex items-center justify-center font-bold text-white text-xl
                  transition-all duration-75 w-full shadow-lg
                  ${beat === currentTarget 
                    ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_25px_rgba(255,215,0,0.8)] animate-pulse scale-105' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }
                  ${feedbackType === "perfect" && beat === currentTarget ? "bg-green-500 border-green-500 scale-110" : ""}
                  ${feedbackType === "miss" && beat === currentTarget ? "bg-red-500 border-red-500" : ""}
                `}
              >
                {beat}
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <div className="h-8 mt-4 flex items-center justify-center">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center font-bold text-lg ${
                  feedbackType === "perfect" ? "text-green-400" :
                  feedbackType === "good" ? "text-yellow-400" :
                  "text-red-400"
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full flex-shrink-0 px-4">
          {!gameActive ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startGame}
              className="w-full mx-auto bg-yellow-400 text-black font-bold rounded-xl shadow-lg py-4 text-lg max-w-[340px] block"
            >
              START GAME
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={endGame}
              className="w-full mx-auto bg-white/20 text-white font-bold rounded-xl shadow-lg py-4 text-lg max-w-[340px] block backdrop-blur-sm border border-white/10"
            >
              END GAME
            </motion.button>
          )}

          {/* Instructions or Game Over */}
          {!gameActive && score === 0 && (
            <div className="text-white/90 text-center mx-auto leading-relaxed mt-4 text-xs max-w-[360px]">
              <p><span className="text-yellow-400 font-bold">How to Play:</span></p>
              <p className="mt-1">Tap the <span className="text-yellow-400 font-bold">glowing button</span>!</p>
              <p className="mt-1">Perfect (0-400ms) = 10 pts</p>
              <p className="mt-1">Good (400-700ms) = 5 pts</p>
              <p className="mt-2 pt-2 border-t border-white/20">
                <span className="text-yellow-400 font-bold">Controls:</span> 1-4, Arrows, or WASD
              </p>
            </div>
          )}
          {!gameActive && score > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mt-4"
            >
              <p className="font-bold text-yellow-400 mb-1 text-xl">
                Game Over!
              </p>
              <p className="text-white text-lg">
                Score: <span className="text-yellow-400 font-bold">{score}</span>
              </p>
              <p className="text-white/50 text-xs mt-1">
                Submitting score...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </IPhoneFrame>
  );
}
