import React from 'react';
import { Activity, Server, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export function SplashScreen({ retryCount }) {
    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 text-gray-200 font-sans">
            <div className="relative mb-8">
                {/* Glow effect */}
                <div className="absolute -inset-8 bg-blue-600/20 blur-3xl rounded-full opacity-50 animate-pulse" />

                {/* Logo container */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="relative bg-gradient-to-br from-gray-800 to-black p-4 rounded-2xl border border-gray-700/50 shadow-2xl"
                >
                    <Activity className="h-10 w-10 text-blue-500" />
                </motion.div>
            </div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-2"
            >
                the-oops-bay
            </motion.h1>

            <div className="flex flex-col items-center h-16">
                <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                    <Server className="h-3 w-3" />
                    {retryCount === 0 ? "Connecting to server..." : `Retrying connection (${retryCount})...`}
                </p>

                {/* Progress Bar */}
                <div className="w-48 h-1 bg-gray-900 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-600"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>

            <div className="absolute bottom-8 text-[10px] text-gray-700 font-mono">
                <ShieldCheck className="inline h-3 w-3 mr-1 mb-0.5" />
                SECURE LOCAL ENVIRONMENT
            </div>
        </div>
    );
}