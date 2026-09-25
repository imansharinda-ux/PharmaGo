import { useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import api, { errorText } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { CATEGORIES } from '../../utils/format'

const EMPTY = { name: '', pack_size: '', label: '', price: '', stock: '100', category: 'otc', rx_required: false }
const PER_PAGE = 12

export default function AdminProducts() {
  const toast = useToast()
  const [list, setList] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [edits, setEdits] = useState({})

  const load = () => api.get('/medicines?include_inactive=1').then(({ data }) => setList(data.medicines)).catch(e => setErr(errorText(e)))

  useEffect(() => { load() }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const set = k => e => { setForm({ ...form, [k]: e.target.value }); setErr('') }

  const pickImage = e => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (!/^image\//.test(f.type)) { setErr('Product photo must be an image'); return }
    setImage(f)
    setPreview(URL.createObjectURL(f))
  }

  const add = async e => {
    e.preventDefault()
    if (form.name.trim().length < 3) return setErr('Enter the product name.')
    if (!(Number(form.price) > 0)) return setErr('Enter a price in rupees.')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (image) fd.append('image', image)
    setBusy(true)
    try {
      const { data } = await api.post('/medicines', fd)
      toast(`${data.medicine.name} added to the shop`)
      setForm(EMPTY)
      setImage(null)
      setPreview('')
      load()
    } catch (e2) {
      setErr(errorText(e2))
    } finally {
      setBusy(false)
    }
  }

  const save = async (m, patch, msg) => {
    try {
      const { data } = await api.put(`/medicines/${m.id}`, patch)
      setList(l => l.map(x => (x.id === m.id ? { ...x, ...data.medicine } : x)))
      setEdits(ed => {
        const next = { ...ed }
        delete next[m.id]
        return next
      })
      toast(msg)
    } catch (e) {
      toast(errorText(e), 'error')
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return list.filter(m => !s || `${m.name} ${m.pack_size} ${m.label}`.toLowerCase().includes(s))
  }, [list, q])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pg = Math.min(page, pages - 1)
  const rows = filtered.slice(pg * PER_PAGE, pg * PER_PAGE + PER_PAGE)

  return (
    <>
      <div className="section-head">
        <div>
          <div className="cap">Admin console</div>
          <h1 className="h1">Products &amp; stock</h1>
          <p className="muted">Add new medicines, change prices and stock. Orders keep the price they were placed at.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={add}>
        <h2 className="h3">Add a new product to the shop</h2>
        <div className="newprod">
          <label className="photo-pick">
            {preview ? <img src={preview} alt="New product" /> : <span><Icon name="image" size={24} /><small>Add photo</small></span>}
            <input className="sr-file" type="file" accept="image/*" onChange={pickImage} />
          </label>
          <div className="grid-2">
            <label className="field-wrap"><span className="lbl">Product name</span><input className="field" value={form.name} onChange={set('name')} placeholder="e.g. Loratadine 10mg" /></label>
            <label className="field-wrap"><span className="lbl">Pack size</span><input className="field" value={form.pack_size} onChange={set('pack_size')} placeholder="e.g. Strip of 10 tablets" /></label>
            <label className="field-wrap"><span className="lbl">Label on card</span><input className="field" value={form.label} onChange={set('label')} placeholder="e.g. Allergy" /></label>
            <label className="field-wrap"><span className="lbl">Price (Rs.)</span><input className="field" type="number" min="1" value={form.price} onChange={set('price')} placeholder="e.g. 120" /></label>
            <label className="field-wrap"><span className="lbl">Stock</span><input className="field" type="number" min="0" value={form.stock} onChange={set('stock')} /></label>
            <label className="field-wrap"><span className="lbl">Category</span>
              <select className="field" value={form.rx_required ? 'rx' : form.category} onChange={e => setForm({ ...form, category: e.target.value, rx_required: e.target.value === 'rx' })}>
                {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          </div>
        </div>
        <label className="checkline">
          <input type="checkbox" checked={form.rx_required} onChange={e => setForm({ ...form, rx_required: e.target.checked, category: e.target.checked ? 'rx' : 'otc' })} />
          <span><b>Prescription required</b><small>Customers can’t add it to the cart. A pharmacist adds it from a prescription.</small></span>
        </label>
        {err && <div className="alert" role="alert">{err}</div>}
        <div><button className="btn" disabled={busy}>{busy ? 'Adding…' : 'Add to shop'}</button></div>
      </form>

      <div className="tabs-row mt">
        <span className="muted">{filtered.length} products</span>
        <label className="search search-sm">
          <Icon name="search" size={16} />
          <input type="search" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} placeholder="Search products" aria-label="Search products" />
        </label>
      </div>

      <div className="card table-card">
        <div className="prow thead"><span /><span>Product</span><span>Type</span><span>Price (Rs.)</span><span>Stock</span><span>Sold</span><span>Shop</span></div>
        {rows.map(m => {
          const ed = edits[m.id] || {}
          const price = ed.price ?? m.price
          const stock = ed.stock ?? m.stock
          const changed = ed.price !== undefined || ed.stock !== undefined
          const setEd = (k, v) => setEdits({ ...edits, [m.id]: { ...ed, [k]: v } })
          return (
            <div className={`prow ${m.active ? '' : 'is-off'}`} key={m.id}>
              <img src={m.image_url || '/favicon.svg'} alt="" />
              <span data-label="Product"><b>{m.name}</b><small>{m.pack_size}</small></span>
              <span data-label="Type"><span className={m.rx_required ? 'rx' : 'bytag'}>{m.rx_required ? 'Prescription' : 'Over the counter'}</span></span>
              <span data-label="Price"><input className="pin" type="number" min="1" value={price} onChange={e => setEd('price', e.target.value)} aria-label={`Price of ${m.name}`} /></span>
              <span data-label="Stock"><input className="pin" type="number" min="0" value={stock} onChange={e => setEd('stock', e.target.value)} aria-label={`Stock of ${m.name}`} /></span>
              <span data-label="Sold" className="muted">{m.sold}</span>
              <span className="row gap-s">
                {changed && <button className="btn btn-sm" onClick={() => save(m, { price: Number(price), stock: Number(stock) }, `${m.name} updated`)}>Save</button>}
                <button className={`tgl ${m.active ? 'tgl-on' : 'tgl-off'}`} onClick={() => save(m, { active: !m.active }, m.active ? `${m.name} hidden from the shop` : `${m.name} back in the shop`)}>{m.active ? 'Visible' : 'Hidden'}</button>
              </span>
            </div>
          )
        })}
        {!rows.length && <div className="empty"><b>No products match.</b></div>}
      </div>

      <div className="row-between mt">
        <span className="muted">{filtered.length ? `Showing ${pg * PER_PAGE + 1}–${Math.min(filtered.length, pg * PER_PAGE + PER_PAGE)} of ${filtered.length}` : ''}</span>
        <div className="row gap-s">
          <button className="btn2 btn-sm" disabled={pg === 0} onClick={() => setPage(pg - 1)}>← Previous</button>
          <button className="btn2 btn-sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next →</button>
        </div>
      </div>
    </>
  )
}