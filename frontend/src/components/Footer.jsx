import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p className="footer-text">Your pharmacy, delivered. Medicines checked by licensed pharmacists and brought to your door.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/shop?category=rx">Prescription medicines</Link>
          <Link to="/shop?category=otc">Over-the-counter</Link>
          <Link to="/shop?category=vit">Vitamins</Link>
          <Link to="/shop?category=beauty">Beauty &amp; skin care</Link>
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/prescription">Upload prescription</Link>
          <Link to="/track">Track an order</Link>
          <Link to="/contact">Contact us</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <a href="tel:+94788709802"><Icon name="phone" size={15} /> +94 78 870 9802</a>
          <a href="mailto:imansharinda@gmail.com"><Icon name="mail" size={15} /> imansharinda@gmail.com</a>
          <span><Icon name="pin" size={15} /> No. 23, Galle Road, Galle, Sri Lanka</span>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} PharmaGo · EC5207 Group 71</div>
    </footer>
  )
}