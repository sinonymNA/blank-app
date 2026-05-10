import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import ProductSetup from './pages/ProductSetup';
import Platforms from './pages/Platforms';
import Settings from './pages/Settings';

function AuthedApp() {
  return (
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
  );
}

function AuthPage({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#18181B]">Ampere</h1>
          <p className="text-[#71717A] mt-1">Your autonomous marketing engine</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function AppRouter() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Routes>
        <Route path="/sign-up" element={<AuthPage><SignUp routing="path" path="/sign-up" afterSignUpUrl="/" /></AuthPage>} />
        <Route path="*" element={<AuthPage><SignIn routing="path" path="/sign-in" afterSignInUrl="/" /></AuthPage>} />
      </Routes>
    );
  }

  return <AuthedApp />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
