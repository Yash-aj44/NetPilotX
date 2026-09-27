import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      aria-label="Toggle Theme"
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.6, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.6, rotate: 90, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {theme === "dark" ? (
          <Sun size={18} className="theme-icon-sun" />
        ) : (
          <Moon size={18} className="theme-icon-moon" />
        )}
      </motion.div>
    </button>
  );
}
