import { useState } from 'react'
import Icon from '../components/Icon'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const valid = form.name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && form.message.trim().length > 4

  const send = e => {
    e.preventDefault()
    if (!valid) return
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    window.location.href = `mailto:imansharinda@gmail.com?subject=${encodeURIComponent('PharmaGo enquiry')}&body=${body}`
    setSent(true)
  }

  return (
    <section className="container section">
      <div className="cap">Contact</div>
      <h1 className="h1">We’re here to help</h1>
      <p className="lead">Questions about an order, a prescription or a product? Reach us any way you like.</p>
      <div className="contact-grid">
        <a className="card ccard" href="tel:+94788709802"><Icon name="phone" size={22} /><b>Call us</b><span>+94 78 870 9802</span></a>
        <a className="card ccard" href="mailto:imansharinda@gmail.com"><Icon name="mail" size={22} /><b>Email</b><span>imansharinda@gmail.com</span></a>
        <a className="card ccard" href="https://maps.google.com/?q=No.23+Galle+Road+Galle+Sri+Lanka" target="_blank" rel="noopener noreferrer"><Icon name="pin" size={22} /><b>Visit</b><span>No. 23, Galle Road, Galle, Sri Lanka</span></a>
      </div>
      <form className="card form-card" onSubmit={send}>
        <h2 className="h3">Send us a message</h2>
        {sent && <div className="note">Your email app has opened with the message. Send it from there and we’ll reply soon.</div>}
        <div className="grid-2">
          <label className="field-wrap"><span className="lbl">Your name</span><input className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
          <label className="field-wrap"><span className="lbl">Email</span><input className="field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
        </div>
        <label className="field-wrap"><span className="lbl">Message</span><textarea className="field" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></label>
        <button className="btn" disabled={!valid}>Send message</button>
      </form>
    </section>
  )
}