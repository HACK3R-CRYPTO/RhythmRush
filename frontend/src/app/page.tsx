"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import IPhoneFrame from "@/components/iPhoneFrame";

const GEM_POSITIONS = [
  { x: 77, y: 115 },
  { x: 147, y: 541 },
  { x: 366, y: 583 },
  { x: 349, y: 331 },
  { x: 183, y: 284 },
  { x: 129, y: 727 }
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      router.replace('/wallet-connect');
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleSkip = () => {
    console.log("Tap to skip clicked");
    setLoading(false);
    console.log("Calling router.replace('/wallet-connect')");
    router.replace('/wallet-connect');
  };

  return (
    <IPhoneFrame backgroundClassName="bg-rhythmrush">
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {/* Animated background gems - Increased count and variance */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * 350,
                y: Math.random() * 700,
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                scale: [0, 1, 1, 0],
                rotate: [0, 180, 360],
                y: [null, Math.random() * 100 - 50] // Random movement
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
            >
              <div className="w-[60px] h-[60px] bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full opacity-30 shadow-[0_0_30px_rgba(255,215,0,0.3)] blur-sm"></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 w-full">
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.3
            }}
            className="mb-10 relative"
          >
            {/* Pulsing glow behind logo */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-rhythmrush-gold rounded-full blur-2xl"
            />
            
            <div className="relative w-[140px] h-[140px] bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20"
              style={{ width: 'clamp(120px, 30vw, 150px)', height: 'clamp(120px, 30vw, 150px)' }}>
              <span className="text-6xl drop-shadow-md" style={{ fontSize: 'clamp(48px, 12vw, 64px)' }}>🎵</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="font-black mb-2 tracking-tight" style={{ fontSize: 'clamp(40px, 10vw, 56px)' }}>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-rhythmrush-gold drop-shadow-lg"
              >
                RHYTHM
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="text-white drop-shadow-lg"
              >
                {" "}RUSH
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-white/90 font-medium tracking-wide"
              style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}
            >
              Play. Earn. Win.
            </motion.p>
          </motion.div>

          {/* Loading Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mb-8"
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 bg-rhythmrush-gold rounded-full"
                />
              ))}
            </div>
          </motion.div>

          {/* Tap to Start Button - More prominent */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            onClick={handleSkip}
            className="group relative px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="text-white font-bold tracking-wider uppercase flex items-center gap-2">
              Tap to Start
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </motion.button>
        </div>
      </div>
    </IPhoneFrame>
  );
}
