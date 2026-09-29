import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'
import { useAuth, homeFor } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { CATEGORIES, CAT_DESC } from '../utils/format'

export default function Navbar() {
  const { user, logout, isStaff } = useAuth()
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const close = () => setOpen(false)
  const doLogout = () => { logout(); close(); nav('/') }
  const cls = ({ isActive }) => `d-link ${isActive ? 'active' : ''}`

  return (
    <header className="d-nav-wrap">
      <div className="d-nav">
        <Logo />
        <button className="d-burger" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
        <nav className={`d-links ${open ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end className={cls} onClick={close}>Home</NavLink>
          <div className="d-dd">
            <NavLink to="/shop" className={cls} onClick={close}>
              Shop <svg className="d-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </NavLink>
            <div className="d-dd-menu">
              <div className="d-dd-grid">
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <Link key={c.id} to={`/shop?category=${c.id}`} className="d-dd-item" onClick={close}>
                    <span className="d-dd-dot" />
                    <span><b>{c.label}</b><small>{CAT_DESC[c.id]}</small></span>
                  </Link>
                ))}
              </div>
              <Link to="/prescription" className="d-dd-promo" onClick={close}>
                <small>Prescription medicines</small>
                <b>Upload once — our pharmacist does the rest.</b>
                <span>Upload prescription →</span>
              </Link>
            </div>
          </div>
          <NavLink to="/prescription" className={cls} onClick={close}>Prescriptions</NavLink>
          <NavLink to="/track" className={cls} onClick={close}>Track order</NavLink>
          <NavLink to="/contact" className={cls} onClick={close}>Contact</NavLink>
          <span className="d-sep" aria-hidden="true" />
            <ThemeToggle />
          {!isStaff && (
            <button className="d-link" onClick={() => { cart.setOpen(true); close() }} aria-label={`Cart, ${cart.count} items`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
              ({cart.count})
            </button>
          )}
          {user ? (
            <>
              <NavLink to={homeFor(user)} className={cls} onClick={close}>{user.role === 'customer' ? 'My orders' : 'Staff console'}</NavLink>
              <button className="d-link" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <NavLink to="/login" className={cls} onClick={close}>Log in</NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}