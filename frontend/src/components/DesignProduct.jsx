import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { rs, TINTS } from '../utils/format'

export function useBuy(p) {
  const cart = useCart()
  const toast = useToast()
  const q = cart.qtyOf(p.id)
  const add = (n = 1) => {
    if (q + n > p.stock) { toast(`Only ${p.stock} in stock`, 'error'); return }
    cart.add(p, n)
    toast(`${p.name} added to your cart`)
  }
  const set = n => (n > p.stock ? toast(`Only ${p.stock} in stock`, 'error') : cart.setQty(p.id, n))
  return { q, add, set }
}

export default function DesignProduct({ p, onQuick, shop = false }) {
  const { isStaff } = useAuth()
  const { q, add, set } = useBuy(p)
  const out = p.stock <= 0

  return (
    <article className="d-prod">
      <div className="d-pimg" style={{ background: shop ? TINTS[p.category] || '#EEF3EC' : '#EEF3EC' }}>
        {onQuick && (
          <button className="d-qv" onClick={() => onQuick(p)} aria-label={`Quick view ${p.name}`}>
            <Icon name="eye" size={15} /> Quick view
          </button>
        )}
        {shop && p.rx_required && <span className="d-rx">Prescription</span>}
        <img src={p.image_url || '/products/placeholder.svg'} alt={p.name} loading="lazy" />
      </div>
      <span className="d-brand">{p.label}</span>
      <span className="d-pname">{p.name}</span>
      <span className="d-pmeta">{p.pack_size}</span>
      <div className="d-pfoot">
        <span className="d-price">{rs(p.price)}</span>
        {p.rx_required ? (
          <Link className="d-rxnote" to="/prescription"><Icon name="shield" size={14} /> Pharmacist adds</Link>
        ) : out ? (
          <span className="d-oos">Out of stock</span>
        ) : isStaff ? null : q > 0 ? (
          <div className="d-incart">
            <button className="d-cq" onClick={() => set(q - 1)} aria-label={`Remove one ${p.name}`}>−</button>
            <span aria-live="polite" style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{q}</span>
            <button className="d-cq" onClick={() => set(q + 1)} aria-label={`Add one more ${p.name}`}>+</button>
          </div>
        ) : shop ? (
          <button className="d-addb" onClick={() => add()}>Add +</button>
        ) : (
          <button className="d-tlink" onClick={() => add()}>Add to cart +</button>
        )}
      </div>
    </article>
  )
}