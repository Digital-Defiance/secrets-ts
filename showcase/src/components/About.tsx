import { motion } from 'framer-motion';
import {
  FaCode,
  FaGithub,
  FaHeart,
  FaLightbulb,
  FaRocket,
  FaUsers,
} from 'react-icons/fa';
import { useInView } from 'react-intersection-observer';
import './About.css';

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="about section" id="about" ref={ref}>
      <motion.div
        className="about-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Built with <span className="gradient-text">❤️</span> by Digital
          Defiance
        </h2>
        <p className="about-subtitle">
          Open source cryptography and security tools for developers
        </p>

        <div className="about-content">
          <motion.div
            className="about-main card"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="about-heading">
              <FaRocket /> Our Mission
            </h3>
            <p>
              At <strong>Digital Defiance</strong>, we build open source tools that empower developers 
              with strong cryptography and security primitives. We believe in making advanced security 
              accessible, auditable, and easy to use.
            </p>
            <p>
              <strong>@digitaldefiance/secrets</strong> is our modern fork of the excellent secrets.js library, 
              bringing Shamir's Secret Sharing to the TypeScript era with native browser support, comprehensive 
              type definitions, and zero dependencies. Originally created by amper5and and maintained by grempe 
              and 34r7h, we've enhanced it for modern JavaScript development while maintaining its security 
              guarantees and audit status.
            </p>
            <p className="highlight-text">
              <FaCode /> <strong>100% Open Source.</strong> All our libraries are freely available under the MIT License. 
              Every line of code is open for inspection, improvement, and contribution. Join us in building secure, 
              reliable tools for the development community.
            </p>
          </motion.div>

          <div className="about-features">
            <motion.div
              className="feature-card card"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="feature-icon">
                <FaHeart />
              </div>
              <h4>Open Source First</h4>
              <p>
                MIT licensed and community-driven. Every line of code is open
                for inspection, improvement, and contribution.
              </p>
            </motion.div>

            <motion.div
              className="feature-card card"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="feature-icon">
                <FaCode />
              </div>
              <h4>Security Focused</h4>
              <p>
                Cryptographically sound implementations with security audits. 
                We prioritize correctness and safety above all else.
              </p>
            </motion.div>

            <motion.div
              className="feature-card card"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h4>Developer Friendly</h4>
              <p>
                TypeScript-first with comprehensive documentation. We build tools 
                that developers actually want to use.
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="about-cta"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h3>Get Involved</h3>
          <p>
            Help us build secure, reliable tools for the development community. Contribute to our projects, 
            report issues, or star us on GitHub to show your support.
          </p>
          <div className="cta-buttons">
            <a
              href="https://digitaldefiance.org"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <FaLightbulb />
              Visit Digital Defiance
            </a>
            <a
              href="https://github.com/Digital-Defiance/secrets.js"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaGithub />
              Secrets.js on GitHub
            </a>
            <a
              href="https://github.com/Digital-Defiance"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaCode />
              More Projects
            </a>
          </div>
        </motion.div>

        <div className="about-footer">
          <p>
            © {new Date().getFullYear()} Digital Defiance. Made with{' '}
            <span className="heart">❤️</span> for the development community.
          </p>
          <p className="footer-links">
            <a
              href="https://github.com/Digital-Defiance/secrets.js/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
            {' • '}
            <a
              href="https://github.com/Digital-Defiance/secrets.js"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {' • '}
            <a
              href="https://www.npmjs.com/package/@digitaldefiance/secrets"
              target="_blank"
              rel="noopener noreferrer"
            >
              NPM
            </a>
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default About;
