import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

const CONSOLE = {
  pharmacist: { label: 'Pharmacist console', cls: 'snav-ph', links: [['/staff', 'Orders']] },
  delivery: { label: 'Delivery console', cls: 'snav-del', links: [['/staff', 'Deliveries']] },
  admin: { label: 'Admin console', cls: 'snav-adm', links: [['/staff', 'Dashboard'], ['/admin/products', 'Products'], ['/admin/staff', 'Staff']] },
}

const ROLE = { pharmacist: 'Pharmacist', delivery: 'Delivery master', admin: 'Admin' }

export default function StaffLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const c = CONSOLE[user.role]

  return (
    <div className="staff">
      <header className={`snav ${c.cls}`}>
        <div className="snav-in">
          <div className="snav-brand">
            <Logo light to="/staff" />
            <span className="snav-badge">{c.label}</span>
          </div>
          <button className="nav-burger nav-burger-light" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
          <nav className={`snav-links ${open ? 'is-open' : ''}`} aria-label="Staff">
            {c.links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/staff'} onClick={() => setOpen(false)}>{label}</NavLink>
            ))}
            <span className="snav-user">
              <span className="avatar avatar-light">{initials(user.name)}</span>
              <span><b>{user.name}</b><small>{ROLE[user.role]}</small></span>
            </span>
            <button className="snav-out" onClick={() => { logout(); nav('/login') }}>
              <Icon name="logout" size={16} /> Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="container staff-main">
        <Outlet />
      </main>
    </div>
  )
}