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

const BUTTON_COLORS = ["red", "blue", "green", "yellow"];

export default function SimonGamePage() {
  const router = useRouter();
  const account = useActiveAccount();
  const returnUrl = '/submit-score';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [gamePattern, setGamePattern] = useState<string[]>([]);
  const [userPattern, setUserPattern] = useState<string[]>([]);
  const [sequencesCompleted, setSequencesCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  
  const scoreRef = useRef<number>(0);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const sequenceTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize audio files
  useEffect(() => {
    BUTTON_COLORS.forEach(color => {
      audioRefs.current[color] = new Audio(`/sounds/${color}.mp3`);
    });
    audioRefs.current['wrong'] = new Audio('/sounds/wrong.mp3');
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      sequenceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const playSound = (color: string) => {
    const audio = audioRefs.current[color];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently fail - game continues without sound
      });
    }
  };

  const animateButton = (color: string) => {
    const button = document.getElementById(color);
    if (button) {
      button.classList.add('pressed');
      setTimeout(() => {
        button.classList.remove('pressed');
      }, 150);
    }
  };

  const showSequence = (pattern: string[]) => {
    if (pattern.length === 0) return;
    
    setIsShowingSequence(true);
    setUserPattern([]); // Reset user pattern
    
    console.log('Showing sequence:', pattern, 'Game active:', gameActive);
    
    // Flash each button ONE AT A TIME using setTimeout chaining
    pattern.forEach((color, index) => {
      const timeout = setTimeout(() => {
        const button = document.getElementById(color);
        console.log(`Flashing button ${index + 1}/${pattern.length}:`, color, button ? 'found' : 'NOT FOUND', 'Game active:', gameActive);
        
        if (button) {
          // Force remove any existing classes that might interfere
          button.classList.remove('pressed');
          
          // Remove opacity class that makes buttons dim during sequence
          button.classList.remove('opacity-50');
          
          // Make button flash VERY brightly and visibly
          // Use direct style assignment to override everything
          button.style.cssText = `
            opacity: 0.2 !important;
            filter: brightness(5) saturate(2) !important;
            transform: scale(1.2) !important;
            box-shadow: 0 0 50px white, 0 0 80px rgba(255,255,255,1), inset 0 0 30px rgba(255,255,255,0.8) !important;
            z-index: 100 !important;
            transition: all 200ms ease-in-out !important;
          `;
          playSound(color);
          
          console.log('Button flashed:', color, button.style.cssText);
          
          // Flash back to normal after visible flash
          setTimeout(() => {
            if (button) {
              // Restore normal styles
              button.style.cssText = `
                opacity: 1 !important;
                filter: brightness(1) saturate(1) !important;
                transform: scale(1) !important;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
                z-index: 1 !important;
                transition: all 200ms ease-in-out !important;
              `;
              
              // Re-add opacity class if sequence is still showing
              if (isShowingSequence) {
                button.classList.add('opacity-50');
              }
            }
          }, 600);
        } else {
          console.error('Button not found:', color);
        }
      }, index * 1000); // 1000ms (1 second) delay between each button flash
      
      sequenceTimeoutsRef.current.push(timeout);
    });
    
    // Allow user input after entire sequence is shown
    const finalTimeout = setTimeout(() => {
      console.log('Sequence complete, allowing user input');
      setIsShowingSequence(false);
    }, pattern.length * 1000 + 800);
    sequenceTimeoutsRef.current.push(finalTimeout);
  };

  const nextSequence = () => {
    // Add one new random color to the pattern
    const randomColor = BUTTON_COLORS[Math.floor(Math.random() * BUTTON_COLORS.length)];
    const newPattern = [...gamePattern, randomColor];
    setGamePattern(newPattern);

    console.log('Next sequence, pattern:', newPattern);

    // Show the FULL sequence replay immediately (all buttons, one at a time)
    // Small delay to ensure state is updated
    setTimeout(() => {
      showSequence(newPattern);
    }, 100);
  };

  const checkAnswer = (currentUserPattern: string[]) => {
    const currentIndex = currentUserPattern.length - 1;
    
    // Check if the clicked color matches the expected color at this position
    if (gamePattern[currentIndex] === currentUserPattern[currentIndex]) {
      // If user has completed the full sequence
      if (currentUserPattern.length === gamePattern.length) {
        // Correct sequence completed!
        const newSequences = sequencesCompleted + 1;
        setSequencesCompleted(newSequences);
        
        // Calculate score: sequences completed * 10 + speed bonus
        const timeElapsed = Date.now() - startTime;
        const speedBonus = Math.max(0, Math.floor((60000 - timeElapsed) / 1000)); // Bonus for speed
        const newScore = newSequences * 10 + speedBonus;
        
        scoreRef.current = newScore;
        setScore(newScore);
        
        // Start next sequence immediately
        setTimeout(() => {
          nextSequence();
        }, 500);
      }
      // Otherwise, wait for next click
    } else {
      // Wrong answer - game over
      handleGameOver();
    }
  };

  const handleGameOver = () => {
    playSound('wrong');
    setGameOver(true);
    setGameActive(false);
    setIsShowingSequence(false);
    setScoreSubmitted(false); // Reset submission status
    
    // Clear all timeouts
    sequenceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    sequenceTimeoutsRef.current = [];
    
    // Submit score after showing game over
    setTimeout(() => {
      submitScoreToBlockchain(scoreRef.current);
    }, 1500);
  };

  const handleButtonClick = (color: string) => {
    if (!gameActive || isShowingSequence || gameOver) return;

    const newUserPattern = [...userPattern, color];
    setUserPattern(newUserPattern);
    
    playSound(color);
    animateButton(color);
    
    // Check answer immediately
    checkAnswer(newUserPattern);
  };

  const startGame = () => {
    // Don't allow starting if score hasn't been submitted after game over
    if (gameOver && !scoreSubmitted) {
      return;
    }
    
    // Reset all game state
    setGamePattern([]);
    setUserPattern([]);
    setSequencesCompleted(0);
    setScore(0);
    setGameOver(false);
    setScoreSubmitted(false);
    setGameActive(true);
    setIsShowingSequence(false);
    setStartTime(Date.now());
    scoreRef.current = 0;
    
    // Clear all timeouts
    sequenceTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    sequenceTimeoutsRef.current = [];
    
    // Start first sequence immediately (no delay)
    nextSequence();
  };

  const submitScoreToBlockchain = async (finalScore: number) => {
    console.log('Submitting score:', finalScore);
    setIsSubmitting(true);
    
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
      // Store score in sessionStorage for later submission
      sessionStorage.setItem('rhythmRush_score', finalScore.toString());
      sessionStorage.setItem('rhythmRush_score_timestamp', Date.now().toString());
      setScoreSubmitted(true); // Mark as submitted
      setIsSubmitting(false);
      // Redirect after delay
      setTimeout(() => {
        router.push(returnUrl);
      }, 2000);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const rewardsContract = new ethers.Contract(REWARDS_CONTRACT_ADDRESS, REWARDS_ABI, provider);
      const rewardsWithSigner = rewardsContract.connect(signer);

      const tx = await rewardsWithSigner.submitScore(finalScore);
      await tx.wait();

      toast.success(`Score of ${finalScore} submitted! 🎉`, {
        duration: 3000
      });

      sessionStorage.removeItem('rhythmRush_score');
      sessionStorage.removeItem('rhythmRush_score_timestamp');
      setScoreSubmitted(true); // Mark as submitted
      
      // Redirect after showing success
      setTimeout(() => {
        router.push(returnUrl);
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting score:", error);
      toast.error(error?.message || "Failed to submit score");
      // Store score for manual submission
      sessionStorage.setItem('rhythmRush_score', finalScore.toString());
      sessionStorage.setItem('rhythmRush_score_timestamp', Date.now().toString());
      setScoreSubmitted(true); // Mark as submitted (will be done manually)
      // Redirect to submit page
      setTimeout(() => {
        router.push(returnUrl);
      }, 2000);
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
    <IPhoneFrame backgroundClassName="bg-transparent" statusBarContent={statusBarContent}>
      <div 
        className="w-full overflow-hidden relative flex flex-col items-center justify-center"
        style={{ 
          height: 'calc(100% - 44px)', 
          marginTop: '44px',
          padding: 'clamp(8px, 2vh, 16px)',
          background: 'linear-gradient(135deg, #011F3F 0%, #001122 100%)',
          minHeight: '100%'
        }}
      >
        {/* Title */}
        <h1 
          className="text-white font-bold mb-2 text-center"
          style={{ 
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontFamily: "'Press Start 2P', monospace",
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {gameOver 
            ? `Game Over!` 
            : gameActive 
              ? isShowingSequence 
                ? `Watch...` 
                : `Your Turn!` 
              : 'Simon Game'}
        </h1>

        {/* Score Display */}
        {gameActive && (
          <div className="text-yellow-400 font-bold mb-2" style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}>
            Score: {score} | Sequences: {sequencesCompleted}
          </div>
        )}

        {/* Game Container */}
        <div className="grid grid-cols-2 gap-3 max-w-[320px] w-full mb-4">
          {BUTTON_COLORS.map((color) => (
            <motion.button
              key={color}
              id={color}
              onClick={() => handleButtonClick(color)}
              disabled={!gameActive || isShowingSequence || gameOver}
              whileHover={gameActive && !isShowingSequence && !gameOver ? { scale: 1.05 } : {}}
              whileTap={gameActive && !isShowingSequence && !gameOver ? { scale: 0.95 } : {}}
              animate={isShowingSequence ? {} : {}}
              className={`
                aspect-square rounded-3xl border-4 border-black
                ${color === 'red' ? 'bg-red-500' : ''}
                ${color === 'blue' ? 'bg-blue-500' : ''}
                ${color === 'green' ? 'bg-green-500' : ''}
                ${color === 'yellow' ? 'bg-yellow-400' : ''}
                ${!gameActive || gameOver ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer'}
              `}
              style={{
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                position: 'relative',
                zIndex: 1
              }}
            />
          ))}
        </div>

        {/* Status Message */}
        {isShowingSequence && (
          <div className="text-white/90 mb-2 text-center font-bold" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
            Watch the sequence...
          </div>
        )}
        {gameActive && !isShowingSequence && !gameOver && (
          <div className="text-green-400 mb-2 text-center font-bold" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
            Repeat the sequence!
          </div>
        )}

        {/* Instructions */}
        {!gameActive && !gameOver && (
          <div className="mt-4 text-white/80 text-center px-4" style={{ fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
            <p className="mb-1">Watch the sequence flash</p>
            <p>Repeat it as fast as you can!</p>
            <p className="mt-2 text-yellow-400">Score = Sequences × 10 + Speed Bonus</p>
          </div>
        )}

        {/* Start/Game Over Button */}
        <div className="mt-4 w-full max-w-[320px]">
          {!gameActive && !gameOver && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startGame}
              className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl shadow-lg"
              style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}
            >
              START GAME
            </motion.button>
          )}
          
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-red-400 font-bold mb-2" style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}>
                Game Over!
              </p>
              <p className="text-white mb-2" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                Final Score: {score} points
              </p>
              <p className="text-white/80 mb-4 text-sm">
                Sequences Completed: {sequencesCompleted}
              </p>
              
              {isSubmitting && (
                <div className="mb-4">
                  <p className="text-yellow-400 text-sm mb-2 font-bold">Submitting score...</p>
                  <p className="text-white/60 text-xs">Please wait...</p>
                </div>
              )}
              
              {!isSubmitting && !scoreSubmitted && (
                <div className="mb-4">
                  <p className="text-yellow-400 text-sm mb-2 font-bold">Submitting score...</p>
                  <p className="text-white/60 text-xs">Please wait...</p>
                </div>
              )}
              
              {scoreSubmitted && (
                <div className="mb-4">
                  <p className="text-green-400 text-sm mb-2 font-bold">✓ Score submitted!</p>
                  <p className="text-white/60 text-xs">Redirecting...</p>
                </div>
              )}
              
              {!isSubmitting && !scoreSubmitted && (
                <motion.button
                  disabled={true}
                  className="w-full bg-gray-500 text-white font-bold py-3 rounded-xl shadow-lg opacity-50 cursor-not-allowed"
                  style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}
                >
                  Wait for Score Submission...
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pressed {
          opacity: 0.5 !important;
          transform: scale(0.95);
          box-shadow: 0 0 20px white !important;
        }
        button[id] {
          transition: opacity 200ms ease-in-out, filter 200ms ease-in-out;
        }
      `}</style>
    </IPhoneFrame>
  );
}
