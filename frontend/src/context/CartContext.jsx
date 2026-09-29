import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const read = () => {
  try { return JSON.parse(localStorage.getItem('pg_cart')) || [] } catch { return [] }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(read)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('pg_cart', JSON.stringify(items)) } catch { return }
  }, [items])

  const value = useMemo(() => {
    const add = (product, qty = 1) => setItems(list => {
      const ex = list.find(i => i.id === product.id)
      if (ex) return list.map(i => i.id === product.id ? { ...i, quantity: Math.min(50, i.quantity + qty) } : i)
      return [...list, { id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url, pack_size: product.pack_size, quantity: qty }]
    })
    const setQty = (id, qty) => setItems(list => qty <= 0 ? list.filter(i => i.id !== id) : list.map(i => i.id === id ? { ...i, quantity: Math.min(50, qty) } : i))
    const remove = id => setItems(list => list.filter(i => i.id !== id))
    const clear = () => setItems([])
    const count = items.reduce((a, i) => a + i.quantity, 0)
    const total = items.reduce((a, i) => a + i.price * i.quantity, 0)
    const qtyOf = id => items.find(i => i.id === id)?.quantity || 0
    return { items, add, setQty, remove, clear, count, total, qtyOf, open, setOpen }
  }, [items, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)