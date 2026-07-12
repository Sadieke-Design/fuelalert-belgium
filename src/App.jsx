import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import PageNotFound from "./lib/PageNotFound";

import { AuthProvider, useAuth } from "@/lib/AuthContext";

import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";

/* Protected pages */
import Dashboard from "./pages/Dashboard";
import Stations from "./pages/Stations";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Premium from "./pages/Premium";
import Admin from "./pages/Admin";

/* Public pages */
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* Terms and Privacy */
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } =
    useAuth();

  /* Loading */
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  /*
       Laat publieke pagina's altijd toe
    */
  const currentPath = window.location.pathname;

  const publicRoutes = ["/login", "/register", "/forgot-password"];

  const isPublicRoute =
    publicRoutes.includes(currentPath) ||
    currentPath.startsWith("/reset-password/");

  /*
       Enkel beveiligde pagina's blokkeren
    */
  if (authError && !isPublicRoute) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    }

    if (authError.type === "auth_required") {
      navigateToLogin();

      return null;
    }
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />

      <Route path="/privacy" element={<Privacy />} />

      {/* Protected */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/stations" element={<Stations />} />

        <Route path="/favorites" element={<Favorites />} />

        <Route path="/history" element={<History />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="/premium" element={<Premium />} />

        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />

          <AuthenticatedApp />
        </Router>

        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
