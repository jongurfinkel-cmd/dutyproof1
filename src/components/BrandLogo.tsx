interface BrandLogoProps {
  width?: number
  height?: number
  className?: string
  /** 'dark' = dark text, for light backgrounds (default)
   *  'light' = white text, for dark backgrounds */
  variant?: 'dark' | 'light'
}

export default function BrandLogo({
  width = 480,
  height = 72,
  className = 'h-14 w-auto',
  variant = 'dark',
}: BrandLogoProps) {
  const isLight = variant === 'light'

  const shieldStroke = isLight ? '#E8530E' : '#B8400A'
  const flameFill    = isLight ? '#E8530E' : '#B8400A'
  const innerFill    = isLight ? '#FF8C42' : '#E8530E'
  const innerOpacity = isLight ? 0.5 : 0.35
  const tipOpacity   = isLight ? 0.3 : 0.2
  const dutyFill     = isLight ? '#FFFFFF' : '#111827'
  const proofFill    = isLight ? '#E8530E' : '#B8400A'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 72"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="DutyProof Fire Watch Compliance"
    >
      <g transform="translate(6, 4) scale(0.385)">
        {/* Shield */}
        <path
          d="M18 8 L142 8 C152 8 158 14 158 24 C158 58 156 86 140 108 C124 130 100 146 80 158 C60 146 36 130 20 108 C4 86 2 58 2 24 C2 14 8 8 18 8 Z"
          fill="none"
          stroke={shieldStroke}
          strokeWidth="6.5"
        />
        {/* Flame */}
        <path
          d="M80 136 C61 124 49 100 56 76 C59 66 63.5 57 66.5 47 C68 54 71 63 76.5 71 C80.5 61 83 50 82 39 C93 51 101 69 97.5 86 C99.5 81 101 74 100 68 C108 78 110 92 103 107 C95 123 86 132 80 136 Z"
          fill={flameFill}
        />
        {/* Inner core */}
        <path
          d="M80 126 C68.5 119 62 105 66 89 C68 84 70.5 78 72 72 C73 77 75.5 83 80 89 C83 82 84.5 75 84 68 C90 76 94 87 90.5 99 C88 108 83.5 121 80 126 Z"
          fill={innerFill}
          opacity={innerOpacity}
        />
        {/* Bright tip */}
        <path
          d="M80 113 C75 109 71.5 101 74.5 92 C76 89 77.5 87 78.5 83.5 C79.5 87 80.5 89.5 82.5 93 C84 90 85 86 84.5 83 C87.5 87 89.5 93 87.5 100 C85.5 106 82.5 111 80 113 Z"
          fill="#FFB870"
          opacity={tipOpacity}
        />
      </g>
      <text
        style={{ fontFamily: "var(--font-brand), 'Outfit', 'Helvetica Neue', Arial, sans-serif" }}
        fontWeight="700"
        fontSize="36"
        letterSpacing="0.3"
      >
        <tspan x="78" y="48" fill={dutyFill}>Duty</tspan>
        <tspan fill={proofFill} dx="1">Proof</tspan>
      </text>
    </svg>
  )
}
