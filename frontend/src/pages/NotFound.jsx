import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container narrow center pad-xl">
      <div className="cap">404</div>
      <h1 className="h1">This page doesn’t exist</h1>
      <p className="muted">The link may be old or mistyped.</p>
      <Link className="btn" to="/">Back to home</Link>
    </section>
  )
}