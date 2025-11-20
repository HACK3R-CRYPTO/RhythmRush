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

  if (loading) {
  return (
      <IPhoneFrame backgroundClassName="bg-rhythmrush">
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: GEM_POSITIONS[i].x,
                y: GEM_POSITIONS[i].y,
                scale: 0,
                rotate: 0
              }}
              animate={{ 
                scale: [0, 1, 1, 0],
                rotate: [0, 180, 360],
                y: [GEM_POSITIONS[i].y, GEM_POSITIONS[i].y + 100]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            >
              <div className="w-[60px] h-[60px] bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full opacity-30 shadow-lg"></div>
            </motion.div>
          ))}
        </motion.div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.3
            }}
            className="mb-8"
            >
            <div className="w-[120px] h-[120px] bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-2xl animate-pulse flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold mb-2">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-rhythmrush-gold"
              >
                RHYTHM
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="text-white"
              >
                RUSH
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-white/80 text-lg mt-2"
            >
              Play. Earn. Win.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 bg-white rounded-full"
            />
          </motion.div>
        </div>
      </IPhoneFrame>
  );
  }

  return null;
}
