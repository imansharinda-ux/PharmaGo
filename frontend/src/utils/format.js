export const rs = n => 'Rs. ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })

export const fmtDateTime = ts => {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''

export const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'

export const initials = s => String(s || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

export const DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle']

export const daysFor = d => (d === 'Colombo' ? '1 day' : '2–3 days')

export const CATEGORIES = [
  { id: 'all', label: 'All products' },
  { id: 'rx', label: 'Prescription medicines' },
  { id: 'otc', label: 'Over-the-counter' },
  { id: 'vit', label: 'Vitamins & supplements' },
  { id: 'beauty', label: 'Beauty & skin care' },
  { id: 'support', label: 'Supports & braces' },
  { id: 'personal', label: 'Personal care' },
  { id: 'baby', label: 'Baby & mother' },
  { id: 'device', label: 'Medical devices' },
]

export const STATUS = {
  awaiting_review: { label: 'Awaiting review', tone: 'amber' },
  verified: { label: 'Verified', tone: 'green' },
  packed: { label: 'Ready for delivery', tone: 'green' },
  picked_up: { label: 'With courier', tone: 'blue' },
  out_for_delivery: { label: 'Out for delivery', tone: 'blue' },
  delivered: { label: 'Delivered', tone: 'dark' },
  rejected: { label: 'Rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
}

export const FLOW = ['awaiting_review', 'verified', 'packed', 'picked_up', 'out_for_delivery', 'delivered']

export const ORDER_TYPE = { cart: 'Cart order', prescription: 'Prescription order' }

export function buildSteps(order, events = []) {
  const labels = order.type === 'prescription'
    ? ['Prescription uploaded', 'Verified & medicines added', 'Packed', 'Picked up', 'Out for delivery', 'Delivered']
    : ['Order placed', 'Order confirmed', 'Packed', 'Picked up', 'Out for delivery', 'Delivered']
  const kinds = ['placed', 'verified', 'packed', 'picked', 'out', 'delivered']
  const idx = Math.max(0, FLOW.indexOf(order.status))
  const closed = ['rejected', 'cancelled'].includes(order.status)
  return labels.map((label, i) => {
    const hit = [...events].reverse().find(e => e.kind === kinds[i])
    const done = !closed && (i < idx || (i === idx && idx === 5))
    const current = !closed && !done && i === idx
    return {
      label,
      done,
      current,
      todo: !done && !current,
      time: hit ? fmtDateTime(hit.created_at) : (i === 5 && order.eta && !closed ? 'Expected ' + order.eta.split(',')[0] : '—'),
    }
  })
}

export const CAT_DESC = {
  rx: 'Order with a valid, pharmacist-verified prescription.', otc: 'Pain relief, cold & flu, allergy and digestion.',
  vit: 'Immunity, energy and everyday wellness.', beauty: 'Cleansers, moisturisers, sunscreen and more.',
  support: 'Knee, shoulder, ankle and back supports.', personal: 'Oral care, hygiene and hair care.',
  baby: 'Baby care and maternal health.', device: 'BP monitors, thermometers and first aid.',
}

export const TINTS = { rx: '#EEF3EC', otc: '#EAF0F5', vit: '#F6EFE6', beauty: '#EEF3EC', support: '#EAF0F5', personal: '#EEF3EC', baby: '#F6EFE6', device: '#EAF0F5' }

