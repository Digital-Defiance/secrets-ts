import { motion } from 'framer-motion';
import { FaGithub, FaNpm } from 'react-icons/fa';
import './Hero.css';

interface HeroProps {
  scrollY: number;
}

const Hero = ({ scrollY }: HeroProps) => {
  const parallaxOffset = scrollY * 0.5;

  return (
    <section className="hero" id="home">
      <div
        className="hero-background"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <span className="badge-text">
            🔐 Cryptographically Secure Secret Sharing
          </span>
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Secrets.js
        </motion.h1>

        <motion.h2
          className="hero-subtitle gradient-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Shamir's Secret Sharing for Modern Applications
        </motion.h2>

        <motion.p
          className="hero-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Split any secret into multiple shares, requiring only a threshold to reconstruct.
          <br />
          Information-theoretically secure. Browser-native. TypeScript-first.
          <br />
          <span className="hero-highlight">
            🔑 Threshold Recovery • 🛡️ Security Audited • 🌐 Browser Native • 📘 TypeScript • ⚡ Zero Dependencies
          </span>
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <a
            href="#demo"
            className="btn btn-primary"
          >
            🧪 Try Interactive Demo
          </a>
          <a
            href="https://github.com/Digital-Defiance/secrets.js"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
            View on GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@digitaldefiance/secrets"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaNpm />
            Install from NPM
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
