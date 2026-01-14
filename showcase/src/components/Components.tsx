import { motion } from 'framer-motion';
import { SiNpm } from 'react-icons/si';
import { FaGithub } from 'react-icons/fa';
import { useInView } from 'react-intersection-observer';
import './Components.css';

interface Feature {
  title: string;
  description: string;
  icon: string;
  highlights: string[];
}

const features: Feature[] = [
  {
    title: 'Threshold Secret Sharing',
    icon: '🔑',
    description:
      'Split any secret into n shares, requiring exactly t shares to reconstruct. Information-theoretically secure - shares below the threshold reveal absolutely no information about the secret.',
    highlights: [
      'Divide secrets into n shares with configurable t-of-n threshold recovery',
      'Any combination of t shares can reconstruct the original secret',
      'Lose some shares and still recover - perfect for backup scenarios',
      'Based on Shamir\'s Secret Sharing algorithm using polynomial interpolation',
      'Works with passwords, keys, files, or any data you need to protect',
    ],
  },
  {
    title: 'Information-Theoretically Secure',
    icon: '🛡️',
    description:
      'Mathematically proven security. Having fewer than the threshold number of shares provides zero information about the secret - not even with infinite computing power.',
    highlights: [
      'Security proven by mathematics, not computational hardness',
      'Shares below threshold reveal no information whatsoever',
      'Resistant to all attacks, including quantum computing',
      'Based on polynomial interpolation over Galois Fields',
      'Cure53 security audit (July 2019) found zero issues',
    ],
  },
  {
    title: 'Browser Native',
    icon: '🌐',
    description:
      'Works natively in all modern browsers without polyfills or shims. Uses crypto.getRandomValues() for cryptographically secure random number generation.',
    highlights: [
      'No polyfills or shims required for modern browsers',
      'Uses native crypto.getRandomValues() for secure randomness',
      'Identical API and results across Node.js and browsers',
      'Cross-platform deterministic operations',
      'Automatic environment detection',
    ],
  },
  {
    title: 'TypeScript First',
    icon: '📘',
    description:
      'Written in TypeScript with comprehensive type definitions. Full IntelliSense support and compile-time validation for safer development.',
    highlights: [
      'Full type safety with TypeScript 4.0+',
      'IntelliSense autocomplete in your IDE',
      'Catch errors at compile-time, not runtime',
      'Multiple module formats: CommonJS, ES Modules, UMD',
      'Complete type definitions included',
    ],
  },
  {
    title: 'Zero Dependencies',
    icon: '⚡',
    description:
      'Pure implementation with no external dependencies. Minimal bundle size and no supply chain vulnerabilities from third-party packages.',
    highlights: [
      'No external dependencies - pure TypeScript implementation',
      'Minimal bundle size for fast loading',
      'No supply chain security concerns',
      'Easy to audit - all code is in one place',
      'Works in restricted environments',
    ],
  },
  {
    title: 'Flexible Configuration',
    icon: '⚙️',
    description:
      'Configurable Galois field size (3-20 bits) supporting up to 1,048,575 shares. Adjustable padding for enhanced security of short secrets.',
    highlights: [
      'Configurable bits (3-20) for different share counts',
      'Support for up to 1,048,575 shares (20-bit field)',
      'Adjustable zero-padding for security',
      'Dynamic share generation from existing shares',
      'Extract and inspect share components',
    ],
  },
];

const Components = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="components section" id="components" ref={ref}>
      <motion.div
        className="components-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Why <span className="gradient-text">Secrets.js</span>?
        </h2>
        <p className="components-subtitle">
          Modern, secure, and easy-to-use secret sharing for JavaScript and TypeScript
        </p>

        <motion.div
          className="suite-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>
            The <em>modern</em> implementation of Shamir's Secret Sharing for <em>JavaScript</em> and <em>TypeScript</em>.
          </h3>
          <p>
            <strong>@digitaldefiance/secrets</strong> is a pure TypeScript implementation of Shamir's threshold secret sharing scheme 
            that works natively in both Node.js and modern browsers. Split any secret into multiple shares, requiring only a threshold 
            to reconstruct - perfect for backup keys, password recovery, and distributed trust scenarios.
          </p>
          
          <div className="value-props">
            <div className="value-prop">
              <strong>🔑 Threshold Recovery</strong>
              <p>Split into n shares, recover with any t - lose some and still recover your secret</p>
            </div>
            <div className="value-prop">
              <strong>🛡️ Provably Secure</strong>
              <p>Information-theoretically secure - shares below threshold reveal nothing</p>
            </div>
            <div className="value-prop">
              <strong>🌐 Browser Native</strong>
              <p>Works in all modern browsers without polyfills or shims</p>
            </div>
            <div className="value-prop">
              <strong>📘 TypeScript First</strong>
              <p>Full type safety with comprehensive definitions and IntelliSense support</p>
            </div>
            <div className="value-prop">
              <strong>⚡ Zero Dependencies</strong>
              <p>Pure implementation with minimal bundle size and no supply chain risks</p>
            </div>
            <div className="value-prop">
              <strong>🔒 Security Audited</strong>
              <p>Cure53 audit (July 2019) found zero issues in the implementation</p>
            </div>
          </div>

          <div className="cta-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://www.npmjs.com/package/@digitaldefiance/secrets"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <SiNpm />
              Install from NPM
            </a>
            <a
              href="https://github.com/Digital-Defiance/secrets.js"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FaGithub />
              View on GitHub
            </a>
          </div>
        </motion.div>

        <div className="components-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="component-card card"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="component-header">
                <div className="component-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
              </div>

              <p className="component-description">{feature.description}</p>

              <ul className="component-highlights">
                {feature.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="usage-example"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ marginBottom: '1rem' }}>Quick Start</h3>
          <pre style={{
            background: 'var(--bg-primary)',
            padding: '1.5rem',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.9rem',
            lineHeight: '1.6',
          }}>
            <code>{`// Install
npm install @digitaldefiance/secrets

// Import
const secrets = require('@digitaldefiance/secrets');

// Generate a secret key
const key = secrets.random(512);

// Split into 5 shares, requiring any 3 to reconstruct
const shares = secrets.share(key, 5, 3);

// Reconstruct from any 3 shares
const reconstructed = secrets.combine(shares.slice(0, 3));

console.log(reconstructed === key); // true`}</code>
          </pre>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Components;
