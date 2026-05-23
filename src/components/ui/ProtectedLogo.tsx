import logoImage from "@/assets/logo.svg";

type ProtectedLogoProps = {
  className?: string;
  alt?: string;
};

const ProtectedLogo = ({ className = "", alt = "LUME" }: ProtectedLogoProps) => {
  return (
    <div
      role="img"
      aria-label={alt}
      title={alt}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      className={`select-none bg-center bg-cover bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(${logoImage})` }}
    />
  );
};

export default ProtectedLogo;
