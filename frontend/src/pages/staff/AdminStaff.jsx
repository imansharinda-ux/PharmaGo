import { useEffect, useState } from 'react'
import api, { errorText } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { initials } from '../../utils/format'

const ROLES = [['pharmacist', 'Pharmacist'], ['delivery', 'Delivery master'], ['rider', 'Rider'], ['admin', 'Admin']]
const EMPTY = { name: '', email: '', password: '', phone: '', vehicle: 'Motorbike', role: 'pharmacist' }

export default function AdminStaff() {
  const { user } = useAuth()
  const toast = useToast()
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.get('/staff').then(({ data }) => setStaff(data.staff)).catch(e => setErr(errorText(e)))

  useEffect(() => { load() }, [])

  const set = k => e => { setForm({ ...form, [k]: e.target.value }); setErr('') }

  const add = async e => {
    e.preventDefault()
    if (form.name.trim().length < 3) return setErr('Enter a full name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return setErr('Enter a valid email.')
    if (form.password.length < 6) return setErr('Set a temporary password of at least 6 characters.')
    setBusy(true)
    try {
      const { data } = await api.post('/staff', form)
      toast(`${data.staff.name} added — they can log in with ${data.staff.email}`)
      setForm({ ...EMPTY, role: form.role })
      load()
    } catch (e2) {
      setErr(errorText(e2))
    } finally {
      setBusy(false)
    }
  }

  const toggle = async s => {
    try {
      const { data } = await api.patch(`/staff/${s.id}`, { active: !s.active })
      toast(data.message)
      load()
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const workLabel = s => (s.role === 'rider' ? 'deliveries' : s.role === 'admin' ? 'actions' : 'orders')

  return (
    <>
      <div className="section-head">
        <div>
          <div className="cap">Admin console</div>
          <h1 className="h1">Staff &amp; riders</h1>
          <p className="muted">Add pharmacists, delivery masters, riders and admins, or turn off an account.</p>
        </div>
      </div>

      <div className="staff-grid">
        <form className="card form-card" onSubmit={add}>
          <h2 className="h3">Add a staff member</h2>
          <div className="lbl">Role</div>
          <div className="row gap-s wrap">
            {ROLES.map(([v, l]) => (
              <button type="button" key={v} className={`chip ${form.role === v ? 'chip-on' : ''}`} aria-pressed={form.role === v} onClick={() => setForm({ ...form, role: v })}>{l}</button>
            ))}
          </div>
          <label className="field-wrap"><span className="lbl">Full name</span><input className="field" value={form.name} onChange={set('name')} /></label>
          <label className="field-wrap"><span className="lbl">Work email</span><input className="field" type="email" value={form.email} onChange={set('email')} placeholder="name@pharmago.lk" /></label>
          <label className="field-wrap"><span className="lbl">Temporary password</span><input className="field" value={form.password} onChange={set('password')} placeholder="At least 6 characters" /></label>
          {form.role === 'rider' && (
            <div className="grid-2">
              <label className="field-wrap"><span className="lbl">Phone</span><input className="field" type="tel" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" /></label>
              <label className="field-wrap"><span className="lbl">Vehicle</span>
                <select className="field" value={form.vehicle} onChange={set('vehicle')}>
                  <option>Motorbike</option>
                  <option>Three-wheeler</option>
                  <option>Van</option>
                </select>
              </label>
            </div>
          )}
          {err && <div className="alert" role="alert">{err}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add staff member'}</button>
          {form.role === 'rider' && <small className="muted">Riders don’t log in. The delivery master assigns them to orders.</small>}
        </form>

        <div className="card table-card">
          <div className="srow thead"><span>Name</span><span>Role</span><span>Email</span><span>Work</span><span>Account</span></div>
          {staff.map(s => (
            <div className={`srow ${s.active ? '' : 'is-off'}`} key={s.id}>
              <span data-label="Name" className="row gap-s"><span className="avatar">{initials(s.name)}</span><b>{s.name}</b></span>
              <span data-label="Role">{s.role_label}{s.vehicle ? ` · ${s.vehicle}` : ''}</span>
              <span data-label="Email" className="muted ellipsis">{s.email}</span>
              <span data-label="Work" className="muted">{s.work} {workLabel(s)}</span>
              <span>
                {s.id === user.id
                  ? <span className="tgl tgl-on">You</span>
                  : <button className={`tgl ${s.active ? 'tgl-on' : 'tgl-off'}`} onClick={() => toggle(s)} aria-label={`${s.active ? 'Disable' : 'Enable'} ${s.name}`}>{s.active ? 'Active' : 'Disabled'}</button>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}