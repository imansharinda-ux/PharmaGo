import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero.jpg'
import heroDark from '../assets/hero-dark.jpg'
import Icon from '../components/Icon'
import DesignProduct from '../components/DesignProduct'
import QuickView from '../components/QuickView'
import PrescriptionUploader from '../components/PrescriptionUploader'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, CAT_DESC } from '../utils/format'

const ROWS = [
  { cap: 'Beauty & skin care', title: 'Dermatologist favourites', link: 'Shop beauty', to: '/shop?category=beauty', pick: all => all.filter(p => p.category === 'beauty') },
  { cap: 'Supports & braces', title: 'Support for joints & recovery', link: 'View all supports', to: '/shop?category=support', pick: all => all.filter(p => p.category === 'support') },
  { cap: 'Medicines', title: 'Popular this week', link: 'Browse all medicines', to: '/shop?category=otc', pick: all => ['paracetamol', 'amoxicillin', 'metformin', 'vitamin c'].map(n => all.find(p => p.name.toLowerCase().startsWith(n))).filter(Boolean) },
]

const STEPS = [
  ['Create an account', 'Sign up with your email and add a delivery address.'],
  ['Add items or upload prescription', 'Add products to your cart, or upload a prescription for prescription medicines.'],
  ['Pharmacist verification', 'For prescription medicines, a pharmacist confirms your prescription is genuine.'],
  ['Pay & confirm', 'Pay by card or choose cash on delivery.'],
  ['Track & receive', 'Follow each stage until it reaches your door.'],
]

const RX_STEPS = [
  ['Upload your prescription', 'A clear photo or PDF of your doctor’s prescription'],
  ['Pharmacist checks authenticity', 'Doctor details, date and dosage verified · usually 2–4 hours'],
  ['Medicines added to your order', 'Review items and prices, then confirm and pay'],
  ['Packed and delivered', 'Track each stage and see your delivery date'],
]

const DIST = [[5, 84], [4, 11], [3, 3], [2, 1], [1, 1]]

const REVIEWS = [
  { stars: 5, name: 'Nadeesha P.', city: 'Colombo', tag: 'Prescription order', text: 'Uploaded my prescription at night and it arrived the next morning. The pharmacist messaged me to confirm the dosage.' },
  { stars: 5, name: 'Kasun R.', city: 'Kandy', tag: 'Cart order', text: 'The tracking page showed every step, even the rider and the delivery date. Very easy to use.' },
  { stars: 4, name: 'Ishara W.', city: 'Galle', tag: 'Beauty & skin care', text: 'Good prices on skin care. Delivery took two days but everything was packed well.' },
  { stars: 5, name: 'Dilshan F.', city: 'Gampaha', tag: 'Supports & braces', text: 'The knee support fitted perfectly and the chat with the pharmacist was really helpful.' },
  { stars: 4, name: 'Tharindu S.', city: 'Kurunegala', tag: 'Prescription order', text: 'My prescription was verified within a few hours. Would like more payment options.' },
  { stars: 3, name: 'Malsha K.', city: 'Matara', tag: 'Cart order', text: 'The order was correct, but I would like an evening delivery time option.' },
  { stars: 2, name: 'Ruwan J.', city: 'Jaffna', tag: 'Cart order', text: 'Delivery to Jaffna took three days. Customer service kept me updated though.' },
  { stars: 1, name: 'Sachini M.', city: 'Badulla', tag: 'Cart order', text: 'One item was out of stock after I ordered. The refund was quick, but it was disappointing.' },
]

const Stars = ({ n, size = 16 }) => (
  <span className="d-rev-stars" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(i => <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.9z" /></svg>)}
  </span>
)

const Outline = ({ children }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

export default function Home() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [all, setAll] = useState([])
  const [quick, setQuick] = useState(null)
  const [trackNo, setTrackNo] = useState('')
  const [mine, setMine] = useState([])
  const [star, setStar] = useState(null)
  const [pinned, setPinned] = useState(null)

  useEffect(() => {
    api.get('/medicines').then(({ data }) => setAll(data.medicines)).catch(() => {})
  }, [])
  useEffect(() => {
    if (user?.role === 'customer') api.get('/orders/my').then(({ data }) => setMine(data.orders.slice(0, 3).map(o => o.order_no))).catch(() => {})
  }, [user])

  const norm = trackNo.trim().toUpperCase().replace(/\s+/g, '').replace(/^PG(?!-)/, 'PG-')
  const validNo = /^PG-\d{5}$/.test(norm)
  const active = star ?? pinned
  const shownReviews = active ? REVIEWS.filter(r => r.stars === active) : REVIEWS.slice(0, 6)
  const help = !trackNo ? 'Enter the order number from your confirmation.' : validNo ? `Ready to track ${norm}` : 'Use PG followed by 5 digits, e.g. PG-10002'

  return (
    <>
      <section className="d-hero">
        <div className="d-hero-copy">
          <div className="d-cap">Your pocket pharmacy</div>
          <h1>Your pharmacy,<br />delivered to your door.</h1>
          <p>Order medicines, beauty and health essentials online. Upload a prescription and a licensed pharmacist verifies it before we deliver.</p>
          <div className="d-hero-cta">
            <Link className="d-btn" to="/shop">Shop now</Link>
            <a className="d-btn-o" href="#prescription">Upload prescription</a>
          </div>
        </div>

        <a href="#how" className="d-play" aria-label="See how PharmaGo works">
          <span className="d-play-ring" />
          <span className="d-play-bg" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1A1A" aria-hidden="true" style={{ position: 'relative', marginLeft: 4 }}><path d="M6 4l14 8-14 8z" /></svg>
        </a>

        <div className="d-scene">
          <img className="d-hero-photo is-light" src={heroImg} alt="The PharmaGo app on a phone, surrounded by medicine bottles and capsules" />
          <img className="d-hero-photo is-dark" src={heroDark} alt="" aria-hidden="true" />
          <div className="d-float d-gel" aria-hidden="true">
            <svg width="90" height="58" viewBox="0 0 90 58"><defs><radialGradient id="pgGel" cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#EFFCF3" /><stop offset=".22" stopColor="#9CDDB3" /><stop offset=".65" stopColor="#2F8A55" /><stop offset="1" stopColor="#123F25" /></radialGradient></defs><ellipse cx="45" cy="29" rx="40" ry="24" fill="url(#pgGel)" /><ellipse cx="31" cy="17" rx="14" ry="5.5" fill="#FFFFFF" opacity=".75" /><ellipse cx="58" cy="42" rx="16" ry="4" fill="#C9F2D6" opacity=".35" /></svg>
          </div>
          <div className="d-float d-tab" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 80 80"><defs><radialGradient id="pgTab" cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".6" stopColor="#EEF2EF" /><stop offset="1" stopColor="#AEB9B3" /></radialGradient></defs><circle cx="40" cy="42" r="36" fill="#8D9993" opacity=".5" /><circle cx="40" cy="38" r="36" fill="url(#pgTab)" /><circle cx="40" cy="38" r="29" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".8" /><path d="M16 38h48" stroke="#C3CCC7" strokeWidth="3" strokeLinecap="round" /><ellipse cx="30" cy="24" rx="12" ry="5" fill="#FFFFFF" opacity=".9" /></svg>
          </div>
          <div className="d-float d-caps" aria-hidden="true">
            <svg width="130" height="49" viewBox="0 0 150 56"><defs><linearGradient id="pgCapsG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#174D2E" /><stop offset=".26" stopColor="#3FA36A" /><stop offset=".38" stopColor="#B3EAC7" /><stop offset=".55" stopColor="#3A9460" /><stop offset="1" stopColor="#113A22" /></linearGradient><linearGradient id="pgCapsW" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#A9B3AD" /><stop offset=".26" stopColor="#F2F5F3" /><stop offset=".38" stopColor="#FFFFFF" /><stop offset=".6" stopColor="#E0E6E2" /><stop offset="1" stopColor="#8F9A94" /></linearGradient></defs><path d="M28 4 H75 V52 H28 A24 24 0 0 1 28 4 Z" fill="url(#pgCapsG)" /><path d="M75 4 H122 A24 24 0 0 1 122 52 H75 Z" fill="url(#pgCapsW)" /><rect x="73.5" y="4" width="3" height="48" fill="#000000" opacity=".1" /><rect x="18" y="11" width="112" height="7" rx="3.5" fill="#FFFFFF" opacity=".5" /></svg>
          </div>
        </div>
      </section>

      <div className="d-feature">
        <div className="d-feat">
          <Outline><path d="M24 5l16 6v11c0 10-7 17-16 20-9-3-16-10-16-20V11z" /><path d="M17 24l5 5 10-11" /></Outline>
          <h3>Pharmacist-verified</h3>
          <p>Every prescription is checked for authenticity by a licensed pharmacist before your medicines are packed.</p>
        </div>
        <div className="d-feat">
          <Outline><path d="M4 13h24v18H4z" /><path d="M28 19h8l6 6v6H28" /><circle cx="12" cy="34" r="4" /><circle cx="35" cy="34" r="4" /></Outline>
          <h3>Delivered in 1–3 days</h3>
          <p>Colombo and suburbs get their order the next day. Other districts receive it within two to three days.</p>
        </div>
        <div className="d-feat">
          <Outline><circle cx="24" cy="20" r="12" /><path d="M18 20l4 4 8-8" /><path d="M17 30l-4 13 11-5 11 5-4-13" /></Outline>
          <h3>Genuine products</h3>
          <p>Medicines and health products sourced only from licensed distributors, stored and handled correctly.</p>
        </div>
      </div>

      <div className="d-wrap d-stats">
        <div className="d-stat"><div className="d-stat-n">{all.length || '—'}</div><div className="d-link">Products in store</div></div>
        <div className="d-stat"><div className="d-stat-n">8</div><div className="d-link">Health categories</div></div>
        <div className="d-stat"><div className="d-stat-n">1<small> day</small></div><div className="d-link">Colombo delivery</div></div>
        <div className="d-stat"><div className="d-stat-n">100%</div><div className="d-link">Pharmacist-checked</div></div>
      </div>

      <section className="d-wrap d-cats" id="categories">
        <div className="d-center-head"><div className="d-cap">Our store</div><h2 className="d-h2">Shop by category</h2></div>
        <div className="d-cat-grid">
          {CATEGORIES.filter(c => c.id !== 'all').map((c, i) => (
            <Link key={c.id} className="d-tile" to={`/shop?category=${c.id}`}>
              <div className="d-tile-top">
                <span className="d-tile-num">{String(i + 1).padStart(2, '0')}</span>
                {c.id === 'rx' && <span className="d-rx">Prescription Required</span>}
              </div>
              <b>{c.label}</b>
              <small>{CAT_DESC[c.id]}</small>
              <span className="d-tlink" style={{ marginTop: 4 }}>Browse →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="d-rx-sec" id="prescription">
        <div className="d-wrap d-rx-grid">
          <div>
            <div className="d-cap">Prescription medicines</div>
            <h2 className="d-h2" style={{ marginBottom: 22 }}>Some medicines need a prescription. We make it simple.</h2>
            <p className="d-p" style={{ margin: '0 0 40px' }}>Medicines marked <span className="d-rx">Prescription Required</span> can only be ordered with a valid doctor’s prescription. Upload it once and a licensed pharmacist checks it’s genuine, then adds the approved medicines to your order.</p>
            <div className="d-steps">
              {RX_STEPS.map(([t, d], i) => (
                <div className="d-step" key={t}><span className="d-step-n">{String(i + 1).padStart(2, '0')}</span><div><b>{t}</b><small>{d}</small></div></div>
              ))}
            </div>
          </div>
          <PrescriptionUploader compact />
        </div>
      </section>

      {ROWS.map(row => {
        const items = row.pick(all).slice(0, 4)
        if (!items.length) return null
        return (
          <section className="d-wrap d-rows" key={row.title}>
            <div className="d-row-head">
              <div><div className="d-cap">{row.cap}</div><h2>{row.title}</h2></div>
              <Link className="d-tlink" style={{ fontSize: 12 }} to={row.to}>{row.link} →</Link>
            </div>
            <div className="d-prod-grid">{items.map(p => <DesignProduct key={p.id} p={p} onQuick={setQuick} />)}</div>
          </section>
        )
      })}

      <section className="d-how" id="how">
        <div className="d-wrap d-how-in">
          <div className="d-center-head" style={{ marginBottom: 64 }}>
            <div className="d-cap">How to order</div>
            <h2 className="d-h2" style={{ marginBottom: 14 }}>From order to your door in five steps</h2>
            <p className="d-p" style={{ margin: 0 }}>Here’s exactly what happens after you place an order.</p>
          </div>
          <div className="d-how-grid">
            {STEPS.map(([t, d], i) => (
              <div className="d-hstep" key={t}><span>{String(i + 1).padStart(2, '0')}</span><b>{t}</b><small>{d}</small></div>
            ))}
          </div>
        </div>
      </section>

      <section className="d-wrap d-split">
        <div>
          <div className="d-cap">Order tracking</div>
          <h2 className="d-h2" style={{ marginBottom: 22 }}>Always know where your order is and when it arrives.</h2>
          <p className="d-p" style={{ margin: '0 0 32px' }}>When our pharmacists finish processing your order, we work out your delivery date from your location and show it on your order page — with every stage as it happens.</p>
          <div style={{ marginBottom: 40 }}>
            <div className="d-kv"><span>Colombo &amp; suburbs</span><b>1 day</b></div>
            <div className="d-kv"><span>Other districts</span><b>2–3 days</b></div>
          </div>
          <Link className="d-btn" to="/orders">View my orders</Link>
        </div>
        <form className="d-track" onSubmit={e => { e.preventDefault(); if (validNo) nav(`/track/${norm}`) }}>
          <div className="d-track-head">
            <span className="d-ic-box" style={{ width: 48, height: 48, borderRadius: 14 }}><Icon name="truck" size={22} /></span>
            <div><b>Track your order</b><small>Enter the order number from your confirmation.</small></div>
          </div>
          <label className="field-wrap"><span className="lbl">Order number</span>
            <input value={trackNo} onChange={e => setTrackNo(e.target.value)} placeholder="e.g. PG-10002" autoComplete="off" aria-invalid={!!trackNo && !validNo} />
          </label>
          <div style={{ fontSize: 13, minHeight: 18, color: trackNo && !validNo ? '#A33A22' : validNo ? '#2F7D4F' : '#6B6B6B' }}>{help}</div>
          <button className="d-btn" disabled={!validNo} style={{ borderRadius: 10, opacity: validNo ? 1 : 0.45 }}>{validNo ? `Track ${norm}` : 'Track order'}</button>
          {mine.length > 0 && (
            <div className="d-samples">Your recent orders:
              {mine.map(n => <button type="button" key={n} onClick={() => setTrackNo(n)}>{n}</button>)}
            </div>
          )}
          <div className="d-track-foot">Your order page shows every stage live — pharmacist checks, packing, rider details and delivery updates.</div>
        </form>
      </section>

      <section className="d-wrap d-split">
        <div className="d-rating">
          <div className="d-cap">Customer ratings</div>
          <div className="d-rating-n">4.8</div>
          <div className="d-stars">
            {[0, 1, 2, 3, 4].map(i => <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.9z" /></svg>)}
          </div>
          <div className="d-flink">Based on 3,214 verified-purchase ratings</div>
          <div className="d-rev-hint">Hover over a star row to see those reviews</div>
        </div>
        <div className="d-dist" onMouseLeave={() => setStar(null)}>
          {DIST.map(([s, pct]) => (
            <button
              type="button"
              className={`d-rrow ${active === s ? 'on' : ''}`}
              key={s}
              onMouseEnter={() => setStar(s)}
              onFocus={() => setStar(s)}
              onBlur={() => setStar(null)}
              onClick={() => setPinned(pinned === s ? null : s)}
              aria-pressed={pinned === s}
            >
              <span>{s} star</span><div className="d-bar"><i style={{ width: `${pct}%` }} /></div><span>{pct}%</span>
            </button>
          ))}
        </div>
      </section>

      <section className="d-wrap d-reviews">
        <div className="d-row-head">
          <div>
            <div className="d-cap">Reviews</div>
            <h2>{active ? `${active}-star reviews` : 'What our customers say'}</h2>
          </div>
          {pinned && <button type="button" className="d-tlink" onClick={() => setPinned(null)}>Show all reviews</button>}
        </div>
        <div className="d-rev-grid">
          {shownReviews.map(r => (
            <article className="d-rev" key={r.name}>
              <div className="d-rev-top">
                <span className="d-rev-av">{r.name[0]}</span>
                <div><b>{r.name}</b><small>{r.city}</small></div>
                <Stars n={r.stars} />
              </div>
              <p>{r.text}</p>
              <span className="d-rev-tag">{r.tag}</span>
            </article>
          ))}
        </div>
      </section>

      {quick && <QuickView p={quick} onClose={() => setQuick(null)} />}
    </>
  )
}