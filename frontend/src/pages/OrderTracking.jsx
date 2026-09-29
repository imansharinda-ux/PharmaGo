import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { TypeBadge } from '../components/StatusPill'
import { Stepper, Timeline } from '../components/OrderProgress'
import ChatPanel from '../components/ChatPanel'
import RxFile from '../components/AuthImage'
import api, { errorText } from '../api/client'
import { useToast } from '../context/ToastContext'
import { downloadInvoice } from '../utils/invoice'
import { fmtDateTime, initials, rs } from '../utils/format'

export default function OrderTracking() {
  const { orderNo } = useParams()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [chat, setChat] = useState(false)

  const load = useCallback(() => api.get(`/orders/${orderNo}`)
    .then(({ data: d }) => { setData(d); setErr('') })
    .catch(e => setErr(errorText(e))), [orderNo])

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  if (err && !data) return <section className="container section"><div className="alert">{err}</div><Link to="/orders">← My orders</Link></section>
  if (!data) return <section className="container section"><p className="muted">Loading order…</p></section>

  const { order: o, items, events, prescriptions } = data
  const closed = ['rejected', 'cancelled'].includes(o.status)
  const delivered = o.status === 'delivered'
  const count = items.reduce((a, i) => a + i.quantity, 0)
  const deliveredAt = events.filter(e => e.kind === 'delivered').pop()

  const cancel = async () => {
    if (!window.confirm(`Cancel order ${o.order_no}?`)) return
    try {
      const { data: d } = await api.post(`/orders/${o.order_no}/cancel`)
      setData(d)
      toast('Order cancelled')
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const invoice = () => {
    if (items.length) downloadInvoice(o, items)
    else toast('The invoice is ready once the pharmacist adds your medicines', 'error')
  }

  let estSub = `Delivery to ${o.district} takes ${o.delivery_days} · 10 AM – 6 PM`
  if (o.status === 'out_for_delivery') estSub = 'Out for delivery today · 10 AM – 6 PM'
  if (delivered) estSub = o.received_by ? `Received by ${o.received_by}` : 'Thank you for ordering with PharmaGo'

  return (
    <section className="container section">
      <Link className="lnk" to="/orders">← My orders</Link>
      <div className="track-head">
        <div>
          <div className="row gap-s"><span className="cap">Order tracking</span><TypeBadge type={o.type} /></div>
          <h1 className="h1">Order No. {o.order_no}</h1>
          <p className="muted strong">Placed {fmtDateTime(o.created_at)} · {items.length ? `${count} items · ${rs(o.total)}` : 'waiting for the pharmacist'}</p>
        </div>
        <div className="row gap wrap">
          {o.status === 'awaiting_review' && <button className="btnr" onClick={cancel}>Cancel order</button>}
          <button className="btn2" onClick={invoice}><Icon name="download" /> Download invoice</button>
          <button className="btn" onClick={() => setChat(true)}><Icon name="chat" /> Chat with a pharmacist</button>
        </div>
      </div>

      {!closed && <div className="card pad"><Stepper order={o} events={events} /></div>}

      <div className="track-grid2">
        <div className="stack">
          {closed ? (
            <div className="banner banner-bad">
              <small>{o.status === 'cancelled' ? 'ORDER CANCELLED' : 'NOT ACCEPTED'}</small>
              <b>{o.status === 'cancelled' ? 'This order was cancelled.' : 'We couldn’t verify this prescription.'}</b>
              <span>{o.status === 'cancelled' ? 'You have not been charged.' : 'Please upload a clearer photo or a new prescription. You have not been charged.'}</span>
            </div>
          ) : (
            <div className="banner">
              <div>
                <small>{delivered ? 'DELIVERED' : 'ESTIMATED DELIVERY'}</small>
                <b>{delivered ? fmtDateTime(deliveredAt?.created_at) : o.eta}</b>
                <span>{estSub}</span>
              </div>
              <div className="banner-box">
                <b>How we worked this out</b>
                <div><span>Pharmacist review</span><span>{o.status === 'awaiting_review' ? 'In progress' : 'Done'}</span></div>
                <div><span>Packing</span><span>{['awaiting_review', 'verified'].includes(o.status) ? 'Pending' : 'Done'}</span></div>
                <div><span>Courier to {o.district}</span><span>{o.delivery_days}</span></div>
              </div>
            </div>
          )}
          <div className="card pad"><h2 className="h3">Order activity</h2><Timeline order={o} events={events} /></div>
        </div>

        <div className="stack">
          <div className="card pad">
            <h2 className="h3">Items in this order</h2>
            {!items.length && <div className="note"><Icon name="clock" size={18} /> Our pharmacist is reviewing your prescription and will add the medicines here.</div>}
            {items.map(i => (
              <div className="sline" key={i.id}>
                <img src={i.image_url} alt="" />
                <div>
                  <b>{i.name} {i.rx_required && <span className="rx">Prescription</span>}</b>
                  <small>Qty {i.quantity} · {i.pack_size}</small>
                  {i.added_by === 'pharmacist' && <small className="green">Added by pharmacist</small>}
                </div>
                <b>{rs(i.line_total)}</b>
              </div>
            ))}
            <div className="row-between muted"><span>Subtotal</span><span>{rs(o.total)}</span></div>
            <div className="row-between muted"><span>Delivery</span><span className="green">Free</span></div>
            <div className="row-between total"><span>{o.pay_method === 'cod' && !delivered ? 'Total (pay on delivery)' : 'Total'}</span><span>{rs(o.total)}</span></div>
          </div>

          <div className="card pad">
            <div className="row-between"><h2 className="h3">Delivery</h2><small className="muted">Tracking no. {o.tracking_no}</small></div>
            {o.rider ? (
              <div className="rider">
                <span className="avatar avatar-blue">{initials(o.rider.name)}</span>
                <div><b>{o.rider.name} · your rider</b><small>{o.rider.vehicle} · {o.rider.phone}</small></div>
              </div>
            ) : (
              <p className="muted">{o.status === 'packed' ? 'Packed — a rider is being assigned.' : 'A rider is assigned once your order is packed.'}</p>
            )}
            <p className="addr"><b>{o.customer_name}</b><br />{o.address || '—'}<br />{o.district}<br />{o.phone}</p>
            <small className="muted strong">Payment: {o.pay_method === 'cod' ? 'Cash on delivery' : 'Card'}</small>
          </div>

          {prescriptions.length > 0 && (
            <div className="card pad">
              <h2 className="h3">Your prescription</h2>
              <div className="rxfiles">{prescriptions.map((p, i) => <RxFile key={p.id} file={p} index={i} />)}</div>
            </div>
          )}

          <div className="help-card">
            <Icon name="chat" size={22} />
            <div><b>Questions about your medicines?</b><small>A pharmacist can answer dosage questions.</small></div>
            <button className="lnk" onClick={() => setChat(true)}>Ask</button>
          </div>
        </div>
      </div>
      {chat && <ChatPanel orderNo={o.order_no} onClose={() => setChat(false)} />}
    </section>
  )
}