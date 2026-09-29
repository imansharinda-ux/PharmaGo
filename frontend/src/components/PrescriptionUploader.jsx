import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon'
import api, { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { DISTRICTS, daysFor, fmtSize } from '../utils/format'

const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024

export default function PrescriptionUploader({ compact = false }) {
  const { user } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const loc = useLocation()
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const [district, setDistrict] = useState(user?.district || 'Colombo')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [cam, setCam] = useState(false)
  const [camMsg, setCamMsg] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const captureRef = useRef(null)

  useEffect(() => () => files.forEach(f => f.url && URL.revokeObjectURL(f.url)), [files])
  useEffect(() => () => stopCam(), [])

  const addFiles = list => {
    const errs = []
    const next = [...files]
    Array.from(list || []).forEach(file => {
      const isImg = /^image\//.test(file.type)
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      if (!isImg && !isPdf) return errs.push(`${file.name} is not a photo or PDF`)
      if (file.size > MAX_SIZE) return errs.push(`${file.name} is larger than 10 MB`)
      if (next.length >= MAX_FILES) return errs.push(`You can add up to ${MAX_FILES} files`)
      if (next.some(f => f.file.name === file.name && f.file.size === file.size)) return
      next.push({ file, isImg, url: isImg ? URL.createObjectURL(file) : null })
    })
    setFiles(next)
    setError([...new Set(errs)].join(' · '))
  }
  const removeAt = i => { const f = files[i]; if (f.url) URL.revokeObjectURL(f.url); setFiles(files.filter((_, j) => j !== i)); setError('') }
  const pick = e => { addFiles(e.target.files); e.target.value = '' }

  async function openCam() {
    setCamMsg('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setCam(true)
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) } }, 50)
    } catch {
      captureRef.current?.click()
      setCamMsg('Live camera isn’t available, so your device’s camera or photo picker opened instead.')
    }
  }
  function stopCam() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCam(false)
  }
  function snap() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob(b => {
      if (!b) return
      addFiles([new File([b], `prescription-photo-${files.length + 1}.jpg`, { type: 'image/jpeg' })])
      stopCam()
    }, 'image/jpeg', 0.92)
  }

  async function send() {
    if (!user) { nav('/login', { state: { from: loc.pathname } }); return }
    if (user.role !== 'customer') { setError('Only customer accounts can upload prescriptions.'); return }
    if (!files.length) { setError('Add a photo or PDF of your prescription first'); return }
    const fd = new FormData()
    files.forEach(f => fd.append('files', f.file))
    fd.append('district', district)
    fd.append('note', note)
    setSending(true)
    try {
      const { data } = await api.post('/orders/prescription', fd)
      toast(`Order ${data.order.order_no} sent to the pharmacist`)
      setFiles([])
      nav(`/orders/${data.order.order_no}`)
    } catch (e) {
      setError(errorText(e))
    } finally { setSending(false) }
  }

  return (
    <div className="d-upcard">
      <div className="d-up-head">
        <div className="d-up-title">
          <span className="d-ic-box"><Icon name="file" size={20} /></span>
          <div><b>New prescription</b><small>Checked by a licensed pharmacist</small></div>
        </div>
        <span className="d-enc"><Icon name="shield" size={13} /> Encrypted</span>
      </div>

      {cam ? (
        <div className="d-camera">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="camera-bar">
            <button type="button" className="btn2" onClick={stopCam}>Cancel</button>
            <button type="button" className="btn" onClick={snap}><span className="snap-dot" /> Capture</button>
          </div>
        </div>
      ) : (
        <div
          className={`d-dz ${over ? 'is-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files) }}
        >
          <svg className="d-dz-border" aria-hidden="true">
            <rect x="0" y="0" width="100%" height="100%" rx="17" fill="none" stroke="#8CC7A0" strokeWidth="1.6" strokeDasharray="8 8" />
          </svg>
          <div className="d-dz-ic" aria-hidden="true">
            <div className="d-doc-back" />
            <div className="d-doc"><b>Rx</b><i /><i style={{ width: '80%' }} /><i style={{ width: '60%' }} /><i style={{ width: '70%' }} /></div>
            <div className="d-doc-up"><Icon name="upload" size={18} stroke={2.2} /></div>
          </div>
          <div className="d-dz-title">Drop your prescription here</div>
          <div className="d-dz-sub">
            or <label className="d-linkbtn">browse your files
              <input className="sr-file" type="file" accept="image/*,application/pdf" multiple onChange={pick} />
            </label>
          </div>
          <div className="d-chips">
            <span className="d-chip">JPG</span><span className="d-chip">PNG</span><span className="d-chip">PDF</span><span className="d-chip">Max 10 MB</span>
          </div>
        </div>
      )}

      <div className="d-up-btns">
        <button type="button" className="d-btn2m" onClick={openCam}><Icon name="camera" size={18} /> Take a photo</button>
        <label className="d-btnm"><Icon name="image" size={18} /> Choose file
          <input className="sr-file" type="file" accept="image/*" multiple onChange={pick} />
        </label>
      </div>
      <input ref={captureRef} className="sr-only" type="file" accept="image/*" capture="environment" tabIndex={-1} aria-hidden="true" onChange={pick} />
      {camMsg && <div className="note">{camMsg}</div>}

      {files.length > 0 && (
        <>
          <div className="d-hr" />
          <div className="d-up-list-head"><span>Added pages</span><small className="muted">{files.length} of {MAX_FILES}</small></div>
          <div>
            {files.map((f, i) => (
              <div className="d-uprow" key={f.file.name + f.file.size}>
                {f.isImg ? <img src={f.url} alt={`Preview of ${f.file.name}`} /> : <span className="d-fpdf">PDF</span>}
                <div><b>{f.file.name}</b><small>Page {i + 1} · {fmtSize(f.file.size)}</small></div>
                <button className="rm" onClick={() => removeAt(i)} aria-label={`Remove ${f.file.name}`}><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
        </>
      )}
      {error && <div className="alert" role="alert">{error}</div>}

      <label className="field-wrap"><span className="lbl">Deliver to</span>
        <select className="field" value={district} onChange={e => setDistrict(e.target.value)}>
          {DISTRICTS.map(d => <option key={d} value={d}>{d} — {daysFor(d)}</option>)}
        </select>
      </label>
      {!compact && (
        <label className="field-wrap"><span className="lbl">Note for the pharmacist (optional)</span>
          <input className="field" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Generic brand is fine" maxLength={300} />
        </label>
      )}
      <button className="d-btn" onClick={send} disabled={sending} style={{ width: '100%' }}>
        {sending ? 'Sending…' : user ? 'Send to pharmacist' : 'Log in to send'} <Icon name="arrowRight" size={16} />
      </button>
      <div className="d-tipbox"><Icon name="shield" size={16} /> Make sure the doctor’s signature, date and dosage are clearly visible in the photo.</div>
    </div>
  )
}