import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import MobileNav from './components/layout/MobileNav.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Queue from './pages/Queue.jsx';
import Analytics from './pages/Analytics.jsx';
import Products from './pages/Products.jsx';
import ProductSetup from './pages/ProductSetup.jsx';
import Platforms from './pages/Platforms.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
        <Sidebar />
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/:productId" element={<Analytics />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductSetup />} />
            <Route path="/products/:id/edit" element={<ProductSetup />} />
            <Route path="/platforms" element={<Platforms />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}
