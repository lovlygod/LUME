import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Snowflake {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  sway: number; // амплитуда покачивания
  swayDuration: number; // скорость покачивания
  type: "dot" | "flake" | "heart";
}

interface SnowEffectProps {
  variant: "dots" | "flakes" | "hearts";
}

const SnowEffect = ({ variant }: SnowEffectProps) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Generate snowflakes
    const flakes: Snowflake[] = [];
    const snowflakeCount = 50;

    const particleType =
      variant === "flakes" ? "flake" : variant === "hearts" ? "heart" : "dot";

    for (let i = 0; i < snowflakeCount; i++) {
      flakes.push({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 3 + 2, // 2-5px
        duration: Math.random() * 8 + 7, // 7-15 секунд (медленнее)
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.3,
        sway: Math.random() * 30 + 10, // амплитуда 10-40px (меньше)
        swayDuration: Math.random() * 3 + 3, // 3-6 секунд (плавнее)
        type: particleType,
      });
    }

    setSnowflakes(flakes);
  }, [variant]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          className={
            flake.type === "flake"
              ? "absolute text-white select-none"
              : flake.type === "heart"
              ? "absolute text-red-500 select-none"
              : "absolute rounded-full bg-white"
          }
          style={{
            left: `${flake.x}%`,
            width: flake.type === "flake" || flake.type === "heart" ? undefined : flake.size,
            height: flake.type === "flake" || flake.type === "heart" ? undefined : flake.size,
            opacity: flake.opacity,
            fontSize:
              flake.type === "flake" || flake.type === "heart"
                ? flake.size * 3
                : undefined,
          }}
          initial={{ 
            y: -20,
            x: 0
          }}
          animate={{ 
            y: '100vh',
            x: flake.sway
          }}
          transition={{
            y: {
              duration: flake.duration,
              repeat: Infinity,
              delay: flake.delay,
              ease: "linear"
            },
            x: {
              duration: flake.swayDuration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut"
            }
          }}
        >
          {flake.type === "flake" ? "❄" : flake.type === "heart" ? "♡" : null}
        </motion.div>
      ))}
    </div>
  );
};

export default SnowEffect;
