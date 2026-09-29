import Icon from './Icon'
import { buildSteps } from '../utils/format'

export function Stepper({ order, events }) {
  const steps = buildSteps(order, events)
  const idx = steps.findIndex(s => s.current)
  const doneCount = steps.filter(s => s.done).length
  const pct = Math.max(0, idx >= 0 ? idx : doneCount - 1) / 5 * 100

  return (
    <div className="stepper">
      <div className="stepper-track" aria-hidden="true"><div className="stepper-fill" style={{ width: `${pct}%` }} /></div>
      <ol>
        {steps.map(s => (
          <li key={s.label} className={s.done ? 'is-done' : s.current ? 'is-current' : ''}>
            <span className="stepper-dot">
              {s.done && <Icon name="check" size={18} stroke={3} />}
              {s.current && <span className="stepper-in" />}
            </span>
            <b>{s.label}</b>
            <small>{s.time}</small>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Timeline({ order, events }) {
  const steps = buildSteps(order, events)
  const closed = ['rejected', 'cancelled'].includes(order.status)
  const pending = closed ? [] : steps
    .filter(s => !s.done && !s.current)
    .map(s => ({ title: s.label, note: s.label === 'Delivered' ? 'We will notify you when it arrives' : '', todo: true, time: s.time }))
  const done = events.map(e => ({
    title: e.title,
    note: e.note,
    time: new Date(e.created_at).toLocaleString('en-GB', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true }),
    bad: ['rejected', 'failed', 'cancelled'].includes(e.kind),
  }))
  const rows = [...done, ...pending]

  return (
    <ul className="timeline">
      {rows.map((r, i) => (
        <li key={i} className={r.todo ? 'is-todo' : r.bad ? 'is-bad' : ''}>
          <span className="tl-dot" />
          <div className="tl-main">
            <b>{r.title}</b>
            {r.note && <small>{r.note}</small>}
          </div>
          <span className="tl-time">{r.time}</span>
        </li>
      ))}
    </ul>
  )
}