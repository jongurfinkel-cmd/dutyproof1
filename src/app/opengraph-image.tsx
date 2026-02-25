import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DutyProof — Fire Watch Verification Software'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Shield icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #e85c0d, #ff8c42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M12 8c-.55 0-1 .45-1 1v2.5c-.6.35-1 .98-1 1.7 0 1.1.9 2 2 2s2-.9 2-2c0-.72-.4-1.35-1-1.7V9c0-.55-.45-1-1-1z"
                fill="#e85c0d"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            DUTYPROOF
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#e85c0d',
              letterSpacing: '4px',
              textTransform: 'uppercase' as const,
            }}
          >
            Fire Watch Verification
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#94a3b8',
              marginTop: '8px',
              textAlign: 'center',
              maxWidth: '700px',
              lineHeight: 1.5,
            }}
          >
            SMS check-ins &middot; Tamper-proof audit logs &middot; OSHA-ready PDF reports
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
