import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import StatusPill, { TypeBadge } from '../components/StatusPill'
import api, { errorText } from '../api/client'
import { fmtDateTime, rs } from '../utils/format'

export default function MyOrders() {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    const load = () => api.get('/orders/my').then(({ data }) => setOrders(data.orders)).catch(e => setErr(errorText(e)))
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <div className="cap">My account</div>
          <h1 className="h1">My orders</h1>
          <p className="muted">Each order updates by itself as our team works on it.</p>
        </div>
        <div className="row gap">
          <Link className="btn2" to="/shop">Shop</Link>
          <Link className="btn" to="/prescription"><Icon name="upload" /> Upload prescription</Link>
        </div>
      </div>
      {err && <div className="alert">{err}</div>}
      {orders && !orders.length && (
        <div className="card empty"><b>No orders yet</b><p>Add products to your cart or upload a prescription to get started.</p></div>
      )}
      <div className="olist">
        {(orders || []).map(o => (
          <Link key={o.order_no} to={`/orders/${o.order_no}`} className="card ocard">
            <div><b className="ocard-no">{o.order_no}</b><TypeBadge type={o.type} /><small>{fmtDateTime(o.created_at)}</small></div>
            <div className="ocard-items">
              <b>{o.items_summary || 'Prescription uploaded — waiting for the pharmacist'}</b>
              <small>{o.item_count ? `${o.item_count} items · ` : ''}{o.district}</small>
            </div>
            <StatusPill status={o.status} />
            <b className="ocard-total">{o.total ? rs(o.total) : '—'}</b>
            <span className="lnk">Track <Icon name="arrowRight" size={15} /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}