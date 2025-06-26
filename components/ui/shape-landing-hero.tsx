// @ts-nocheck
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

function HeroGeometric({
    badge = "Design Collective",
    title1 = "Keep Track Of Sui Ecosystem",
}: {
    badge?: string;
    title1?: string;
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1],
            },
        }),
    };

    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative md:min-h-[60vh] min-h-[50vh] w-screen flex items-center justify-center overflow-hidden bg-[#030303]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] via-transparent to-cyan-500/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-blue-500/[0.15]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-cyan-500/[0.15]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-blue-400/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-teal-500/[0.15]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="from-sky-500/[0.15]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
            </div>

            <div className="relative z-10 w-full px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6 md:mb-8"
                    >
                        <Circle className="h-2 w-2 fill-blue-500/80" />
                        <span className="text-sm text-white/60 tracking-wide">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight text-white">
                            {title1}
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-base sm:text-lg text-white/40 mb-6 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                            Discover all Sui Improvement Proposals (SIPs) – ideas and enhancements shaping the Sui Ecosystem in one place.
                        </p>
                    </motion.div>
                    
                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mt-4"
                    >
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <LiquidButton 
                                    size="lg" 
                                    className="text-white text-sm sm:text-base font-medium"
                                >
                                    What is a SIP?
                                </LiquidButton>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[800px] p-0 bg-black border-gray-800 relative">
                                <div className="absolute top-2 right-2 z-50">
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white transition-colors"
                                        aria-label="Close video"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ position: "relative", aspectRatio: "16/9" }}>
                                    <iframe 
                                        loading="lazy" 
                                        title="Gumlet video player"
                                        src="https://play.gumlet.io/embed/685d511e946bf1574dd11312?preload=false&autoplay=false&loop=false&background=false&disable_player_controls=false"
                                        style={{ border: "none", position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
                                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
                                        aria-label="Video explaining what SIPs are"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </motion.div>
                    
                    <motion.div
                        custom={4}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mt-10 flex flex-col items-center"
                    >
                        <p className="text-sm text-white/40 mb-3">Powered by</p>
                        <div className="flex items-center justify-center gap-6">
                            <div className="relative h-6 w-auto">
                                <Image 
                                    src="/suilogo.png" 
                                    alt="Sui Logo" 
                                    width={60} 
                                    height={24} 
                                    className="h-6 w-auto object-contain"
                                />
                            </div>
                            <div className="relative h-6 w-auto">
                                <Image 
                                    src="/h20nodes.png" 
                                    alt="H2O Nodes Logo" 
                                    width={90} 
                                    height={24} 
                                    className="h-6 w-auto object-contain"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
        </div>
    );
}

export { HeroGeometric } 