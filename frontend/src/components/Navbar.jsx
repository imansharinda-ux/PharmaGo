import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { useAuth, homeFor } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { initials } from '../utils/format'

export default function Navbar() {
  const { user, logout, isStaff } = useAuth()
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const close = () => setOpen(false)
  const doLogout = () => { logout(); close(); nav('/') }

  return (
    <header className="nav">
      <div className="nav-in">
        <Logo />
        <button
          className="nav-burger"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <Icon name={open ? 'close' : 'menu'} size={22} />
        </button>
        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/shop" onClick={close}>Shop</NavLink>
          <NavLink to="/prescription" onClick={close}>Upload prescription</NavLink>
          <NavLink to="/track" onClick={close}>Track order</NavLink>
          <NavLink to="/contact" onClick={close}>Contact</NavLink>
          <span className="nav-sep" aria-hidden="true" />
          {!isStaff && (
            <button
              className="nav-cart"
              onClick={() => { cart.setOpen(true); close() }}
              aria-label={`Open cart, ${cart.count} items`}
            >
              <Icon name="cart" size={19} />
              <span className="nav-cart-label">Cart</span>
              {cart.count > 0 && <span className="badge">{cart.count}</span>}
            </button>
          )}
          {user ? (
            <>
              <Link className="nav-user" to={homeFor(user)} onClick={close}>
                <span className="avatar">{initials(user.name)}</span>
                <span>{user.role === 'customer' ? 'My orders' : 'Staff console'}</span>
              </Link>
              <button className="nav-text" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <NavLink to="/login" onClick={close}>Log in</NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}