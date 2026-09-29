import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DesignProduct from '../components/DesignProduct'
import QuickView from '../components/QuickView'
import Icon from '../components/Icon'
import api, { errorText } from '../api/client'
import { CATEGORIES, CAT_DESC } from '../utils/format'

const PER_PAGE = 12
const SORTS = [['popular', 'Popular'], ['low', 'Price low to high'], ['high', 'Price high to low']]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const cat = params.get('category') || 'all'
  const [all, setAll] = useState([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('popular')
  const [rxOnly, setRxOnly] = useState(false)
  const [noRx, setNoRx] = useState(false)
  const [limit, setLimit] = useState(PER_PAGE)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [quick, setQuick] = useState(null)

  useEffect(() => {
    api.get('/medicines').then(({ data }) => setAll(data.medicines)).catch(e => setErr(errorText(e))).finally(() => setLoading(false))
  }, [])
  useEffect(() => { setLimit(PER_PAGE) }, [cat, q, sort, rxOnly, noRx])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    let l = all.filter(p =>
      (cat === 'all' || p.category === cat) &&
      (!s || `${p.name} ${p.pack_size} ${p.label}`.toLowerCase().includes(s)) &&
      (!rxOnly || p.rx_required) && (!noRx || !p.rx_required))
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price)
    return l
  }, [all, cat, q, sort, rxOnly, noRx])

  const count = id => (id === 'all' ? all.length : all.filter(p => p.category === id).length)
  const title = CATEGORIES.find(c => c.id === cat)?.label || 'All products'
  const desc = cat === 'all'
    ? 'Browse every medicine and health product we deliver. Prescription medicines are added by our pharmacist after checking your prescription.'
    : cat === 'rx'
      ? 'These medicines can’t be added to the cart. Upload your prescription and a pharmacist adds them to your order.'
      : CAT_DESC[cat]
  const shown = list.slice(0, limit)

  return (
    <>
      <div className="d-wrap d-page-head">
        <div>
          <div className="d-cap"><Link to="/">Home</Link> <span>/</span> <Link to="/shop">Shop</Link>{cat !== 'all' && <> <span>/</span> {title}</>}</div>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        <label className="d-search">
          <Icon name="search" size={18} />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
        </label>
      </div>

      <div className="d-wrap d-shop">
        <aside className="d-side" aria-label="Filters">
          <div className="d-panel">
            <div className="d-panel-t">Categories</div>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`d-catbtn ${cat === c.id ? 'on' : ''}`} onClick={() => setParams(c.id === 'all' ? {} : { category: c.id })}>
                {c.label}<span>{count(c.id)}</span>
              </button>
            ))}
          </div>
          <div className="d-panel d-filter">
            <div className="d-panel-t">Filter</div>
            <label><input type="checkbox" checked={rxOnly} onChange={e => { setRxOnly(e.target.checked); if (e.target.checked) setNoRx(false) }} /> Prescription required only</label>
            <label><input type="checkbox" checked={noRx} onChange={e => { setNoRx(e.target.checked); if (e.target.checked) setRxOnly(false) }} /> No prescription needed</label>
          </div>
          <Link className="d-promo" to="/prescription">
            <small>Prescription medicines</small>
            <b>Have a prescription? Upload it and our pharmacist does the rest.</b>
            <span>Upload prescription →</span>
          </Link>
        </aside>

        <div className="d-products">
          <div className="d-shop-bar">
            <span>{loading ? 'Loading…' : <>Showing <strong>{shown.length}</strong> of <strong>{list.length}</strong> products</>}</span>
            <div className="d-sorts">
              <span>Sort by</span>
              {SORTS.map(([id, label]) => (
                <button key={id} className={`d-sortb ${sort === id ? 'on' : ''}`} onClick={() => setSort(id)}>{label}</button>
              ))}
            </div>
          </div>
          {err && <div className="alert">{err}</div>}
          {!loading && !list.length && !err && <div className="d-empty"><b>No products match your search.</b></div>}
          <div className="d-prod-grid d-prod-grid-3">
            {shown.map(p => <DesignProduct key={p.id} p={p} shop onQuick={setQuick} />)}
          </div>
          {list.length > limit && (
            <div className="d-more"><button className="d-morebtn" onClick={() => setLimit(limit + PER_PAGE)}>Load more products</button></div>
          )}
        </div>
      </div>

      {quick && <QuickView p={quick} onClose={() => setQuick(null)} />}
    </>
  )
}