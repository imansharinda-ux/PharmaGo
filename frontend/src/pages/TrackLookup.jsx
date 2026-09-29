import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StatusPill, { TypeBadge } from '../components/StatusPill'
import { Stepper, Timeline } from '../components/OrderProgress'
import { useAuth } from '../context/AuthContext'
import api, { errorText } from '../api/client'

export default function TrackLookup() {
  const { orderNo } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const [input, setInput] = useState(orderNo || '')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const norm = input.trim().toUpperCase().replace(/\s+/g, '').replace(/^PG(?!-)/, 'PG-')
  const valid = /^PG-\d{5}$/.test(norm)

  useEffect(() => {
    if (!orderNo) { setData(null); return }
    setErr('')
    api.get(`/orders/track/${orderNo}`)
      .then(({ data: d }) => setData(d))
      .catch(e => {
        setData(null)
        setErr(e.response?.status === 404 ? `We couldn’t find order ${orderNo}. Check the number on your confirmation.` : errorText(e))
      })
  }, [orderNo])

  return (
    <section className="container section">
      <div className="cap">Order tracking</div>
      <h1 className="h1">Track your order</h1>
      <form className="track-form" onSubmit={e => { e.preventDefault(); if (valid) nav(`/track/${norm}`) }}>
        <input className="field field-lg" value={input} onChange={e => setInput(e.target.value)} placeholder="Order number, e.g. PG-10002" aria-label="Order number" />
        <button className="btn btn-lg" disabled={!valid}>Track</button>
      </form>
      {input && !valid && <small className="err-text">Use PG followed by 5 digits, e.g. PG-10002</small>}
      {err && <div className="alert mt">{err}</div>}
      {data && (
        <div className="stack mt">
          <div className="card pad">
            <div className="row-between wrap gap">
              <div>
                <div className="row gap-s"><b className="h3">{data.order.order_no}</b><TypeBadge type={data.order.type} /></div>
                <small className="muted">Tracking no. {data.order.tracking_no} · {data.order.district}</small>
              </div>
              <StatusPill status={data.order.status} />
            </div>
            {!['rejected', 'cancelled'].includes(data.order.status) && <Stepper order={data.order} events={data.events} />}
            <p className="muted">
              Estimated delivery: <b>{data.order.eta}</b>
              {data.order.rider && <> · Rider: <b>{data.order.rider.name}</b> ({data.order.rider.vehicle})</>}
            </p>
          </div>
          <div className="card pad"><h2 className="h3">Activity</h2><Timeline order={data.order} events={data.events} /></div>
          {user?.role === 'customer'
            ? <Link className="btn2" to={`/orders/${data.order.order_no}`}>See full order details</Link>
            : <p className="muted">Log in to see the items, invoice and chat for your order. <Link to="/login">Log in</Link></p>}
        </div>
      )}
    </section>
  )
}