import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import StatusPill, { TypeBadge } from '../../components/StatusPill'
import api, { errorText } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { fmtDateTime, rs } from '../../utils/format'

const TABS = {
  pharmacist: [['review', 'Needs review', 'awaiting_review'], ['verified', 'Verified — to pack', 'verified'], ['handed', 'Handed to delivery', 'packed,picked_up,out_for_delivery,delivered'], ['rejected', 'Rejected', 'rejected'], ['all', 'All', '']],
  delivery: [['ready', 'Ready for pickup', 'packed'], ['courier', 'With courier', 'picked_up'], ['out', 'Out for delivery', 'out_for_delivery'], ['done', 'Delivered', 'delivered'], ['all', 'All', '']],
  admin: [['all', 'All orders', ''], ['review', 'Awaiting review', 'awaiting_review'], ['prep', 'Being prepared', 'verified,packed'], ['delivery', 'In delivery', 'picked_up,out_for_delivery'], ['done', 'Delivered', 'delivered'], ['closed', 'Rejected / cancelled', 'rejected,cancelled']],
}

const TITLE = {
  pharmacist: ['Pharmacist console', 'Orders', 'Open an order to check its prescription, add medicines, pack it and hand it to delivery.'],
  delivery: ['Delivery console', 'Deliveries', 'Packed orders arrive here. Assign a rider, tick each delivery step and keep tracking up to date.'],
  admin: ['Admin console', 'Dashboard', 'Every order across the pharmacy and delivery teams. Open one to change anything.'],
}

const TYPES = [['all', 'All orders', 'Cart and prescription'], ['cart', 'Cart orders', 'Added to cart by customers'], ['prescription', 'Prescription orders', 'From uploaded prescriptions']]

export default function StaffOrders() {
  const { user } = useAuth()
  const toast = useToast()
  const role = user.role
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || TABS[role][0][0]
  const type = params.get('type') || 'all'
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const setParam = (k, v) => {
    const p = new URLSearchParams(params)
    p.set(k, v)
    setParams(p)
  }

  const load = useCallback(() => {
    const t = TABS[role].find(x => x[0] === tab) || TABS[role][0]
    const q = new URLSearchParams()
    if (t[2]) q.set('status', t[2])
    if (type !== 'all') q.set('type', type)
    if (search.trim()) q.set('search', search.trim())
    Promise.all([api.get(`/orders?${q}`), api.get(`/orders/stats${type !== 'all' ? `?type=${type}` : ''}`)])
      .then(([o, s]) => { setOrders(o.data.orders); setStats(s.data); setErr('') })
      .catch(e => setErr(errorText(e)))
  }, [role, tab, type, search])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  const by = stats?.byStatus || {}
  const n = (...s) => s.reduce((a, k) => a + (by[k] || 0), 0)
  let cards = [['Needs review', n('awaiting_review'), 'amber'], ['Verified — to pack', n('verified'), 'green'], ['Handed to delivery', n('packed', 'picked_up', 'out_for_delivery', 'delivered'), 'blue'], ['Rejected', n('rejected'), 'red']]
  if (role === 'delivery') cards = [['Ready for pickup', n('packed'), 'green'], ['With courier', n('picked_up'), 'blue'], ['Out for delivery', n('out_for_delivery'), 'blue'], ['Delivered', n('delivered'), '']]
  if (role === 'admin') cards = [['Total orders', stats?.total ?? '—', ''], ['Sales (confirmed orders)', stats ? rs(stats.sales) : '—', 'green'], ['Awaiting pharmacist', n('awaiting_review'), 'amber'], ['In delivery', n('picked_up', 'out_for_delivery'), 'blue']]

  const typeCounts = stats?.byType || {}
  const waiting = stats?.waitingForRider || 0

  const autoAssign = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/orders/auto-assign', { type: type === 'all' ? undefined : type })
      toast(data.message)
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <div className="cap">{TITLE[role][0]}</div>
          <h1 className="h1">{TITLE[role][1]}</h1>
          <p className="muted">{TITLE[role][2]}</p>
        </div>
      </div>

      <div className="stats">
        {cards.map(([l, v, t]) => (
          <div key={l} className="card stat"><small>{l}</small><b className={t ? `t-${t}` : ''}>{v}</b></div>
        ))}
      </div>

      <div className="queue-bar">
        <div className="types" role="group" aria-label="Order type">
          {TYPES.map(([v, l, s]) => (
            <button key={v} className={`typebtn ${type === v ? 'is-on' : ''}`} onClick={() => setParam('type', v)} aria-pressed={type === v}>
              <b>{v === 'all' ? (typeCounts.cart || 0) + (typeCounts.prescription || 0) : typeCounts[v] || 0}</b>
              <span><strong>{l}</strong><small>{s}</small></span>
            </button>
          ))}
        </div>
        {(role === 'delivery' || role === 'admin') && (
          <div className="auto">
            <button className="btn btn-dark" onClick={autoAssign} disabled={busy || !waiting}>
              <Icon name="bolt" /> Auto-assign riders{waiting ? ` (${waiting})` : ''}
            </button>
            <small className="muted">{waiting ? 'Picks the least-busy rider and sets the delivery date' : 'Every packed order has a rider'}</small>
          </div>
        )}
      </div>

      <div className="tabs-row">
        <div className="tabs" role="tablist">
          {TABS[role].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`ftab ${tab === k ? 'is-on' : ''}`} onClick={() => setParam('tab', k)}>{l}</button>
          ))}
        </div>
        <label className="search search-sm">
          <Icon name="search" size={16} />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Order no. or customer" aria-label="Search orders" />
        </label>
      </div>
      {err && <div className="alert">{err}</div>}

      <div className="card table-card">
        <div className="trow thead">
          <span>Order</span><span>Customer</span><span>District</span><span>Placed</span><span>Items</span><span>{role === 'delivery' ? 'Rider' : 'Total'}</span><span>Status</span><span />
        </div>
        {orders.map(o => (
          <Link key={o.order_no} to={`/staff/orders/${o.order_no}`} className="trow">
            <span data-label="Order"><b>{o.order_no}</b><TypeBadge type={o.type} /></span>
            <span data-label="Customer">{o.customer_name}</span>
            <span data-label="District" className="muted">{o.district}</span>
            <span data-label="Placed" className="muted small">{fmtDateTime(o.created_at)}</span>
            <span data-label="Items" className="ellipsis">{o.items_summary || (o.type === 'prescription' ? 'Prescription — no medicines yet' : '—')}</span>
            <span data-label={role === 'delivery' ? 'Rider' : 'Total'}><b>{role === 'delivery' ? (o.rider_name || 'Not assigned') : o.total ? rs(o.total) : '—'}</b></span>
            <span data-label="Status"><StatusPill status={o.status} /></span>
            <span className="lnk">Open →</span>
          </Link>
        ))}
        {!orders.length && <div className="empty"><b>No orders here right now.</b></div>}
      </div>
    </>
  )
}