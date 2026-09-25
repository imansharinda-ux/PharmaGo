import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useBuy } from './DesignProduct'
import { useAuth } from '../context/AuthContext'
import { rs, TINTS, CATEGORIES } from '../utils/format'

export default function QuickView({ p, onClose }) {
  const { isStaff } = useAuth()
  const { add } = useBuy(p)
  const [n, setN] = useState(1)
  const cat = CATEGORIES.find(c => c.id === p.category)?.label || 'Product'
  const out = p.stock <= 0

  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [])

  return (
    <div className="d-qv-wrap" role="dialog" aria-modal="true" aria-label={p.name}>
      <button className="d-qv-bg" onClick={onClose} aria-label="Close" />
      <div className="d-qv-card">
        <button className="d-qv-close" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        <div className="d-qv-img" style={{ background: TINTS[p.category] || '#EEF3EC' }}>
          {p.rx_required && <span className="d-rx">Prescription</span>}
          <img src={p.image_url || '/products/placeholder.svg'} alt={p.name} />
        </div>
        <div className="d-qv-body">
          <span className="d-brand">{p.label} · {cat}</span>
          <h2>{p.name}</h2>
          <span className="d-pmeta">{p.pack_size}</span>
          <div className="d-qv-price">{rs(p.price)}</div>
          <p className="d-qv-desc">
            {p.rx_required
              ? 'This medicine needs a valid prescription. Upload your prescription and a licensed pharmacist checks it and adds this medicine to your order.'
              : `${p.name} — ${(p.pack_size || '').toLowerCase()}. Sold and delivered by PharmaGo, checked by our pharmacist before it is packed.`}
          </p>
          <div className="d-qv-facts">
            <span><Icon name="check" size={16} /> {out ? 'Out of stock right now' : `In stock (${p.stock} available)`}</span>
            <span><Icon name="check" size={16} /> Delivered in 1–3 days</span>
            <span><Icon name="check" size={16} /> Genuine product from a licensed distributor</span>
          </div>
          {p.rx_required ? (
            <div className="d-qv-rx">
              <Icon name="shield" size={22} />
              <div>
                <b>Added by our pharmacist</b>
                <p>Upload your prescription and we add this medicine for you.</p>
                <Link className="d-tlink" to="/prescription" onClick={onClose}>Upload prescription →</Link>
              </div>
            </div>
          ) : !isStaff && !out && (
            <div className="d-qv-buy">
              <div className="d-qv-qty">
                <button onClick={() => setN(Math.max(1, n - 1))} aria-label="Less">−</button>
                <span aria-live="polite">{n}</span>
                <button onClick={() => setN(Math.min(p.stock, n + 1))} aria-label="More">+</button>
              </div>
              <button className="d-btn" style={{ flex: 1 }} onClick={() => { add(n); onClose() }}>Add to cart · {rs(p.price * n)}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}