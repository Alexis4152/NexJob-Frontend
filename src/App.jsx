import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotifyProvider } from './context/NotifyContext'
import { PlatformConfigProvider } from './context/PlatformConfigContext'
import PrivateRoute from './components/PrivateRoute'

import PublicLayout from './layouts/PublicLayout'
import ProviderLayout from './layouts/ProviderLayout'
import AdminLayout from './layouts/AdminLayout'

import Home from './pages/Home'
import Providers from './pages/Providers'
import ProviderDetail from './pages/ProviderDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterProvider from './pages/RegisterProvider'
import BookingNew from './pages/BookingNew'
import MyBookings from './pages/MyBookings'
import MyBookingDetail from './pages/MyBookingDetail'
import MyProfile from './pages/MyProfile'
import Help from './pages/Help'
import NotFound from './pages/NotFound'

import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderServices from './pages/provider/ProviderServices'
import ProviderServiceForm from './pages/provider/ProviderServiceForm'
import ProviderProfileEdit from './pages/provider/ProviderProfileEdit'
import ProviderBookingDetail from './pages/provider/ProviderBookingDetail'
import ProviderReviews from './pages/provider/ProviderReviews'
import ProviderCalendar from './pages/provider/ProviderCalendar'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCategories from './pages/admin/AdminCategories'
import AdminProviders from './pages/admin/AdminProviders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBookings from './pages/admin/AdminBookings'
import AdminBookingDetail from './pages/admin/AdminBookingDetail'
import AdminSupport from './pages/admin/AdminSupport'
import AdminPlatformConfig from './pages/admin/AdminPlatformConfig'

export default function App() {
  return (
    <BrowserRouter>
      <PlatformConfigProvider>
        <AuthProvider>
          <NotifyProvider>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="prestadores" element={<Providers />} />
                <Route path="prestadores/:id" element={<ProviderDetail />} />
                <Route path="login" element={<Login />} />
                <Route path="registro" element={<Register />} />
                <Route path="registro-prestador" element={<RegisterProvider />} />
                <Route path="ayuda" element={<Help />} />

                <Route path="contratar/:serviceId" element={<PrivateRoute role="CLIENT"><BookingNew /></PrivateRoute>} />
                <Route path="mis-contrataciones" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
                <Route path="mis-contrataciones/:id" element={<PrivateRoute><MyBookingDetail /></PrivateRoute>} />
                <Route path="mi-cuenta" element={<PrivateRoute><MyProfile /></PrivateRoute>} />

                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="prestador" element={<PrivateRoute role="PROVIDER"><ProviderLayout /></PrivateRoute>}>
                <Route index element={<ProviderDashboard />} />
                <Route path="servicios" element={<ProviderServices />} />
                <Route path="servicios/nuevo" element={<ProviderServiceForm />} />
                <Route path="servicios/:id" element={<ProviderServiceForm />} />
                <Route path="perfil" element={<ProviderProfileEdit />} />
                <Route path="resenas" element={<ProviderReviews />} />
                <Route path="calendario" element={<ProviderCalendar />} />
                <Route path="contrataciones/:id" element={<ProviderBookingDetail />} />
              </Route>

              <Route path="admin" element={<PrivateRoute role="ADMIN"><AdminLayout /></PrivateRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="categorias" element={<AdminCategories />} />
                <Route path="prestadores" element={<AdminProviders />} />
                <Route path="clientes" element={<AdminUsers />} />
                <Route path="contrataciones" element={<AdminBookings />} />
                <Route path="contrataciones/:id" element={<AdminBookingDetail />} />
                <Route path="soporte" element={<AdminSupport />} />
                <Route path="configuracion" element={<AdminPlatformConfig />} />
              </Route>
            </Routes>
          </NotifyProvider>
        </AuthProvider>
      </PlatformConfigProvider>
    </BrowserRouter>
  )
}
