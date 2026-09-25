import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import StatusPill, { TypeBadge } from '../../components/StatusPill'
import ChatPanel from '../../components/ChatPanel'
import RxFile from '../../components/AuthImage'
import api, { errorText } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { buildSteps, fmtDateTime, initials, rs, STATUS, FLOW } from '../../utils/format'

const FAIL_REASONS = ['Customer not reachable', 'Wrong address', 'Customer asked to reschedule']

export default function StaffOrderDetail() {
  const { orderNo } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const role = user.role
  const isPh = role === 'pharmacist' || role === 'admin'
  const isDel = role === 'delivery' || role === 'admin'
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [meds, setMeds] = useState([])
  const [q, setQ] = useState('')
  const [riders, setRiders] = useState([])
  const [eta, setEta] = useState('')
  const [receiver, setReceiver] = useState('')
  const [upd, setUpd] = useState({ title: '', note: '' })
  const [showChat, setShowChat] = useState(false)
  const base = `/orders/${orderNo}`

  const load = useCallback(() => api.get(base)
    .then(({ data: d }) => { setData(d); setErr('') })
    .catch(e => setErr(errorText(e))), [base])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isPh) api.get('/medicines').then(({ data: d }) => setMeds(d.medicines)).catch(() => {})
  }, [isPh])

  const status = data?.order.status
  useEffect(() => {
    if (isDel) api.get('/staff/riders').then(({ data: d }) => setRiders(d.riders)).catch(() => {})
  }, [isDel, status])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = s ? meds.filter(m => `${m.name} ${m.pack_size} ${m.label}`.toLowerCase().includes(s)) : meds.filter(m => m.rx_required)
    return list.slice(0, 8)
  }, [meds, q])

  const act = async (fn, okMsg) => {
    setBusy(true)
    try {
      const { data: d } = await fn()
      if (d.order) setData(d)
      if (okMsg) toast(okMsg)
      return true
    } catch (e) {
      toast(errorText(e), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }

  if (err && !data) return <><Link className="lnk" to="/staff">← Back</Link><div className="alert mt">{err}</div></>
  if (!data) return <p className="muted">Loading order…</p>

  const { order: o, items, events, prescriptions } = data
  const s = o.status
  const canEdit = isPh && ['awaiting_review', 'verified'].includes(s)
  const steps = buildSteps(o, events)
  const count = items.reduce((a, i) => a + i.quantity, 0)
  const backLabel = role === 'delivery' ? 'All deliveries' : role === 'admin' ? 'Dashboard' : 'All orders'

  const idx = FLOW.indexOf(s)
  const checks = [
    { label: 'Packed by the pharmacy', done: idx >= 2, hint: idx >= 2 ? 'Ready for the courier' : 'Waiting for the pharmacist' },
    { label: 'Rider assigned', done: !!o.rider, hint: o.rider ? `${o.rider.name} · ${o.rider.vehicle}` : 'Choose a rider below' },
    { label: 'Picked up by rider', done: idx >= 3, hint: idx >= 3 ? 'The rider has the package' : o.rider ? 'Tick when the rider collects it' : 'Assign a rider first' },
    { label: 'Out for delivery', done: idx >= 4, hint: 'Tick when the rider leaves for the customer' },
    { label: 'Delivered to customer', done: idx >= 5, hint: o.received_by ? `Received by ${o.received_by}` : 'Tick when the customer receives it' },
  ]
  const nextCheck = checks.findIndex(c => !c.done)
  const lastCheck = checks.map(c => c.done).lastIndexOf(true)
  const tickable = i => (i === nextCheck && i >= 2 && !(i === 2 && !o.rider)) || (i === lastCheck && i >= 2) || (i === 1 && !!o.rider && s === 'packed')
  const tick = i => {
    if (i === nextCheck && i >= 2) return act(() => api.post(`${base}/advance`, { received_by: receiver }), 'Step ticked — the customer can see it')
    if (i === lastCheck && i >= 2) return act(() => api.post(`${base}/undo`), 'Step unticked')
    if (i === 1 && o.rider && s === 'packed') return act(() => api.post(`${base}/rider`, { rider_id: null }), 'Rider removed')
    return null
  }

  const reject = () => {
    const r = window.prompt('Reason for rejecting (the customer will see this):', 'Please upload a clearer photo of the prescription')
    if (r !== null) act(() => api.post(`${base}/reject`, { reason: r }), 'Prescription rejected')
  }

  const cancel = () => {
    if (window.confirm(`Cancel ${o.order_no}? Stock will be returned.`)) act(() => api.post(`${base}/cancel`, { reason: 'Cancelled by admin' }), 'Order cancelled')
  }

  const saveEta = async e => {
    e.preventDefault()
    if (await act(() => api.patch(`${base}/eta`, { eta }), 'Delivery date updated')) setEta('')
  }

  const postUpdate = async e => {
    e.preventDefault()
    if (await act(() => api.post(`${base}/updates`, upd), 'Update posted')) setUpd({ title: '', note: '' })
  }

  return (
    <>
      <Link className="lnk" to="/staff">← {backLabel}</Link>
      <div className="track-head">
        <div>
          <div className="row gap-s"><TypeBadge type={o.type} /><small className="muted">Tracking no. {o.tracking_no}</small></div>
          <h1 className="h1">Order {o.order_no}</h1>
          <p className="muted strong">{o.customer_name} · {o.district} · placed {fmtDateTime(o.created_at)}</p>
        </div>
        <div className="row gap wrap">
          <StatusPill status={s} />
          {isPh && <button className="btn2" onClick={() => setShowChat(!showChat)}><Icon name="chat" /> {showChat ? 'Hide chat' : 'Chat with customer'}</button>}
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack">
          {isPh && (
            <div className="card pad">
              <h2 className="h3">Prescription</h2>
              {o.type !== 'prescription' && <p className="note">No prescription needed — this is a cart order.</p>}
              {o.type === 'prescription' && !prescriptions.length && <p className="muted">No files.</p>}
              {prescriptions.length > 0 && (
                <>
                  <div className="rxfiles">{prescriptions.map((p, i) => <RxFile key={p.id} file={p} index={i} />)}</div>
                  <small className="muted">Click a page to open it full size.</small>
                </>
              )}
              <div className="lbl mt">Customer note</div>
              <p>{o.note || '—'}</p>
            </div>
          )}
          <div className="card pad">
            <h2 className="h3">Deliver to</h2>
            <p className="addr">
              <b>{o.customer_name}</b><br />{o.address || '—'}<br />{o.district} · courier {o.delivery_days}<br />
              <a href={`tel:${(o.phone || '').replace(/\s/g, '')}`}>{o.phone || '—'}</a>
            </p>
            <p className="muted strong">Payment: {o.pay_method === 'cod' ? `Cash on delivery — collect ${rs(o.total)}` : 'Card — paid'}</p>
            {!isPh && o.note && <div className="note">Note: {o.note}</div>}
          </div>
        </div>

        <div className="stack">
          <div className="card pad">
            <div className="row-between">
              <h2 className="h3">{role === 'delivery' ? 'Package contents' : 'Medicines in this order'}</h2>
              <small className="muted">{count} items</small>
            </div>
            {!items.length && <div className="note">No medicines yet.{canEdit ? ' Search below and add what the prescription lists.' : ''}</div>}
            {items.map(i => (
              <div className="sline" key={i.id}>
                <img src={i.image_url} alt="" />
                <div>
                  <b>{i.name} {i.rx_required && <span className="rx">Prescription</span>}</b>
                  <small>{i.pack_size} · {rs(i.price)} each · {i.added_by === 'pharmacist' ? 'added by pharmacist' : 'added by customer'}</small>
                </div>
                {canEdit ? (
                  <div className="qty qty-sm">
                    <button disabled={busy} onClick={() => act(() => api.patch(`${base}/items/${i.id}`, { quantity: i.quantity - 1 }))} aria-label={`Remove one ${i.name}`}><Icon name="minus" size={13} /></button>
                    <span>{i.quantity}</span>
                    <button disabled={busy} onClick={() => act(() => api.patch(`${base}/items/${i.id}`, { quantity: i.quantity + 1 }))} aria-label={`Add one ${i.name}`}><Icon name="plus" size={13} /></button>
                    <button className="rm" disabled={busy} onClick={() => act(() => api.delete(`${base}/items/${i.id}`), `${i.name} removed`)} aria-label={`Remove ${i.name}`}><Icon name="trash" size={15} /></button>
                  </div>
                ) : (
                  <span className="muted">× {i.quantity}</span>
                )}
                <b className="sline-total">{rs(i.line_total)}</b>
              </div>
            ))}
            <div className="row-between total"><span>Order total</span><span>{rs(o.total)}</span></div>
          </div>

          {canEdit && (
            <div className="card pad">
              <h2 className="h3">Add medicine</h2>
              <label className="search">
                <Icon name="search" />
                <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search any medicine — e.g. Metformin, Vitamin D3" aria-label="Search medicines" />
              </label>
              <small className="muted">{q ? `${results.length} match${results.length === 1 ? '' : 'es'}` : 'Prescription medicines — search to find any product'}</small>
              <div className="results">
                {results.map(m => {
                  const inO = items.find(i => i.medicine_id === m.id)
                  return (
                    <div className="res" key={m.id}>
                      <img src={m.image_url} alt="" />
                      <div>
                        <b>{m.name} {m.rx_required && <span className="rx">Prescription</span>} {inO && <span className="bytag">In order × {inO.quantity}</span>}</b>
                        <small>{m.pack_size} · {m.stock > 0 ? `${m.stock} in stock` : 'out of stock'}</small>
                      </div>
                      <span className="strong">{rs(m.price)}</span>
                      <button className="addb" disabled={busy || m.stock <= 0} onClick={() => act(() => api.post(`${base}/items`, { medicine_id: m.id, quantity: 1 }), `${m.name} added`)}><Icon name="plus" size={14} /> Add</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {isPh && !canEdit && s !== 'delivered' && <div className="note">{['rejected', 'cancelled'].includes(s) ? 'This order is closed.' : 'Items are locked once the order is packed.'}</div>}
          {showChat && isPh && <ChatPanel orderNo={o.order_no} asDrawer={false} onClose={() => setShowChat(false)} />}
        </div>

        <div className="stack">
          <div className="card pad">
            <h2 className="h3">Order status</h2>
            <ul className="mini-steps">
              {steps.map(st => (
                <li key={st.label} className={st.done ? 'is-done' : st.current ? 'is-current' : ''}>
                  <span className="ms-dot">{st.done && <Icon name="check" size={12} stroke={3.4} />}</span>
                  <b>{st.label}</b>
                  <small>{st.time}</small>
                </li>
              ))}
            </ul>
            {isPh && s === 'awaiting_review' && (
              <>
                <button className="btn btn-block" disabled={busy} onClick={() => act(() => api.post(`${base}/verify`), 'Order verified')}>{o.type === 'prescription' ? 'Verify prescription' : 'Confirm order'}</button>
                {o.type === 'prescription' && <button className="btnr btn-block" disabled={busy} onClick={reject}>Reject prescription</button>}
              </>
            )}
            {isPh && s === 'verified' && (
              <>
                <button className="btn btn-block" disabled={busy || !items.length} onClick={() => act(() => api.post(`${base}/pack`), 'Packed and handed to delivery')}>Pack &amp; hand to delivery</button>
                {!items.length && <div className="note warn">Add at least one medicine before packing.</div>}
              </>
            )}
            {role === 'pharmacist' && ['packed', 'picked_up', 'out_for_delivery'].includes(s) && <div className="note">Handed to delivery. The delivery team updates tracking from here.</div>}
            {role === 'delivery' && ['awaiting_review', 'verified'].includes(s) && <div className="note warn">Waiting for the pharmacist to pack this order.</div>}
            {s === 'delivered' && <div className="note ok">Order complete — delivered{o.received_by ? ` to ${o.received_by}` : ''}.</div>}
          </div>

          {isDel && idx >= 2 && (
            <div className="card pad">
              <div className="row-between"><h2 className="h3">Delivery</h2><small className="muted">Estimated {o.eta}</small></div>
              <div className="lbl">Delivery checklist — tick each step</div>
              <div className="checks">
                {checks.map((c, i) => (
                  <button key={c.label} className={`check ${c.done ? 'is-done' : ''} ${i === nextCheck && tickable(i) ? 'is-next' : ''}`} disabled={busy || !tickable(i)} onClick={() => tick(i)} role="checkbox" aria-checked={c.done}>
                    <span className="check-box">{c.done && <Icon name="check" size={14} stroke={3.4} />}</span>
                    <span><b>{c.label}</b><small>{c.hint}</small></span>
                  </button>
                ))}
              </div>

              {['packed', 'picked_up'].includes(s) && (
                <>
                  <div className="lbl">{o.rider ? 'Change rider' : 'Assign rider'}</div>
                  <div className="riders">
                    {riders.map(r => (
                      <button key={r.id} className={`rsel ${o.rider?.id === r.id ? 'is-on' : ''}`} disabled={busy} aria-pressed={o.rider?.id === r.id} onClick={() => o.rider?.id !== r.id && act(() => api.post(`${base}/rider`, { rider_id: r.id }), `${r.name} assigned`)}>
                        <span className="avatar avatar-blue">{initials(r.name)}</span>
                        <span><b>{r.name}</b><small>{r.vehicle} · {r.load} active</small></span>
                      </button>
                    ))}
                    {!riders.length && <p className="muted">No active riders. Ask the admin to add one.</p>}
                  </div>
                </>
              )}

              {s === 'out_for_delivery' && (
                <>
                  <label className="field-wrap">
                    <span className="lbl">Received by (optional)</span>
                    <input className="field" value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="Name of the person who received it" />
                  </label>
                  <div className="lbl">Delivery attempt failed?</div>
                  <div className="row gap-s wrap">
                    {FAIL_REASONS.map(r => (
                      <button key={r} className="chip chip-warn" disabled={busy} onClick={() => act(() => api.post(`${base}/failed`, { reason: r }), 'Failed attempt recorded')}>{r}</button>
                    ))}
                  </div>
                </>
              )}

              {s !== 'delivered' && (
                <form className="row gap-s" onSubmit={saveEta}>
                  <input className="field" value={eta} onChange={e => setEta(e.target.value)} placeholder="New delivery date, e.g. Saturday, 3 October" aria-label="New delivery date" />
                  <button className="btn2" disabled={busy || eta.trim().length < 3}>Save</button>
                </form>
              )}

              <form className="stack-s" onSubmit={postUpdate}>
                <div className="lbl">Post a tracking update</div>
                <input className="field" value={upd.title} onChange={e => setUpd({ ...upd, title: e.target.value })} placeholder="Title — e.g. Arrived at Kandy hub" aria-label="Update title" maxLength={200} />
                <input className="field" value={upd.note} onChange={e => setUpd({ ...upd, note: e.target.value })} placeholder="Details the customer will see (optional)" aria-label="Update details" maxLength={300} />
                <button className="btn2" disabled={busy || !upd.title.trim()}>Post update</button>
              </form>
            </div>
          )}

          {role === 'admin' && (
            <div className="card pad">
              <h2 className="h3">Admin controls</h2>
              <div className="lbl">Correct the status</div>
              <div className="row gap-s wrap">
                {FLOW.map(v => (
                  <button key={v} className={`chip ${s === v ? 'chip-on' : ''}`} disabled={busy || s === v || ['rejected', 'cancelled'].includes(s)} onClick={() => act(() => api.patch(`${base}/status`, { status: v }), `Status set to ${STATUS[v].label}`)}>{STATUS[v].label}</button>
                ))}
              </div>
              {!['delivered', 'cancelled', 'rejected'].includes(s) && <button className="btnr btn-block" disabled={busy} onClick={cancel}>Cancel order</button>}
            </div>
          )}

          <div className="card pad">
            <h2 className="h3">Activity</h2>
            <ul className="activity">
              {[...events].reverse().map((e, i) => (
                <li key={i}>
                  <div className="row-between"><b>{e.title}</b><small>{fmtDateTime(e.created_at)}</small></div>
                  {e.note && <small>{e.note}</small>}
                  <small className="muted">by {e.actor_name || 'System'}</small>
                </li>
              ))}
            </ul>
            <small className="muted">Every change appears on the customer’s tracking page straight away.</small>
          </div>
        </div>
      </div>
    </>
  )
}