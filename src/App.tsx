import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from './lib/supabase';
import AccessibilityMenu from "@/components/AccessibilityMenu";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetail from './pages/ProductDetail';
import NotFound from "./pages/NotFound";
import CompleteProfile from "./pages/CompleteProfile";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PagoExitoso from "./pages/PagoExitoso";


const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessibilityMenu />
          <Router>
          <Routes>
                <Route index element={<Index />} />
                <Route path="/productos" element={<Products />} />
                <Route path="/productos/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route path="/pago-exitoso" element={<PagoExitoso />} />
                
                {/* Ruta específica para nuevos usuarios de Google */}
                <Route 
                  path="/complete-profile" 
                  element={
                    <ProtectedRoute requiresAuth requiresNewUser>
                      <CompleteProfile />
                    </ProtectedRoute>
                  } 
                />

                {/* Rutas protegidas que requieren autenticación */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />


                {/* Ruta catch-all */}
                <Route path="*" element={<NotFound />} />
          
          </Routes>
        </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};


export default App;
