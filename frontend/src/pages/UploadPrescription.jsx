import PrescriptionUploader from '../components/PrescriptionUploader'

export default function UploadPrescription() {
  return (
    <section className="container section rx-page">
      <div>
        <div className="cap">Prescription order</div>
        <h1 className="h1">Upload your prescription</h1>
        <p className="lead">A licensed pharmacist checks it, adds the right medicines to your order and lets you know the total. You don’t need to choose the medicines yourself.</p>
        <ol className="steps">
          <li><span>01</span><div><b>Add every page</b><small>Take a photo, choose one from your gallery or pick a PDF</small></div></li>
          <li><span>02</span><div><b>Pharmacist verifies it</b><small>Doctor details, date and dosage are checked</small></div></li>
          <li><span>03</span><div><b>Track your order</b><small>See the medicines, total and delivery on your order page</small></div></li>
        </ol>
      </div>
      <div className="card upcard"><PrescriptionUploader /></div>
    </section>
  )
}