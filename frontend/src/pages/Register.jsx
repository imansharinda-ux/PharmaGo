import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, homeFor } from '../context/AuthContext'
import { errorText } from '../api/client'
import { DISTRICTS } from '../utils/format'

export default function Register() {
  const { user, register } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', district: 'Colombo', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  const set = k => e => { setF({ ...f, [k]: e.target.value }); setErr('') }

  const submit = async e => {
    e.preventDefault()
    if (f.name.trim().length < 3) return setErr('Please enter your full name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setErr('Please enter a valid email.')
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.')
    if (f.password !== f.confirm) return setErr('The passwords don’t match.')
    setBusy(true)
    try {
      await register({ name: f.name.trim(), email: f.email.trim(), phone: f.phone, address: f.address, district: f.district, password: f.password })
      nav('/shop')
    } catch (e2) {
      setErr(errorText(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container narrow section">
      <form className="card form-card" onSubmit={submit}>
        <div className="cap">New account</div>
        <h1 className="h1">Create your account</h1>
        <div className="grid-2">
          <label className="field-wrap"><span className="lbl">Full name</span><input className="field" value={f.name} onChange={set('name')} autoComplete="name" /></label>
          <label className="field-wrap"><span className="lbl">Email</span><input className="field" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
          <label className="field-wrap"><span className="lbl">Mobile number</span><input className="field" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="07X XXX XXXX" /></label>
          <label className="field-wrap"><span className="lbl">District</span>
            <select className="field" value={f.district} onChange={set('district')}>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select>
          </label>
        </div>
        <label className="field-wrap"><span className="lbl">Street address</span><input className="field" value={f.address} onChange={set('address')} autoComplete="street-address" /></label>
        <div className="grid-2">
          <label className="field-wrap"><span className="lbl">Password</span><input className="field" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></label>
          <label className="field-wrap"><span className="lbl">Confirm password</span><input className="field" type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></label>
        </div>
        {err && <div className="alert" role="alert">{err}</div>}
        <button className="btn btn-lg" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  )
}