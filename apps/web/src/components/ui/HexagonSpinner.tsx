
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HexagonSpinnerProps {
    size?: number;
    className?: string;
}

export function HexagonSpinner({ size = 24, className }: HexagonSpinnerProps) {
    // Hexagon path (pointy top)
    const hexPath = "M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z";

    return (
        <div
            className={cn("relative flex items-center justify-center", className)}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin-slow"
            >
                <motion.path
                    d={hexPath}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{
                        pathLength: [0, 1, 0],
                        opacity: [0.2, 1, 0.2],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="text-gold"
                />
                {/* Inner static hex for visual stability (optional, maybe keep it clean) */}
                <path
                    d={hexPath}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-gold/20"
                />
            </svg>
        </div>
    );
}
