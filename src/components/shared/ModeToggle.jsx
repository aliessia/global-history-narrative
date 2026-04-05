import "../../styles/variables.css"

export default function ModeToggle({ mode, onSwitch }) {
  return (
    <div style={{
      position: 'fixed',
      top: 18,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 900,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'all',
    }}>
      <div style={{
        display: 'flex',
        background: 'rgba(6, 9, 14, 0.82)',
        border: '0.5px solid rgba(200, 160, 72, 0.14)',
        borderRadius: 999,
        padding: 3,
        backdropFilter: 'blur(12px)',
        gap: 2,
      }}>
        {['atlas', 'analysis'].map(m => (
          <button
            key={m}
            onClick={() => onSwitch(m)}
            style={{
              padding: '5px 18px',
              borderRadius: 999,
              border: mode === m
                ? '0.5px solid rgba(200, 160, 72, 0.22)'
                : '0.5px solid transparent',
              background: mode === m
                ? 'rgba(200, 160, 72, 0.10)'
                : 'transparent',
              color: mode === m
                ? 'rgba(200, 160, 72, 0.85)'
                : 'rgba(200, 180, 140, 0.28)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}