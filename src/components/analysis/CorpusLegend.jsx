import '../../styles/analysis.css'

/**
 * CorpusLegend — visible only in analysis mode
 * Shows coverage encoding: absent / partial / covered / pending
 */
export default function CorpusLegend() {
  const items = [
    {
      label:  'Covered · 2+ sources',
      fill:   'rgba(74,136,48,0.35)',
      stroke: '#4a8830',
    },
    {
      label:  'Partial · 1 source',
      fill:   'rgba(72,120,160,0.35)',
      stroke: '#4878a0',
    },
    {
      label:  'Absent · 0 sources',
      fill:   'rgba(184,80,64,0.32)',
      stroke: '#b85040',
    },
    {
      label:  'Pending · not coded',
      fill:   'rgba(152,120,32,0.28)',
      stroke: '#987820',
    },
  ]

  return (
    <div className="corpus-legend">
      <div className="corpus-legend__head">Coverage encoding</div>
      {items.map(item => (
        <div key={item.label} className="corpus-legend__item">
          <div
            className="corpus-legend__swatch"
            style={{
              background: item.fill,
              border: `0.5px solid ${item.stroke}`,
              opacity: 0.85,
            }}
          />
          <span className="corpus-legend__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
