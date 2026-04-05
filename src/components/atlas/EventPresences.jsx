/**
 * EventPresences — event seals in world layer
 * Feel like temporal anchors, not database entries
 */
const CATEGORY_LABELS = {
  political: 'Political', military: 'Military',
  economic: 'Economic',  social: 'Social',
  cultural: 'Cultural',  religious: 'Religious',
}

export default function EventPresences({ events = [] }) {
  const visible = events.slice(0, 6)
  return (
    <div>
      {visible.map((event, i) => (
        <div key={i} className="event-seal">
          <div className="event-seal__year">{event.year}</div>
          <div className="event-seal__content">
            <div className="event-seal__label">{event.label}</div>
            {event.category && (
              <div className="event-seal__category">
                {CATEGORY_LABELS[event.category] || event.category}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
