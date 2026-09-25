import { Link } from 'react-router-dom'
import PrescriptionUploader from '../components/PrescriptionUploader'

const STEPS = [
  ['Upload your prescription', 'A clear photo or PDF of your doctor’s prescription — every page'],
  ['Pharmacist checks authenticity', 'Doctor details, date and dosage verified · usually 2–4 hours'],
  ['Medicines added to your order', 'Review items and prices, then confirm and pay'],
  ['Packed and delivered', 'Track each stage and see your delivery date'],
]

export default function UploadPrescription() {
  return (
    <section className="d-wrap d-rx-grid d-rx-page">
      <div>
        <div className="d-cap"><Link to="/">Home</Link> <span>/</span> Prescription order</div>
        <h1 className="d-h2" style={{ marginBottom: 22 }}>Some medicines need a prescription. We make it simple.</h1>
        <p className="d-p" style={{ margin: '0 0 40px' }}>Medicines marked <span className="d-rx">Prescription Required</span> can only be ordered with a valid doctor’s prescription. Upload it once and a licensed pharmacist checks it’s genuine, then adds the approved medicines to your order. You don’t need to choose the medicines yourself.</p>
        <div className="d-steps">
          {STEPS.map(([t, d], i) => (
            <div className="d-step" key={t}><span className="d-step-n">{String(i + 1).padStart(2, '0')}</span><div><b>{t}</b><small>{d}</small></div></div>
          ))}
        </div>
      </div>
      <PrescriptionUploader />
    </section>
  )
}