import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import api, { errorText } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { fmtTime } from '../utils/format'

export default function ChatPanel({ orderNo, onClose, asDrawer = true }) {
  const { user } = useAuth()
  const [msgs, setMsgs] = useState([])
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    let live = true
    const load = () => api.get(`/orders/${orderNo}/messages`)
      .then(({ data }) => live && setMsgs(data.messages))
      .catch(e => live && setErr(errorText(e)))
    load()
    const t = setInterval(load, 4000)
    return () => { live = false; clearInterval(t) }
  }, [orderNo])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [msgs])

  const send = async text => {
    const body = (text ?? draft).trim()
    if (!body) return
    setDraft('')
    try {
      const { data } = await api.post(`/orders/${orderNo}/messages`, { body })
      setMsgs(m => [...m, data.message])
    } catch (e) {
      setErr(errorText(e))
    }
  }

  const isCustomer = user.role === 'customer'
  const mine = m => (isCustomer ? m.sender_role === 'customer' : m.sender_role !== 'customer')
  const whoLabel = m => (mine(m) ? 'You' : m.sender_role === 'customer' ? m.sender_name : `${m.sender_name} · Pharmacy`)
  const chips = isCustomer
    ? ['When will my order arrive?', 'How should I take my medicine?', 'Can I change my address?']
    : ['Your order is packed and on its way.', 'Please take it after meals.', 'Could you send a clearer photo?']

  const body = (
    <div className={asDrawer ? 'drawer chat' : 'chat chat-inline card'}>
      <div className="drawer-head">
        <div className="chat-who">
          <span className="avatar avatar-green">Rx</span>
          <div>
            <h2>{isCustomer ? 'PharmaGo pharmacist' : 'Chat with customer'}</h2>
            <small>About order {orderNo}</small>
          </div>
        </div>
        {onClose && <button className="xbtn" onClick={onClose} aria-label="Close chat"><Icon name="close" /></button>}
      </div>

      <div className="chat-list" ref={listRef}>
        {!msgs.length && <p className="muted center">{isCustomer ? 'Ask a pharmacist about this order. We usually reply within a few minutes.' : 'No messages yet.'}</p>}
        {msgs.map(m => (
          <div key={m.id} className={`bubble ${mine(m) ? 'bubble-me' : ''}`}>
            <p>{m.body}</p>
            <small>{whoLabel(m)} · {fmtTime(m.created_at)}</small>
          </div>
        ))}
      </div>

      {err && <div className="alert">{err}</div>}
      <div className="chat-chips">
        {chips.map(c => <button key={c} className="chip" onClick={() => send(c)}>{c}</button>)}
      </div>
      <form className="chat-form" onSubmit={e => { e.preventDefault(); send() }}>
        <input className="field" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message…" aria-label="Type a message" maxLength={1000} />
        <button className="sendb" aria-label="Send message"><Icon name="send" /></button>
      </form>
    </div>
  )

  if (!asDrawer) return body

  return (
    <div className="overlay">
      <button className="overlay-bg" onClick={onClose} aria-label="Close chat" />
      <div role="dialog" aria-modal="true" aria-label="Chat">{body}</div>
    </div>
  )
}