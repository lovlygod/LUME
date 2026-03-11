import React from "react";

type VerificationHeroProps = {
  onSubmit?: () => void;
};

export function VerificationHero({ onSubmit }: VerificationHeroProps) {
  return (
    <section
      className="
        relative w-full overflow-hidden
        rounded-[32px]
        border border-white/10
        bg-white/[0.05]
        shadow-[0_18px_70px_rgba(0,0,0,0.55)]
        backdrop-blur-2xl
      "
      style={{ height: 210 }}
    >
      {/* Background: soft edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 260px at 15% 25%, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 55%)," +
            "radial-gradient(700px 240px at 85% 70%, rgba(255,255,255,0.08), rgba(255,255,255,0.00) 60%)",
        }}
      />

      {/* Background: vertical glass shading (like soft columns) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "linear-gradient(90deg," +
            "rgba(255,255,255,0.06) 0%," +
            "rgba(255,255,255,0.02) 18%," +
            "rgba(255,255,255,0.05) 52%," +
            "rgba(255,255,255,0.02) 78%," +
            "rgba(255,255,255,0.05) 100%)",
        }}
      />

      {/* Background: light ribbon */}
      <div
        className="pointer-events-none absolute -inset-x-10 top-1/2 -translate-y-1/2 blur-2xl"
        style={{
          height: 180,
          background:
            "linear-gradient(90deg," +
            "rgba(255,255,255,0.00) 0%," +
            "rgba(255,255,255,0.10) 20%," +
            "rgba(255,255,255,0.18) 45%," +
            "rgba(255,255,255,0.10) 70%," +
            "rgba(255,255,255,0.00) 100%)",
          transform: "translateY(-50%) rotate(-8deg)",
        }}
      />
      {/* Ribbon highlight line */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-[44%] opacity-35"
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))",
          filter: "blur(0.2px)",
          transform: "rotate(-8deg)",
        }}
      />

      {/* Noise overlay (very subtle) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.55) 0.6px, rgba(255,255,255,0) 0.7px)",
          backgroundSize: "6px 6px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-between px-8 py-7">
        <div className="max-w-[520px]">
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-white">
            Получить верификацию
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/55">
            Подтвердите свой статус и получите официальный значок
          </p>

          <button
            onClick={onSubmit}
            className="
              mt-5 inline-flex h-[42px] items-center justify-center
              rounded-full px-5 text-[14px] font-medium text-white/90
              bg-white/[0.08] hover:bg-white/[0.12]
              border border-white/10
              shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]
              transition
            "
            type="button"
          >
            Отправить на верификацию
          </button>
        </div>

        {/* Check badge */}
        <div
          className="
            ml-6 flex h-11 w-11 items-center justify-center
            rounded-full bg-white/[0.07]
            border border-white/15
            shadow-[0_10px_24px_rgba(0,0,0,0.35)]
            backdrop-blur-xl
          "
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="opacity-90"
          >
            <path
              d="M20 7L10.5 16.5L4 10"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}