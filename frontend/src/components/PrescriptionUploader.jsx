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

  const stopCam = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCam(false)
  }

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }, [])

  const addFiles = list => {
    const errs = []
    const next = [...files]
    Array.from(list || []).forEach(file => {
      const isImg = /^image\//.test(file.type)
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      if (!isImg && !isPdf) { errs.push(`${file.name} is not a photo or PDF`); return }
      if (file.size > MAX_SIZE) { errs.push(`${file.name} is larger than 10 MB`); return }
      if (next.length >= MAX_FILES) { errs.push(`You can add up to ${MAX_FILES} files`); return }
      if (next.some(f => f.file.name === file.name && f.file.size === file.size)) return
      next.push({ file, isImg, url: isImg ? URL.createObjectURL(file) : null })
    })
    setFiles(next)
    setError([...new Set(errs)].join(' · '))
  }

  const removeAt = i => {
    if (files[i].url) URL.revokeObjectURL(files[i].url)
    setFiles(files.filter((_, j) => j !== i))
    setError('')
  }

  const openCam = async () => {
    setCamMsg('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setCam(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 50)
    } catch {
      if (captureRef.current) captureRef.current.click()
      setCamMsg('Live camera isn’t available, so your device’s camera or photo picker opened instead.')
    }
  }

  const snap = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob(b => {
      if (!b) return
      addFiles([new File([b], `prescription-photo-${files.length + 1}.jpg`, { type: 'image/jpeg' })])
      stopCam()
    }, 'image/jpeg', 0.92)
  }

  const onPick = e => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const send = async () => {
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
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`uploader ${compact ? 'uploader-compact' : ''}`}>
      <div
        className={`dropzone ${over ? 'is-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files) }}
      >
        <span className="dz-ic"><Icon name="upload" size={22} /></span>
        <b>Drop your prescription here</b>
        <span className="muted">JPG, PNG or PDF · up to 10 MB each · up to 5 pages</span>
      </div>

      <div className="upl-options">
        <button type="button" className="opt" onClick={openCam}>
          <span className="opt-ic"><Icon name="camera" /></span><b>Take a photo</b><small>Use your camera</small>
        </button>
        <label className="opt">
          <span className="opt-ic"><Icon name="image" /></span><b>Choose file</b><small>Photos &amp; gallery</small>
          <input className="sr-file" type="file" accept="image/*" multiple onChange={onPick} />
        </label>
        <label className="opt">
          <span className="opt-ic"><Icon name="folder" /></span><b>Browse files</b><small>PDF or image</small>
          <input className="sr-file" type="file" accept="image/*,application/pdf" multiple onChange={onPick} />
        </label>
      </div>
      <input ref={captureRef} className="sr-only" type="file" accept="image/*" capture="environment" tabIndex={-1} aria-hidden="true" onChange={onPick} />

      {cam && (
        <div className="camera">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="camera-frame" aria-hidden="true" />
          <div className="camera-bar">
            <button type="button" className="btn2" onClick={stopCam}>Cancel</button>
            <button type="button" className="btn" onClick={snap}><span className="snap-dot" /> Capture</button>
          </div>
        </div>
      )}
      {camMsg && <div className="note">{camMsg}</div>}

      {files.length > 0 && (
        <ul className="filelist">
          {files.map((f, i) => (
            <li key={f.file.name + f.file.size}>
              {f.isImg ? <img src={f.url} alt={`Preview of ${f.file.name}`} /> : <span className="file-pdf">PDF</span>}
              <div><b>{f.file.name}</b><small>Page {i + 1} · {fmtSize(f.file.size)}</small></div>
              <button className="rm" onClick={() => removeAt(i)} aria-label={`Remove ${f.file.name}`}><Icon name="trash" size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="alert" role="alert">{error}</div>}

      <div className="grid-2">
        <label className="field-wrap">
          <span className="lbl">Deliver to</span>
          <select className="field" value={district} onChange={e => setDistrict(e.target.value)}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d} — {daysFor(d)}</option>)}
          </select>
        </label>
        <label className="field-wrap">
          <span className="lbl">Note for the pharmacist (optional)</span>
          <input className="field" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Generic brand is fine" maxLength={300} />
        </label>
      </div>
      <button className="btn btn-block" onClick={send} disabled={sending}>{sending ? 'Sending…' : user ? 'Send to pharmacist' : 'Log in to send'}</button>
      <p className="tip"><Icon name="shield" size={16} /> Make sure the doctor’s signature, date and dosage are clearly visible.</p>
    </div>
  )
}