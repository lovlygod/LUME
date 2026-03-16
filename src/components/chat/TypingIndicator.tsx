import { motion } from "framer-motion";

interface TypingIndicatorProps {
  label: string;
}

const TypingIndicator = ({ label }: TypingIndicatorProps) => {
  return (
    <div className="px-6 pb-2">
      <div className="flex items-center gap-2 text-xs text-white/60">
        <span className="italic">{label}</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-white/50"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
