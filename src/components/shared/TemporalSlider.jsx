import { useState, useEffect, useRef } from 'react'
import "../../styles/variables.css"

/**
 * TemporalSlider — shared between atlas and analysis modes
 * Atlas: warm, centered, restrained
 * Analysis: same position, same logic, slightly flatter styling
 */
export default function TemporalSlider({ year, onChange, mode = 'atlas' }) {
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onChange(prev => {
          const next = prev + 5
          if (next > 1299) {
            setPlaying(false)
            return 1200
          }
          return next
        })
      }, 400)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, onChange])

  const isAtlas = mode === 'atlas'

  return (
    <div style={{
      position: 'absolute',
      bottom: isAtlas ? 28 : 62,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 800,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      background: isAtlas
        ? 'rgba(8, 12, 18, 0.78)'
        : 'rgba(8, 12, 20, 0.88)',
      border: `0.5px solid ${isAtlas
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 999,
      padding: '8px 22px',
      backdropFilter: 'blur(10px)',
      pointerEvents: 'all',
    }}>

      {/* Play/pause */}
      <button
        onClick={() => setPlaying(p => !p)}
        style={{
          background: 'none',
          border: `0.5px solid ${isAtlas
            ? 'rgba(200,160,72,0.22)'
            : 'rgba(200,144,58,0.18)'}`,
          borderRadius: '50%',
          width: 24, height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isAtlas
            ? 'rgba(200,160,72,0.6)'
            : 'rgba(200,144,58,0.5)',
          fontSize: 9,
          transition: 'all 200ms',
          flexShrink: 0,
        }}
      >
        {playing ? '■' : '▶'}
      </button>

      {/* CE label */}
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: isAtlas
          ? 'rgba(200,160,72,0.28)'
          : 'rgba(200,144,58,0.25)',
      }}>ce</span>

      {/* Year display */}
      <span style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 15,
        fontWeight: 600,
        color: isAtlas
          ? 'rgba(200,160,72,0.9)'
          : 'rgba(200,144,58,0.8)',
        minWidth: 36,
        textAlign: 'center',
        lineHeight: 1,
      }}>
        {year}
      </span>

      {/* Slider */}
      <input
        type="range"
        min={1200}
        max={1299}
        step={1}
        value={year}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          WebkitAppearance: 'none',
          appearance: 'none',
          width: 160,
          height: '1.5px',
          background: isAtlas
            ? 'rgba(200,160,72,0.18)'
            : 'rgba(200,144,58,0.15)',
          borderRadius: 1,
          outline: 'none',
          cursor: 'pointer',
        }}
      />

      {/* End label */}
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        letterSpacing: '0.08em',
        color: isAtlas
          ? 'rgba(200,160,72,0.22)'
          : 'rgba(200,144,58,0.18)',
      }}>1299</span>
    </div>
  )
}
