import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Network from "./pages/Network";
import Monitoring from "./pages/Monitoring";
import Incidents from "./pages/Incidents";
import Alerts from "./pages/Alerts";
import Traffic from "./pages/Traffic";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import { NetworkProvider } from "./context/NetworkContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NetworkProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/network" element={<Network />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/traffic" element={<Traffic />} />
                </Route>
              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NetworkProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;