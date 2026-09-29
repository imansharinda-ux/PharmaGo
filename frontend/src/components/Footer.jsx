import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="d-footer">
      <div className="d-wrap d-footer-in">
        <div className="d-footer-top">
          <div className="d-footer-brand">
            <Logo />
            <p>Online medicine ordering and delivery, with licensed pharmacists behind every order.</p>
          </div>
          <div className="d-footer-cols">
            <div className="d-footer-col">
              <span className="d-link">Shop</span>
              <Link className="d-flink" to="/shop?category=rx">Prescription medicines</Link>
              <Link className="d-flink" to="/shop?category=otc">Over-the-counter</Link>
              <Link className="d-flink" to="/shop?category=beauty">Beauty &amp; skin care</Link>
              <Link className="d-flink" to="/shop?category=support">Supports &amp; braces</Link>
            </div>
            <div className="d-footer-col">
              <span className="d-link">Orders</span>
              <Link className="d-flink" to="/prescription">Upload prescription</Link>
              <Link className="d-flink" to="/track">Track an order</Link>
              <Link className="d-flink" to="/orders">My orders</Link>
            </div>
            <div className="d-footer-col">
              <span className="d-link">Contact</span>
              <a className="d-flink" href="tel:+94788709802">+94 78 870 9802</a>
              <a className="d-flink" href="mailto:imansharinda@gmail.com">imansharinda@gmail.com</a>
              <Link className="d-flink" to="/contact">No. 23, Galle Road, Galle</Link>
            </div>
          </div>
        </div>
        <div className="d-footer-copy">© {new Date().getFullYear()} PharmaGo · All rights reserved.</div>
      </div>
    </footer>
  )
}
