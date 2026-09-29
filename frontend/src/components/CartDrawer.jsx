import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useCart } from '../context/CartContext'
import { rs } from '../utils/format'

export default function CartDrawer() {
  const cart = useCart()
  const nav = useNavigate()

  useEffect(() => {
    if (!cart.open) return undefined
    const onKey = e => e.key === 'Escape' && cart.setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cart])

  if (!cart.open) return null

  const go = path => {
    cart.setOpen(false)
    nav(path)
  }

  return (
    <div className="overlay">
      <button className="overlay-bg" onClick={() => cart.setOpen(false)} aria-label="Close cart" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="drawer-head">
          <div>
            <h2>Your cart</h2>
            <small>{cart.count ? `${cart.count} item${cart.count > 1 ? 's' : ''}` : 'No items yet'}</small>
          </div>
          <button className="xbtn" onClick={() => cart.setOpen(false)} aria-label="Close cart"><Icon name="close" /></button>
        </div>

        <div className="drawer-body">
          {!cart.items.length && (
            <div className="empty">
              <span className="empty-ic"><Icon name="cart" size={26} /></span>
              <b>Your cart is empty</b>
              <p>Add everyday products from the shop. Prescription medicines are added by our pharmacist.</p>
              <button className="btn" onClick={() => go('/shop')}>Browse the shop</button>
            </div>
          )}
          {cart.items.map(i => (
            <div className="cline" key={i.id}>
              <img src={i.image_url} alt="" />
              <div className="cline-main">
                <b>{i.name}</b>
                <small>{i.pack_size} · {rs(i.price)}</small>
                <div className="qty qty-sm">
                  <button onClick={() => cart.setQty(i.id, i.quantity - 1)} aria-label={`Remove one ${i.name}`}><Icon name="minus" size={13} /></button>
                  <span>{i.quantity}</span>
                  <button onClick={() => cart.setQty(i.id, i.quantity + 1)} aria-label={`Add one more ${i.name}`}><Icon name="plus" size={13} /></button>
                  <button className="rm" onClick={() => cart.remove(i.id)} aria-label={`Remove ${i.name}`}><Icon name="trash" size={15} /></button>
                </div>
              </div>
              <b>{rs(i.price * i.quantity)}</b>
            </div>
          ))}
        </div>

        {cart.items.length > 0 && (
          <div className="drawer-foot">
            <div className="row-between muted"><span>Delivery</span><span className="green">Free</span></div>
            <div className="row-between total"><span>Total</span><span>{rs(cart.total)}</span></div>
            <button className="btn btn-block" onClick={() => go('/checkout')}>Checkout</button>
            <button className="lnk center" onClick={() => go('/prescription')}>Need a prescription medicine? Upload prescription</button>
          </div>
        )}
      </aside>
    </div>
  )
}