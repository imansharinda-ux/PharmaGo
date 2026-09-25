import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

const TOPICS = ['Order or delivery', 'Prescription upload', 'Medicine question for a pharmacist', 'Returns and refunds', 'Something else']
const MAP_URL = 'https://maps.google.com/?q=No.+23+Galle+Road+Galle+Sri+Lanka'

export default function Contact() {
  const { user } = useAuth()
  const blank = { name: user?.name || '', phone: user?.phone || '', email: user?.email || '', topic: TOPICS[0], message: '' }
  const [form, setForm] = useState(blank)
  const [sent, setSent] = useState(false)
  const [tried, setTried] = useState(false)
  const set = k => e => setForm({ ...form, [k]: e.target.value })
  const errs = {
    name: form.name.trim().length < 2 && 'Enter your name',
    email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && 'Enter a valid email',
    message: form.message.trim().length < 5 && 'Write a short message',
  }
  const valid = !errs.name && !errs.email && !errs.message

  const send = e => {
    e.preventDefault()
    setTried(true)
    if (!valid) return
    const body = encodeURIComponent(`${form.message}\n\n${form.name}\n${form.phone}\n${form.email}`)
    window.location.href = `mailto:imansharinda@gmail.com?subject=${encodeURIComponent(`PharmaGo: ${form.topic}`)}&body=${body}`
    setSent(true)
  }
  const again = () => { setForm({ ...blank, message: '' }); setSent(false); setTried(false) }

  return (
    <>
      <div className="d-wrap d-page-head" style={{ paddingBottom: 48 }}>
        <div>
          <div className="d-cap"><Link to="/">Home</Link> <span>/</span> Contact</div>
          <h1 style={{ fontSize: 52 }}>We’re here to help</h1>
          <p>Questions about an order, a prescription or a medicine? Call, email or send us a message — a member of our team or a licensed pharmacist will get back to you.</p>
        </div>
      </div>

      <div className="d-wrap">
        <div className="d-ccards">
          <a className="d-ccard d-ccard-big" href="tel:+94788709802">
            <span className="d-cico"><Icon name="phone" size={26} /></span>
            <span className="lbl">Call us</span>
            <b>+94 78 870 9802</b>
            <small>Orders, delivery and prescription questions — talk to our team or a licensed pharmacist.</small>
            <span className="d-ccard-call">Call now</span>
            <div className="d-ccard-hours"><Icon name="clock" size={20} /> Open every day, 8:00 AM – 10:00 PM, including weekends</div>
          </a>
          <a className="d-ccard" href="mailto:imansharinda@gmail.com">
            <span className="d-cico"><Icon name="mail" size={22} /></span>
            <span className="lbl">Email us</span><b>imansharinda@gmail.com</b><small>We reply within one working day</small>
          </a>
          <a className="d-ccard" href={MAP_URL} target="_blank" rel="noopener noreferrer">
            <span className="d-cico"><Icon name="pin" size={22} /></span>
            <span className="lbl">Visit us</span><b>No. 23, Galle Road</b><small>Galle, Sri Lanka</small>
          </a>
        </div>
      </div>

      <div className="d-wrap d-contact">
        <div className="d-cform">
          {sent ? (
            <div className="d-sent">
              <span className="d-sent-ic"><Icon name="check" size={32} stroke={2.4} /></span>
              <h2>Message sent</h2>
              <p>Your email app opened with your message about “{form.topic.toLowerCase()}”. Send it from there and we’ll reply within one working day.</p>
              <button className="d-btn-o" onClick={again}>Send another message</button>
            </div>
          ) : (
            <form className="d-cform-in" onSubmit={send} noValidate>
              <div className="d-cap">Send a message</div>
              <h2>How can we help?</h2>
              <div className="grid-2">
                <label className="field-wrap"><span className="lbl">Full name</span>
                  <input className="field" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={tried && !!errs.name} />
                  {tried && errs.name && <small className="err-text">{errs.name}</small>}
                </label>
                <label className="field-wrap"><span className="lbl">Phone</span>
                  <input className="field" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="07X XXX XXXX" />
                </label>
              </div>
              <label className="field-wrap"><span className="lbl">Email</span>
                <input className="field" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={tried && !!errs.email} />
                {tried && errs.email && <small className="err-text">{errs.email}</small>}
              </label>
              <label className="field-wrap"><span className="lbl">Topic</span>
                <select className="field" value={form.topic} onChange={set('topic')}>
                  {TOPICS.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="field-wrap"><span className="lbl">Message</span>
                <textarea className="field" rows={5} value={form.message} onChange={set('message')} placeholder="Tell us how we can help" aria-invalid={tried && !!errs.message} />
                {tried && errs.message && <small className="err-text">{errs.message}</small>}
              </label>
              <div className="d-cform-foot">
                <span>Please don’t share full prescription details here — upload them securely instead.</span>
                <button className="d-btn">Send message</button>
              </div>
            </form>
          )}
        </div>

        <div className="d-cside">
          <div className="d-map">
            <svg className="d-map-bg" viewBox="0 0 460 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="460" height="320" fill="#DDE9D9" />
              <path d="M0 250 C 90 230 150 280 240 262 S 380 230 460 250 L460 320 L0 320Z" fill="#BFDDE8" />
              <path d="M-10 60 L470 150" stroke="#FFFFFF" strokeWidth="16" />
              <path d="M120 -10 L200 330" stroke="#FFFFFF" strokeWidth="12" />
              <path d="M330 -10 L300 330" stroke="#FFFFFF" strokeWidth="10" />
              <path d="M-10 190 L470 200" stroke="#FFFFFF" strokeWidth="8" />
              <rect x="30" y="80" width="70" height="46" rx="6" fill="#CFE0CA" /><rect x="220" y="30" width="80" height="60" rx="6" fill="#CFE0CA" /><rect x="350" y="170" width="80" height="40" rx="6" fill="#CFE0CA" /><rect x="40" y="200" width="60" height="36" rx="6" fill="#CFE0CA" />
              <text x="238" y="302" fontFamily="Work Sans, sans-serif" fontSize="12" letterSpacing="2" fill="#5A7F8C">INDIAN OCEAN</text>
              <text x="20" y="54" fontFamily="Work Sans, sans-serif" fontSize="11" letterSpacing="1.5" fill="#6B6B6B" transform="rotate(10 20 54)">GALLE ROAD</text>
            </svg>
            <div className="d-pin">
              <span>PharmaGo · Galle</span>
              <svg width="34" height="44" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 31s-10-10-10-18a10 10 0 0 1 20 0c0 8-10 18-10 18z" fill="#2F7D4F" /><circle cx="12" cy="12" r="4" fill="#FFFFFF" /></svg>
            </div>
            <a className="d-btn-o" href={MAP_URL} target="_blank" rel="noopener noreferrer">Open in Maps</a>
          </div>
          <div className="d-help">
            <div className="lbl" style={{ marginBottom: 6 }}>Quick help</div>
            <Link className="d-faq" to="/track">Where is my order? <Icon name="arrowRight" size={16} /></Link>
            <Link className="d-faq" to="/prescription">How do I upload a prescription? <Icon name="arrowRight" size={16} /></Link>
            <Link className="d-faq" to="/shop">Browse medicines and products <Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </div>
    </>
  )
}