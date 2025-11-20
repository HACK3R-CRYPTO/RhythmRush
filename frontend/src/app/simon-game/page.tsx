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
  const [gamePattern, setGamePattern] = useState<string[]>([]);
  const [userPattern, setUserPattern] = useState<string[]>([]);
  const [level, setLevel] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const scoreRef = useRef<number>(0);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Initialize audio files
  useEffect(() => {
    BUTTON_COLORS.forEach(color => {
      audioRefs.current[color] = new Audio(`/sounds/${color}.mp3`);
    });
    audioRefs.current['wrong'] = new Audio('/sounds/wrong.mp3');
  }, []);

  const playSound = (color: string) => {
    const audio = audioRefs.current[color];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => console.error('Audio play failed:', err));
    }
  };

  const animateButton = (color: string) => {
    const button = document.getElementById(color);
    if (button) {
      button.classList.add('pressed');
      setTimeout(() => {
        button.classList.remove('pressed');
      }, 200);
    }
  };

  const nextSequence = () => {
    setIsShowingSequence(true);
    setUserPattern([]);
    const newLevel = level + 1;
    setLevel(newLevel);
    
    // Score is based on level reached
    scoreRef.current = newLevel * 10; // 10 points per level
    
    const randomColor = BUTTON_COLORS[Math.floor(Math.random() * 4)];
    const newPattern = [...gamePattern, randomColor];
    setGamePattern(newPattern);

    // Show sequence with delay between each button
    newPattern.forEach((color, index) => {
      setTimeout(() => {
        const button = document.getElementById(color);
        if (button) {
          button.style.opacity = '0.5';
          playSound(color);
          setTimeout(() => {
            button.style.opacity = '1';
          }, 200);
        }
      }, (index + 1) * 600);
    });

    setTimeout(() => {
      setIsShowingSequence(false);
    }, newPattern.length * 600 + 300);
  };

  const checkAnswer = (index: number) => {
    if (gamePattern[index] === userPattern[index]) {
      if (userPattern.length === gamePattern.length) {
        // Correct sequence completed
        setTimeout(() => {
          nextSequence();
        }, 1000);
      }
    } else {
      // Wrong answer
      playSound('wrong');
      setGameOver(true);
      setGameActive(false);
      
      // Submit score after showing game over
      setTimeout(() => {
        submitScoreToBlockchain(scoreRef.current);
      }, 2000);
    }
  };

  const handleButtonClick = (color: string) => {
    if (!gameActive || isShowingSequence || gameOver) return;

    const newUserPattern = [...userPattern, color];
    setUserPattern(newUserPattern);
    
    playSound(color);
    animateButton(color);
    checkAnswer(newUserPattern.length - 1);
  };

  const startGame = () => {
    setGamePattern([]);
    setUserPattern([]);
    setLevel(0);
    setGameOver(false);
    setGameActive(true);
    scoreRef.current = 0;
    nextSequence();
  };

  const submitScoreToBlockchain = async (finalScore: number) => {
    if (!account || !(typeof window !== 'undefined' && (window as any).ethereum)) {
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

      sessionStorage.removeItem('rhythmRush_score');
      sessionStorage.removeItem('rhythmRush_score_timestamp');
      
      router.push(returnUrl);
    } catch (error: any) {
      console.error("Error submitting score:", error);
      toast.error(error?.message || "Failed to submit score");
      sessionStorage.setItem('rhythmRush_score', finalScore.toString());
      sessionStorage.setItem('rhythmRush_score_timestamp', Date.now().toString());
      router.push(returnUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBarContent = (
    <>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400"></div>
        <div className="text-white text-xs">RhythmRush</div>
      </div>
      <div className="text-white text-xs">9:41</div>
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
          className="text-white font-bold mb-4 text-center"
          style={{ 
            fontSize: 'clamp(20px, 5vw, 28px)',
            fontFamily: "'Press Start 2P', monospace",
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {gameOver 
            ? `Game Over! Level ${level}` 
            : gameActive 
              ? `Level ${level}` 
              : 'Press Start'}
        </h1>

        {/* Score Display */}
        {gameActive && (
          <div className="text-yellow-400 font-bold mb-4" style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}>
            Score: {scoreRef.current}
          </div>
        )}

        {/* Game Container */}
        <div className="grid grid-cols-2 gap-3 max-w-[320px] w-full">
          {BUTTON_COLORS.map((color) => (
            <motion.button
              key={color}
              id={color}
              onClick={() => handleButtonClick(color)}
              disabled={!gameActive || isShowingSequence || gameOver}
              whileHover={gameActive && !isShowingSequence && !gameOver ? { scale: 1.05 } : {}}
              whileTap={gameActive && !isShowingSequence && !gameOver ? { scale: 0.95 } : {}}
              className={`
                aspect-square rounded-3xl border-4 border-black
                transition-all duration-200
                ${color === 'red' ? 'bg-red-500' : ''}
                ${color === 'blue' ? 'bg-blue-500' : ''}
                ${color === 'green' ? 'bg-green-500' : ''}
                ${color === 'yellow' ? 'bg-yellow-400' : ''}
                ${!gameActive || isShowingSequence || gameOver ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer'}
              `}
              style={{
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            />
          ))}
        </div>

        {/* Instructions */}
        {!gameActive && !gameOver && (
          <div className="mt-6 text-white/80 text-center px-4" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
            <p className="mb-2">Watch the sequence and repeat it!</p>
            <p>Each level adds one more color.</p>
          </div>
        )}

        {/* Start/Game Over Button */}
        <div className="mt-6 w-full max-w-[320px]">
          {!gameActive && (
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
              <p className="text-white mb-4" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                Final Score: {scoreRef.current} points
              </p>
              {isSubmitting && (
                <p className="text-yellow-400 text-sm">Submitting score...</p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pressed {
          opacity: 0.5 !important;
          transform: scale(0.95);
        }
      `}</style>
    </IPhoneFrame>
  );
}

