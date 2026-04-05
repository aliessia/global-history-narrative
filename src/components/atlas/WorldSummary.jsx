/**
 * WorldSummary — fixed top block, always visible while body scrolls
 * Shows: status dot, name, period, location, description
 * NO curricular data here
 */
export default function WorldSummary({ region }) {
  const statusColor = {
    real:      'rgba(74, 136, 48, 0.7)',
    pending:   'rgba(152, 120, 32, 0.7)',
    estimated: 'rgba(72, 120, 160, 0.7)',
  }[region?.dataStatus] || 'rgba(200,160,72,0.4)'

  if (!region) return null

  return (
    <div className="world-summary">
      <div className="world-summary__status-dot" style={{ background: statusColor }} />
      <h2 className="world-summary__name">{region.name}</h2>
      <div className="world-summary__period">{region.period}</div>
      <div className="world-summary__location">{region.modernLocation}</div>
      <p className="world-summary__desc">{region.description}</p>
    </div>
  )
}
