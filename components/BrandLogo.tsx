type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M74 9A43 43 0 1 0 47 92"
        fill="none"
        stroke="#3b1d52"
        strokeLinecap="butt"
        strokeWidth="7"
      />
      <path
        d="M58 91A43 43 0 0 0 92 58"
        fill="none"
        stroke="#b3538c"
        strokeLinecap="butt"
        strokeWidth="7"
      />
      <g stroke="#b3538c" strokeWidth="5">
        <path d="M80 12l2 8" />
        <path d="M87 16l-1 8" />
        <path d="M93 22l-4 7" />
        <path d="M97 30l-7 4" />
        <path d="M97 39l-7 2" />
        <path d="M97 48h-7" />
      </g>
      <g
        fill="none"
        stroke="#3b1d52"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="9"
      >
        <path d="M29 32v38M48 32v38M29 51h19" />
        <path d="M60 32v38h18" />
      </g>
    </svg>
  );
}
