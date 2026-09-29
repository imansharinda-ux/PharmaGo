import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { rs } from '../utils/format'

export default function ProductCard({ p }) {
  const cart = useCart()
  const toast = useToast()
  const { isStaff } = useAuth()
  const q = cart.qtyOf(p.id)
  const out = p.stock <= 0

  const addOne = () => {
    cart.add(p)
    toast(`${p.name} added to your cart`)
  }
  const plus = () => {
    if (q < p.stock) cart.setQty(p.id, q + 1)
    else toast(`Only ${p.stock} in stock`, 'error')
  }

  let action = null
  if (p.rx_required) action = <Link className="lnk" to="/prescription">Pharmacist adds</Link>
  else if (out) action = <span className="oos">Out of stock</span>
  else if (!isStaff && q > 0) action = (
    <div className="qty">
      <button onClick={() => cart.setQty(p.id, q - 1)} aria-label={`Remove one ${p.name}`}><Icon name="minus" size={14} /></button>
      <span>{q}</span>
      <button onClick={plus} aria-label={`Add one more ${p.name}`}><Icon name="plus" size={14} /></button>
    </div>
  )
  else if (!isStaff) action = <button className="addb" onClick={addOne}><Icon name="plus" size={14} /> Add to cart</button>

  return (
    <article className="pcard">
      <div className="pcard-img"><img src={p.image_url || '/favicon.svg'} alt={p.name} loading="lazy" /></div>
      <div className="pcard-label">{p.label}</div>
      <h3 className="pcard-name">{p.name}</h3>
      <div className="pcard-meta">{p.pack_size}</div>
      {p.rx_required && <span className="rx">Prescription required</span>}
      <div className="pcard-foot">
        <span className="pcard-price">{rs(p.price)}</span>
        {action}
      </div>
    </article>
  )
}