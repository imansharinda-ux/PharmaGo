import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero.jpg'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import PrescriptionUploader from '../components/PrescriptionUploader'
import api from '../api/client'
import { CATEGORIES } from '../utils/format'

const CAT_DESC = {
  rx: 'Order with a pharmacist-verified prescription',
  otc: 'Pain relief, cold & flu, allergy',
  vit: 'Immunity, energy and everyday wellness',
  beauty: 'Cetaphil, CeraVe, sunscreen and more',
  support: 'Knee, shoulder, ankle and back',
  personal: 'Oral care and hygiene',
  baby: 'Baby care and maternal health',
  device: 'BP monitors, thermometers, first aid',
}

const HOW = [
  ['Create an account', 'Sign up with your email and delivery address.'],
  ['Add items or upload a prescription', 'Everyday products go in your cart; prescriptions go to our pharmacist.'],
  ['Pharmacist verification', 'A licensed pharmacist checks every order before it is packed.'],
  ['Pay & confirm', 'Pay by card or choose cash on delivery.'],
  ['Track & receive', 'Follow each step until it reaches your door.'],
]

export default function Home() {
  const [popular, setPopular] = useState([])
  const [trackNo, setTrackNo] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.get('/medicines')
      .then(({ data }) => setPopular(data.medicines.filter(m => !m.rx_required).slice(0, 8)))
      .catch(() => {})
  }, [])

  const norm = trackNo.trim().toUpperCase().replace(/\s+/g, '').replace(/^PG(?!-)/, 'PG-')
  const validNo = /^PG-\d{5}$/.test(norm)

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="cap">Online pharmacy · Sri Lanka</div>
            <h1>Your pharmacy,<br />delivered to your door.</h1>
            <p>Order everyday health products, upload your prescription for a licensed pharmacist to check, and follow every step until it arrives.</p>
            <div className="hero-cta">
              <Link className="btn btn-lg" to="/shop">Shop now</Link>
              <Link className="btn2 btn-lg" to="/prescription"><Icon name="upload" /> Upload prescription</Link>
            </div>
            <ul className="hero-points">
              <li><Icon name="shield" /> Licensed pharmacists</li>
              <li><Icon name="truck" /> Colombo 1 day · others 2–3 days</li>
              <li><Icon name="clock" /> Live order tracking</li>
            </ul>
          </div>
          <div className="hero-media">
            <img src={heroImg} alt="The PharmaGo app on a phone, surrounded by medicine bottles and capsules" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div><div className="cap">Categories</div><h2 className="h2">Shop by category</h2></div>
          <Link className="lnk" to="/shop">View all products →</Link>
        </div>
        <div className="cat-grid">
          {CATEGORIES.filter(c => c.id !== 'all').map((c, i) => (
            <Link key={c.id} className="cat-tile" to={`/shop?category=${c.id}`}>
              <span className="cat-num">{String(i + 1).padStart(2, '0')}</span>
              <b>{c.label}</b>
              <small>{CAT_DESC[c.id]}</small>
              <span className="cat-go"><Icon name="arrowRight" size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="band" id="prescription">
        <div className="container rx-grid">
          <div>
            <div className="cap">Prescription medicines</div>
            <h2 className="h2">Some medicines need a prescription. We make it simple.</h2>
            <p className="lead">Medicines marked <span className="rx">Prescription required</span> are added by our pharmacist after checking your doctor’s prescription.</p>
            <ol className="steps">
              <li><span>01</span><div><b>Upload your prescription</b><small>Take a photo or choose a file — every page</small></div></li>
              <li><span>02</span><div><b>Pharmacist checks it</b><small>Doctor details, date and dosage verified</small></div></li>
              <li><span>03</span><div><b>Medicines added to your order</b><small>You can see every item and the total</small></div></li>
              <li><span>04</span><div><b>Packed and delivered</b><small>Track each stage on your order page</small></div></li>
            </ol>
          </div>
          <div className="card upcard">
            <h3 className="h3">New prescription</h3>
            <PrescriptionUploader compact />
          </div>
        </div>
      </section>

      {popular.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <div><div className="cap">Popular</div><h2 className="h2">Everyday essentials</h2></div>
            <Link className="lnk" to="/shop">Browse the shop →</Link>
          </div>
          <div className="pgrid">{popular.map(p => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}

      <section className="container section">
        <div className="section-head">
          <div><div className="cap">How to order</div><h2 className="h2">Five simple steps</h2></div>
        </div>
        <div className="how-grid">
          {HOW.map(([t, d], i) => (
            <div key={t} className="how card">
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{t}</b>
              <small>{d}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="container track-grid">
          <div>
            <div className="cap">Order tracking</div>
            <h2 className="h2">Always know where your order is.</h2>
            <p className="lead">Every order has its own tracking page — pharmacist checks, packing, your rider and the delivery date, updated as they happen.</p>
            <div className="kv"><span>Colombo &amp; suburbs</span><b>1 day</b></div>
            <div className="kv"><span>Other districts</span><b>2–3 days</b></div>
          </div>
          <form className="card track-card" onSubmit={e => { e.preventDefault(); if (validNo) nav(`/track/${norm}`) }}>
            <h3 className="h3"><Icon name="truck" /> Track your order</h3>
            <label className="field-wrap">
              <span className="lbl">Order number</span>
              <input className="field field-lg" value={trackNo} onChange={e => setTrackNo(e.target.value)} placeholder="e.g. PG-10002" aria-invalid={!!trackNo && !validNo} />
            </label>
            <small className={trackNo && !validNo ? 'err-text' : 'muted'}>
              {trackNo && !validNo ? 'Use PG followed by 5 digits, e.g. PG-10002' : 'You’ll find it in your order confirmation.'}
            </small>
            <button className="btn btn-block" disabled={!validNo}>Track order</button>
          </form>
        </div>
      </section>

      <section className="container section">
        <div className="cta card">
          <div>
            <h2 className="h2">Have a prescription ready?</h2>
            <p className="muted">Upload it now — a pharmacist will check it and prepare your order.</p>
          </div>
          <Link className="btn btn-lg" to="/prescription">Upload prescription</Link>
        </div>
      </section>
    </>
  )
}