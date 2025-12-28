'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/game';

export function DiceOverlay() {
    const { isRolling, pendingTurn, completeTurn } = useGameStore();
    const [showResult, setShowResult] = useState(false);
    const [randomVal, setRandomVal] = useState(0);

    // Target value from the server verdict
    const targetValue = pendingTurn?.verdict?.dice_roll || 0;

    useEffect(() => {
        if (isRolling) {
            setShowResult(false);
            // Glitch effect: cycle pure random numbers
            const interval = setInterval(() => {
                setRandomVal(Math.floor(Math.random() * 100) + 1);
            }, 50);

            // Stop after 2 seconds
            const timeout = setTimeout(() => {
                clearInterval(interval);
                setShowResult(true);

                // Auto-complete (close overlay) after showing result
                setTimeout(() => {
                    completeTurn();
                }, 1500);

            }, 2000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [isRolling, completeTurn]);

    return (
        <AnimatePresence>
            {isRolling && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none"
                >
                    <div className="relative flex flex-col items-center justify-center">
                        {/* HACKER CIRCLE RINGS */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute w-64 h-64 border border-green-500/30 rounded-full border-dashed"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            className="absolute w-80 h-80 border border-green-500/10 rounded-full"
                        />

                        {/* D20 WIREFRAME SVG */}
                        <motion.svg
                            width="180"
                            height="180"
                            viewBox="0 0 100 100"
                            className="drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                            animate={{
                                rotateY: [0, 360, 720, 1080],
                                scale: [0.8, 1.2, 1]
                            }}
                            transition={{ duration: 2, ease: "anticipate" }}
                        >
                            {/* Simplified Hexagon/Icosahedron Projection */}
                            <motion.path
                                d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <motion.path
                                d="M50 5 L50 50 M90 25 L50 50 M90 75 L50 50 M50 95 L50 50 M10 75 L50 50 M10 25 L50 50"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="1"
                                className="opacity-50"
                            />
                            <motion.path
                                d="M10 25 L90 25 L50 95 Z"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="0.5"
                                className="opacity-30"
                            />
                        </motion.svg>

                        {/* NUMBER DISPLAY */}
                        <motion.div
                            className="absolute text-5xl font-bold font-mono text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                        >
                            {showResult ? targetValue : randomVal}
                        </motion.div>

                        {/* STATUS TEXT */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-12 text-green-500/70 text-sm tracking-[0.2em] font-mono animate-pulse"
                        >
                            {showResult ? "> CALCULATION COMPLETE" : "> GENERATING ENTROPY..."}
                        </motion.div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
