import { Icon } from '@/components/Icon'

type MapVariant =
  | 'dashboard'
  | 'corridor'
  | 'intervention'
  | 'running'
  | 'results'
  | 'comparison'

interface MapHeroProps {
  variant?: MapVariant
  className?: string
  showControls?: boolean
}

export function MapHero({ variant = 'dashboard', className = '', showControls = true }: MapHeroProps) {
  const closed = variant === 'intervention' || variant === 'running' || variant === 'results'
  const zoomed = variant === 'corridor'

  return (
    <div
      className={`relative overflow-hidden bg-map-bg ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M 120 520 L 280 420 L 420 380 L 580 320 L 720 200 L 880 120"
          fill="none"
          stroke="#DBE2EF"
          strokeOpacity="0.15"
          strokeWidth="6"
        />
        <path
          d="M 80 200 L 200 280 L 350 340 L 500 380 L 650 420"
          fill="none"
          stroke="#DBE2EF"
          strokeOpacity="0.12"
          strokeWidth="4"
        />
        {(variant === 'comparison' || variant === 'results') && (
          <>
            <path
              d="M 200 280 L 350 340 L 500 380"
              fill="none"
              stroke="#DBE2EF"
              strokeOpacity="0.35"
              strokeWidth="5"
              strokeDasharray="8 6"
            />
            <text x="220" y="270" fill="#DBE2EF" fontSize="11" fontFamily="JetBrains Mono">
              TEYNAMPET
            </text>
            <text x="400" y="330" fill="#DBE2EF" fontSize="11" fontFamily="JetBrains Mono">
              SAIDAPET
            </text>
            <text x="520" y="370" fill="#DBE2EF" fontSize="11" fontFamily="JetBrains Mono">
              GUINDY
            </text>
          </>
        )}
        <path
          d="M 120 520 L 280 420 L 420 380 L 580 320 L 720 200 L 880 120"
          fill="none"
          stroke={closed ? '#ba1a1a' : '#3F72AF'}
          strokeOpacity={closed ? 0.5 : 0.9}
          strokeWidth={zoomed ? 14 : 10}
          strokeLinecap="round"
        />
        {closed && (
          <>
            <rect x="400" y="350" width="120" height="40" fill="#112D4E" stroke="#ba1a1a" strokeWidth="2" rx="4" />
            <text x="460" y="375" fill="#ff6b6b" fontSize="12" fontFamily="JetBrains Mono" textAnchor="middle">
              ROAD CLOSED
            </text>
          </>
        )}
        {variant === 'running' && (
          <circle cx="580" cy="320" r="12" fill="#3F72AF" opacity="0.8">
            <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <text
          x="500"
          y="400"
          fill="#3F72AF"
          fontSize="14"
          fontFamily="JetBrains Mono"
          fontWeight="500"
          letterSpacing="2"
        >
          ANNA SALAI
        </text>
      </svg>

      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-outline-variant bg-shell-surface text-deep-navy shadow-sm"
          >
            <Icon name="layers" filled />
          </button>
          <div className="flex flex-col overflow-hidden rounded-[6px] border border-outline-variant bg-shell-surface shadow-sm">
            <button type="button" className="flex h-10 w-10 items-center justify-center border-b border-outline-variant">
              <Icon name="add" />
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center">
              <Icon name="remove" />
            </button>
          </div>
        </div>
      )}

      {variant === 'dashboard' && (
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-[6px] border border-outline-variant bg-shell-surface/95 px-3 py-2 font-label-sm text-on-surface-variant shadow-md backdrop-blur-sm">
          Congestion scale: Low → High
        </div>
      )}
    </div>
  )
}
