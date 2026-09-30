import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ArrowRight, Lock, Mail, Activity, ShieldCheck, Cpu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthBackground from "../components/auth/AuthBackground";
import ProductIntro from "../components/auth/ProductIntro";
import VariableProximity from "../components/ui/VariableProximity";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("netpilot_intro_seen");
  });

  const [email, setEmail] = useState("admin@netpilotx.io");
  const [password, setPassword] = useState("••••••••••••");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIntroComplete = () => {
    sessionStorage.setItem("netpilot_intro_seen", "true");
    setShowIntro(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Authentication failed. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cubicEase = [0.22, 1, 0.36, 1] as const;

  // Stagger variants for sequential field reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.45, ease: cubicEase },
    },
  };

  return (
    <div className="auth-container">
      <AuthBackground />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <ProductIntro key="intro" onComplete={handleIntroComplete} />
        ) : (
          <motion.div
            key="auth-composition"
            className="auth-editorial-layout"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.97 }}
            transition={{ duration: 0.55, ease: cubicEase }}
          >
            {/* LEFT SIDE: PRODUCT IDENTITY & NOC STATUS */}
            <div className="auth-left-brand-panel">
              <motion.div
                className="brand-anchor-block"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: cubicEase }}
              >
                <div className="brand-badge-pill">
                  <span className="pill-dot pulse" />
                  <span>AUTONOMOUS NOC PLATFORM</span>
                </div>
                <VariableProximity label="NETPILOT X" className="editorial-title" radius={140} />
                <p className="editorial-subtitle">
                  AI-POWERED NETWORK OPERATIONS & SIMULATION ENGINE
                </p>
              </motion.div>

              <motion.div
                className="noc-specs-grid"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: cubicEase }}
              >
                <div className="noc-spec-item">
                  <Activity size={16} className="text-cyan-400" />
                  <div>
                    <strong>200 Monitored Endpoints</strong>
                    <span>Core → Dist → Edge Subnets</span>
                  </div>
                </div>

                <div className="noc-spec-item">
                  <Cpu size={16} className="text-emerald-400" />
                  <div>
                    <strong>Realtime Telemetry</strong>
                    <span>D3 Topology + GSAP Engine</span>
                  </div>
                </div>

                <div className="noc-spec-item">
                  <ShieldCheck size={16} className="text-cyan-400" />
                  <div>
                    <strong>Automated Recovery</strong>
                    <span>Context-Aware AI Copilot</span>
                  </div>
                </div>
              </motion.div>

              <div className="auth-footer-tag">
                <span>SYSTEM STATUS: OPERATIONAL</span>
                <span className="font-mono text-xs text-slate-500">v2.4.0-NOC</span>
              </div>
            </div>

            {/* RIGHT SIDE: SEQUENTIAL STAGGERED AUTH FORM */}
            <div className="auth-right-form-panel">
              <motion.div
                className="auth-form-card"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="auth-brand-header">
                  <div className="auth-logo-icon">
                    <Network size={22} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="auth-card-heading">OPERATOR SIGN IN</h2>
                    <p className="auth-card-subheading">Access NetPilot X Control Center</p>
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    className="auth-error-banner"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                  <motion.div variants={itemVariants} className="form-group">
                    <label htmlFor="email">EMAIL ADDRESS</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        id="email"
                        type="email"
                        placeholder="admin@netpilotx.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="form-group">
                    <label htmlFor="password">PASSWORD</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        id="password"
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="form-row-remember">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Keep operator session active</span>
                    </label>
                  </motion.div>

                  <motion.button
                    variants={itemVariants}
                    type="submit"
                    className="auth-submit-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="auth-loading-spinner">Authenticating Session...</span>
                    ) : (
                      <>
                        <span>AUTHENTICATE OPERATOR</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>

                <motion.div variants={itemVariants} className="auth-footer-link">
                  <p>
                    Need administrator access?{" "}
                    <Link to="/signup" className="auth-accent-link">
                      Register Account
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
