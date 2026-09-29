import { Link } from 'react-router-dom'

export default function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo-light' : ''}`} aria-label="PharmaGo home">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <g transform="rotate(-45 15 15)">
          <rect x="4" y="10" width="22" height="10" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M15 10h6a5 5 0 0 1 0 10h-6z" fill={light ? '#7FCB98' : '#2F7D4F'} />
        </g>
      </svg>
      <span>PharmaGo</span>
    </Link>
  )
}