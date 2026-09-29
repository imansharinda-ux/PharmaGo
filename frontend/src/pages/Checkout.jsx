import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import api, { errorText } from '../api/client'
import { DISTRICTS, daysFor, rs } from '../utils/format'

const PAY = [['card', 'Card', 'Visa, Mastercard, Amex'], ['cod', 'Cash on delivery', 'Pay the rider']]

export default function Checkout() {
  const { user } = useAuth()
  const cart = useCart()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({ customer_name: user.name || '', phone: user.phone || '', address: user.address || '', district: user.district || 'Colombo', note: '', pay_method: 'card' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => { setF({ ...f, [k]: e.target.value }); setErr('') }

  if (!cart.items.length) {
    return (
      <section className="container narrow center section">
        <h1 className="h1">Your cart is empty</h1>
        <p className="muted">Add products from the shop to check out.</p>
        <Link className="btn" to="/shop">Go to the shop</Link>
      </section>
    )
  }

  const submit = async e => {
    e.preventDefault()
    if (f.customer_name.trim().length < 3) return setErr('Please enter your full name.')
    if (!/^\+?\d[\d\s-]{8,}$/.test(f.phone.trim())) return setErr('Please enter a valid mobile number, e.g. 077 123 4567.')
    if (f.address.trim().length < 5) return setErr('Please enter your street address.')
    setBusy(true)
    try {
      const { data } = await api.post('/orders', { ...f, items: cart.items.map(i => ({ medicine_id: i.id, quantity: i.quantity })) })
      cart.clear()
      toast(`Order ${data.order.order_no} placed`)
      nav(`/orders/${data.order.order_no}`)
    } catch (e2) {
      setErr(errorText(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container section">
      <button className="lnk" onClick={() => nav('/shop')}>← Continue shopping</button>
      <h1 className="h1">Checkout</h1>
      <form className="checkout" onSubmit={submit}>
        <div className="card form-card">
          <h2 className="h3">Delivery details</h2>
          <div className="grid-2">
            <label className="field-wrap"><span className="lbl">Full name</span><input className="field" value={f.customer_name} onChange={set('customer_name')} autoComplete="name" /></label>
            <label className="field-wrap"><span className="lbl">Mobile number</span><input className="field" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="07X XXX XXXX" /></label>
          </div>
          <label className="field-wrap"><span className="lbl">Street address</span><input className="field" value={f.address} onChange={set('address')} autoComplete="street-address" placeholder="House no., street, city" /></label>
          <div className="grid-2">
            <label className="field-wrap"><span className="lbl">District</span>
              <select className="field" value={f.district} onChange={set('district')}>{DISTRICTS.map(d => <option key={d} value={d}>{d} — {daysFor(d)}</option>)}</select>
            </label>
            <label className="field-wrap"><span className="lbl">Delivery note (optional)</span><input className="field" value={f.note} onChange={set('note')} placeholder="e.g. Call on arrival" maxLength={300} /></label>
          </div>
          <h2 className="h3">Payment</h2>
          <div className="grid-2">
            {PAY.map(([v, t, s]) => (
              <button type="button" key={v} className={`paycard ${f.pay_method === v ? 'is-on' : ''}`} onClick={() => setF({ ...f, pay_method: v })} aria-pressed={f.pay_method === v}>
                <span className="radio" />
                <span><b>{t}</b><small>{s}</small></span>
              </button>
            ))}
          </div>
          {err && <div className="alert" role="alert">{err}</div>}
        </div>
        <aside className="card summary">
          <h2 className="h3">Order summary</h2>
          {cart.items.map(i => (
            <div className="sline" key={i.id}>
              <img src={i.image_url} alt="" />
              <div><b>{i.name}</b><small>Qty {i.quantity} · {rs(i.price)} each</small></div>
              <b>{rs(i.price * i.quantity)}</b>
            </div>
          ))}
          <div className="row-between muted"><span>Subtotal</span><span>{rs(cart.total)}</span></div>
          <div className="row-between muted"><span>Delivery</span><span className="green">Free</span></div>
          <div className="row-between total"><span>Total</span><span>{rs(cart.total)}</span></div>
          <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Placing order…' : `Place order · ${rs(cart.total)}`}</button>
          <p className="tip"><Icon name="shield" size={16} /> A pharmacist checks every order before it’s packed.</p>
        </aside>
      </form>
    </section>
  )
}