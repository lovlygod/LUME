import React, { memo } from 'react';
import styled, { css, keyframes } from 'styled-components';

// ─────────────────────────────────────────────────────────────────────────────
// Keyframes
// ─────────────────────────────────────────────────────────────────────────────

const rotation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const colorize = keyframes`
  0% {
    filter: hue-rotate(0deg);
  }
  20% {
    filter: hue-rotate(-30deg);
  }
  40% {
    filter: hue-rotate(-60deg);
  }
  60% {
    filter: hue-rotate(-90deg);
  }
  80% {
    filter: hue-rotate(-45deg);
  }
  100% {
    filter: hue-rotate(0deg);
  }
`;

const colorBlur = keyframes`
  0% {
    filter: hue-rotate(0deg) blur(calc(var(--size) / 15));
  }
  20% {
    filter: hue-rotate(-30deg) blur(calc(var(--size) / 15));
  }
  40% {
    filter: hue-rotate(-60deg) blur(calc(var(--size) / 15));
  }
  60% {
    filter: hue-rotate(-90deg) blur(calc(var(--size) / 15));
  }
  80% {
    filter: hue-rotate(-45deg) blur(calc(var(--size) / 15));
  }
  100% {
    filter: hue-rotate(0deg) blur(calc(var(--size) / 15));
  }
`;

const waveOne = keyframes`
  0% {
    d: path("M5,50 C10,50 15,50 20,50 C25,50 30,50 95,50");
  }
  50% {
    d: path("M5,50 C25,50 30,20 50,20 C70,20 75,50 95,50");
  }
  100% {
    d: path("M5,50 C70,50 75,50 80,50 C85,50 90,50 95,50");
  }
`;

const waveTwo = keyframes`
  0% {
    d: path("M5,50 C10,50 15,50 20,50 C25,50 30,50 95,50");
  }
  50% {
    d: path("M5,50 C25,50 30,80 50,80 C70,80 75,50 95,50");
  }
  100% {
    d: path("M5,50 C70,50 75,50 80,50 C85,50 90,50 95,50");
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────────────────────────────────────────

interface StyledWrapperProps {
  $size: number;
  $colorOne: string;
  $colorTwo: string;
  $colorThree: string;
  $colorFore: string;
  $colorFive: string;
  $fullscreen: boolean;
}

const StyledWrapper = styled.div<StyledWrapperProps>`
  --size: ${(props) => props.$size}px;
  --color-one: ${(props) => props.$colorOne};
  --color-two: ${(props) => props.$colorTwo};
  --color-three: ${(props) => props.$colorThree};
  --color-fore: ${(props) => props.$colorFore};
  --color-five: ${(props) => props.$colorFive};
  --time-animation: 1s;

  ${(props) =>
    props.$fullscreen &&
    css`
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(12px);
      background: rgba(0, 0, 0, 0.4);
    `}

  .loader {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 50%;
    width: var(--size);
    height: var(--size);
  }

  .loader .sphere {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border-radius: 50%;
    width: var(--size);
    height: var(--size);
    background: radial-gradient(
      circle at 80% 20%,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0.8) 20%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 70%
    );
  }

  .loader .sphere::before {
    content: '';
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    box-shadow:
      inset calc(var(--size) / -20) calc(var(--size) / -20) calc(var(--size) / 10)
        var(--color-fore),
      inset calc(var(--size) / 10) 0 calc(var(--size) / 5) var(--color-three);
    animation:
      ${rotation} calc(var(--time-animation) * 2) linear infinite,
      ${colorize} calc(var(--time-animation) * 2) ease-in-out infinite;
    will-change: transform, filter;
  }

  .loader .sphere::after {
    content: '';
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    z-index: -1;
    background: radial-gradient(
        circle at 80% 20%,
        rgba(255, 255, 255, 0.7) 0%,
        rgba(255, 255, 255, 0.5) 30%,
        rgba(255, 255, 255, 0) 70%
      ),
      linear-gradient(120deg, var(--color-one) 20%, var(--color-two) 80%);
    animation:
      ${rotation} calc(var(--time-animation) * 2) linear infinite,
      ${colorBlur} calc(var(--time-animation) * 2) ease-in-out infinite;
    will-change: transform, filter;
  }

  .loader svg {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--size);
    height: var(--size);
    animation: ${rotation} calc(var(--time-animation) * 3)
      cubic-bezier(0.7, 0.6, 0.3, 0.4) infinite;
    will-change: transform;
  }

  .loader svg #shapes circle {
    fill: var(--color-five);
  }

  .loader svg #blurriness g,
  .loader svg #clipping ellipse,
  .loader svg #shapes g:nth-of-type(2),
  .loader svg #fade ellipse {
    filter: blur(7px);
  }

  .loader svg #waves g path {
    will-change: d;
    stroke-width: 7px;
  }

  .loader svg #waves g path:nth-of-type(1) {
    animation: ${waveOne} var(--time-animation) cubic-bezier(0.7, 0.6, 0.3, 0.4)
      infinite;
  }

  .loader svg #waves g path:nth-of-type(2) {
    animation: ${waveTwo} var(--time-animation) cubic-bezier(0.7, 0.6, 0.3, 0.4)
      calc(var(--time-animation) / -2) infinite reverse;
  }

  .loader svg #waves g path:nth-of-type(3) {
    animation: ${waveOne} var(--time-animation) cubic-bezier(0.7, 0.6, 0.3, 0.4)
      calc(var(--time-animation) / -2) infinite;
  }

  .loader svg #waves g path:nth-of-type(4) {
    animation: ${waveTwo} var(--time-animation) cubic-bezier(0.7, 0.6, 0.3, 0.4)
      infinite reverse;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface LoaderProps {
  size?: number;
  colorOne?: string;
  colorTwo?: string;
  colorThree?: string;
  fullscreen?: boolean;
}

const LoaderComponent: React.FC<LoaderProps> = ({
  size = 100,
  colorOne = '#6d5cff',
  colorTwo = '#7aa2ff',
  colorThree = '#5c3d99',
  fullscreen = false,
}) => {
  // Цвета адаптируются под тёмную тему по умолчанию
  const colorFore = '#7aa2ff';
  const colorFive = 'white';

  return (
    <StyledWrapper
      $size={size}
      $colorOne={colorOne}
      $colorTwo={colorTwo}
      $colorThree={colorThree}
      $colorFore={colorFore}
      $colorFive={colorFive}
      $fullscreen={fullscreen}
    >
      <div className="loader" role="status" aria-label="Loading">
        <div className="sphere" />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <mask id="waves" maskUnits="userSpaceOnUse">
              <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5,50 C25,50 30,20 50,20 C70,20 75,50 95,50" />
                <path d="M5,50 C25,50 30,20 50,20 C70,20 75,50 95,50" />
                <path d="M5,50 C25,50 30,80 50,80 C70,80 75,50 95,50" />
                <path d="M5,50 C25,50 30,80 50,80 C70,80 75,50 95,50" />
              </g>
            </mask>
            <mask id="blurriness" maskUnits="userSpaceOnUse">
              <g>
                <circle cx={50} cy={50} r={50} fill="white" />
                <ellipse cx={50} cy={50} rx={25} ry={25} fill="black" />
              </g>
            </mask>
            <mask id="clipping" maskUnits="userSpaceOnUse">
              <ellipse cx={50} cy={50} rx={25} ry={50} fill="white" />
            </mask>
            <mask id="fade" maskUnits="userSpaceOnUse">
              <ellipse cx={50} cy={50} rx={45} ry={50} fill="white" />
            </mask>
          </defs>
          <g id="shapes" mask="url(#fade)">
            <g mask="url(#clipping)">
              <circle cx={50} cy={50} r={50} fill="currentColor" mask="url(#waves)" />
            </g>
            <g mask="url(#blurriness)">
              <circle cx={50} cy={50} r={50} fill="currentColor" mask="url(#waves)" />
            </g>
          </g>
        </svg>
      </div>
    </StyledWrapper>
  );
};

// Мемоизируем компонент для предотвращения лишних re-render
export const Loader = memo(LoaderComponent);

export default Loader;
