import { STATUS, ORDER_TYPE } from '../utils/format'

export default function StatusPill({ status, label }) {
  const s = STATUS[status] || { label: status, tone: 'grey' }
  return <span className={`pill pill-${s.tone}`}>{label || s.label}</span>
}

export function TypeBadge({ type }) {
  return <span className={`tbadge ${type === 'prescription' ? 'tb-rx' : 'tb-cart'}`}>{ORDER_TYPE[type] || type}</span>
}