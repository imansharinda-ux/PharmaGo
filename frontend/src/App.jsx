import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import StaffLayout from './components/StaffLayout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import UploadPrescription from './pages/UploadPrescription'
import MyOrders from './pages/MyOrders'
import OrderTracking from './pages/OrderTracking'
import TrackLookup from './pages/TrackLookup'
import NotFound from './pages/NotFound'
import StaffOrders from './pages/staff/StaffOrders'
import StaffOrderDetail from './pages/staff/StaffOrderDetail'
import AdminProducts from './pages/staff/AdminProducts'
import AdminStaff from './pages/staff/AdminStaff'

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="page"><Outlet /></main>
      <Footer />
      <CartDrawer />
    </>
  )
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/prescription" element={<UploadPrescription />} />
          <Route path="/track" element={<TrackLookup />} />
          <Route path="/track/:orderNo" element={<TrackLookup />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={['customer']}><MyOrders /></ProtectedRoute>} />
          <Route path="/orders/:orderNo" element={<ProtectedRoute roles={['customer']}><OrderTracking /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute roles={['pharmacist', 'delivery', 'admin']}><StaffLayout /></ProtectedRoute>}>
          <Route path="/staff" element={<StaffOrders />} />
          <Route path="/staff/orders/:orderNo" element={<StaffOrderDetail />} />
          <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute roles={['admin']}><AdminStaff /></ProtectedRoute>} />
        </Route>
      </Routes>
    </>
  )
}