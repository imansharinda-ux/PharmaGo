import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import loginImg from '../assets/login.jpg'
import Logo from '../components/Logo'
import Icon from '../components/Icon'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth, homeFor } from '../context/AuthContext'
import { errorText } from '../api/client'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={homeFor(user)} replace />

  const submit = async e => {
    e.preventDefault()
    if (!email.trim() || !password) { setErr('Enter your email and password.'); return }
    setBusy(true); setErr('')
    try {
      const u = await login(email.trim(), password)
      const from = loc.state?.from
      nav(u.role === 'customer' && from ? from : homeFor(u), { replace: true })
    } catch (e2) { setErr(errorText(e2)) } finally { setBusy(false) }
  }

  return (
    <div className="login">
      <div className="login-art">
        <div className="login-art-copy">
          <Logo />
          <h1>Your pharmacy,<br />in your pocket.</h1>
          <p>Order medicines, upload prescriptions and track every delivery from one account.</p>
        </div>
        <div className="login-art-pic"><img src={loginImg} alt="" /></div>
      </div>
      <div className="login-side">
        <div className="login-top">
          <ThemeToggle />
          <Link to="/" className="login-home"><Icon name="home" size={16} /> Back to home</Link>
        </div>
        <form className="login-card card" onSubmit={submit}>
          <div className="cap">Welcome back</div>
          <h2 className="h1">PharmaGo</h2>
          <label className="field-wrap"><span className="lbl">Email address</span>
            <input className="field" type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} autoComplete="username" placeholder="you@example.com" />
          </label>
          <label className="field-wrap"><span className="lbl">Password</span>
            <span className="pw">
              <input className="field" type={show ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErr('') }} autoComplete="current-password" placeholder="Enter your password" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name="eye" size={19} /></button>
            </span>
          </label>
          {err && <div className="alert" role="alert">{err}</div>}
          <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <p className="center muted">New to PharmaGo? <Link to="/register">Create an account</Link></p>
          <div className="note"><Icon name="shield" size={16} /> Your prescriptions and order history are private — only you and our licensed pharmacists can see them.</div>
        </form>
      </div>
    </div>
  )
}