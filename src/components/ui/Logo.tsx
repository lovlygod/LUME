import logoImage from "@/assets/logo.png";

type LogoMarkProps = {
  className?: string;
  textClassName?: string;
};

const LogoMark = ({ className = "", textClassName = "" }: LogoMarkProps) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label="LUME">
      <img src={logoImage} alt="LUME" className="h-8 w-8 rounded-lg object-cover" />
      <span className={`text-[10px] tracking-[0.3em] text-white/80 ${textClassName}`}>LUME</span>
    </div>
  );
};

export default LogoMark;
