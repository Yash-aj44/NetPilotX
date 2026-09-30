import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ArrowRight, Lock, Mail, User as UserIcon, Activity, ShieldCheck, Cpu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthBackground from "../components/auth/AuthBackground";
import ProductIntro from "../components/auth/ProductIntro";
import VariableProximity from "../components/ui/VariableProximity";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("netpilot_intro_seen");
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIntroComplete = () => {
    sessionStorage.setItem("netpilot_intro_seen", "true");
    setShowIntro(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup(fullName, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cubicEase = [0.22, 1, 0.36, 1] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.12,
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
            key="signup-composition"
            className="auth-editorial-layout"
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.55, ease: cubicEase }}
          >
            {/* LEFT SIDE: PRODUCT IDENTITY */}
            <div className="auth-left-brand-panel">
              <motion.div
                className="brand-anchor-block"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: cubicEase }}
              >
                <div className="brand-badge-pill">
                  <span className="pill-dot pulse" />
                  <span>REGISTER OPERATOR ACCOUNT</span>
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
                    <strong>Full System Privileges</strong>
                    <span>Core & Subnet Infrastructure Control</span>
                  </div>
                </div>

                <div className="noc-spec-item">
                  <Cpu size={16} className="text-emerald-400" />
                  <div>
                    <strong>AI Copilot Integration</strong>
                    <span>Automated Root Cause Diagnostics</span>
                  </div>
                </div>

                <div className="noc-spec-item">
                  <ShieldCheck size={16} className="text-cyan-400" />
                  <div>
                    <strong>Controlled Failover Mode</strong>
                    <span>Live Chaos Simulation Testing</span>
                  </div>
                </div>
              </motion.div>

              <div className="auth-footer-tag">
                <span>SYSTEM STATUS: OPERATIONAL</span>
                <span className="font-mono text-xs text-slate-500">v2.4.0-NOC</span>
              </div>
            </div>

            {/* RIGHT SIDE: SEQUENTIAL STAGGERED FORM */}
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
                    <h2 className="auth-card-heading">CREATE ADMINISTRATOR</h2>
                    <p className="auth-card-subheading">Register new operator credentials</p>
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
                    <label htmlFor="fullName">FULL NAME</label>
                    <div className="input-with-icon">
                      <UserIcon size={16} className="input-icon" />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="Network Operator"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>

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

                  <motion.div variants={itemVariants} className="form-group">
                    <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
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
                      <span className="auth-loading-spinner">Creating account...</span>
                    ) : (
                      <>
                        <span>REGISTER OPERATOR ACCOUNT</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </form>

                <motion.div variants={itemVariants} className="auth-footer-link">
                  <p>
                    Already registered?{" "}
                    <Link to="/login" className="auth-accent-link">
                      Operator Sign In
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
