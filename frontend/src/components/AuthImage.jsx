import { useEffect, useState } from 'react'
import api from '../api/client'

export function useProtectedFile(url) {
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!url) return undefined
    let obj = null
    let live = true
    api.get(url.replace(/^\/api/, ''), { responseType: 'blob' })
      .then(res => {
        if (!live) return
        obj = URL.createObjectURL(res.data)
        setSrc(obj)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [url])

  return { src, failed }
}

export default function RxFile({ file, index }) {
  const { src, failed } = useProtectedFile(file.url)
  const isImg = /^image\//.test(file.mime_type || '')
  const label = `Open page ${index + 1}: ${file.original_name}`
  const placeholder = failed ? 'Can’t load' : isImg ? 'Loading…' : 'PDF'

  return (
    <a className="rxfile" href={src || undefined} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {isImg && src ? <img src={src} alt={`Prescription page ${index + 1}`} /> : <span className={`rxfile-ph ${isImg ? '' : 'rxfile-pdf'}`}>{placeholder}</span>}
      <span className="rxfile-name">{file.original_name}</span>
    </a>
  )
}