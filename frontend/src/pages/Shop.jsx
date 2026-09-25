import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import api, { errorText } from '../api/client'
import { CATEGORIES } from '../utils/format'

const PER_PAGE = 12

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const cat = params.get('category') || 'all'
  const [all, setAll] = useState([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('popular')
  const [limit, setLimit] = useState(PER_PAGE)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/medicines')
      .then(({ data }) => setAll(data.medicines))
      .catch(e => setErr(errorText(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setLimit(PER_PAGE) }, [cat, q, sort])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    let l = all.filter(p => (cat === 'all' || p.category === cat) && (!s || `${p.name} ${p.pack_size} ${p.label}`.toLowerCase().includes(s)))
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price)
    return l
  }, [all, cat, q, sort])

  const count = id => (id === 'all' ? all.length : all.filter(p => p.category === id).length)
  const title = CATEGORIES.find(c => c.id === cat)?.label || 'All products'

  return (
    <section className="container section">
      <div className="shop-head">
        <div>
          <div className="cap">Shop</div>
          <h1 className="h1">{title}</h1>
          {cat === 'rx' && <p className="muted">These medicines can’t be added to the cart. Upload your prescription and a pharmacist adds them to your order.</p>}
        </div>
        <label className="search">
          <Icon name="search" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
        </label>
      </div>

      <div className="shop-grid">
        <aside className="shop-side" aria-label="Categories">
          {CATEGORIES.map(c => (
            <button key={c.id} className={`catbtn ${cat === c.id ? 'is-on' : ''}`} onClick={() => setParams(c.id === 'all' ? {} : { category: c.id })}>
              {c.label}<span>{count(c.id)}</span>
            </button>
          ))}
        </aside>
        <div>
          <div className="shop-bar">
            <span className="muted">{loading ? 'Loading…' : `${list.length} product${list.length === 1 ? '' : 's'}`}</span>
            <select className="field field-sm" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
              <option value="popular">Popular</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
          {err && <div className="alert">{err}</div>}
          {!loading && !list.length && !err && <div className="card empty"><b>No products match your search.</b></div>}
          <div className="pgrid pgrid-3">{list.slice(0, limit).map(p => <ProductCard key={p.id} p={p} />)}</div>
          {list.length > limit && (
            <div className="center mt"><button className="btn2" onClick={() => setLimit(limit + PER_PAGE)}>Load more products</button></div>
          )}
        </div>
      </div>
    </section>
  )
}