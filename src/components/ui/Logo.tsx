type LogoMarkProps = {
  className?: string;
  textClassName?: string;
};

const LogoMark = ({ className = "", textClassName = "" }: LogoMarkProps) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-white/10 ${className}`}
      aria-label="LUME"
    >
      <span className={`text-[10px] tracking-[0.3em] text-white/80 ${textClassName}`}>
        LUME
      </span>
    </div>
  );
};

export default LogoMark;
