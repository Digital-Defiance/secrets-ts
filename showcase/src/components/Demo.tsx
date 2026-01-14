import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaDice, FaLock, FaUnlock, FaKey } from 'react-icons/fa';
import { useInView } from 'react-intersection-observer';
import secrets from '@digitaldefiance/secrets';
import './Demo.css';

const Demo = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [secret, setSecret] = useState('My Secret Password 123!');
  const [numShares, setNumShares] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [shares, setShares] = useState<string[]>([]);
  const [selectedShares, setSelectedShares] = useState<Set<number>>(new Set());
  const [reconstructed, setReconstructed] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);

  const handleSplit = async () => {
    if (!secret || numShares < 2 || threshold < 2 || threshold > numShares) return;
    setIsGenerating(true);
    setReconstructed('');
    setSelectedShares(new Set());
    
    try {
      const hexSecret = secrets.str2hex(secret);
      const newShares = secrets.share(hexSecret, numShares, threshold);
      setShares(newShares);
    } catch (error) {
      console.error('Failed to split secret:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleShare = (index: number) => {
    const newSelected = new Set(selectedShares);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedShares(newSelected);
  };

  const handleReconstruct = async () => {
    if (selectedShares.size < threshold) return;
    setIsReconstructing(true);
    
    try {
      const selectedSharesArray = Array.from(selectedShares).map(i => shares[i]);
      const combined = secrets.combine(selectedSharesArray);
      const reconstructedSecret = secrets.hex2str(combined);
      setReconstructed(reconstructedSecret);
    } catch (error) {
      console.error('Failed to reconstruct secret:', error);
      setReconstructed('Error: Failed to reconstruct');
    } finally {
      setIsReconstructing(false);
    }
  };

  return (
    <section className="demo-section" id="demo" ref={ref}>
      <motion.div
        className="demo-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Interactive <span className="gradient-text">Demo</span>
        </h2>
        <p className="features-subtitle">
          Split a secret into shares, then reconstruct it with any threshold combination
        </p>

        <div className="demo-grid" style={{ gridTemplateColumns: '1fr' }}>
          {/* Input Section */}
          <motion.div
            className="demo-card"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h3>
              <FaLock /> Step 1: Enter Your Secret
            </h3>
            <div className="demo-input-group">
              <label>Secret to Split:</label>
              <textarea
                className="demo-textarea"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter a secret message..."
                rows={2}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="demo-input-group">
                <label>Total Shares (n): {numShares}</label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={numShares}
                  onChange={(e) => setNumShares(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div className="demo-input-group">
                <label>Threshold (t): {threshold}</label>
                <input
                  type="range"
                  min="2"
                  max={numShares}
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '1rem' }}>
              This will split your secret into <strong>{numShares}</strong> shares, 
              requiring any <strong>{threshold}</strong> of them to reconstruct.
            </p>

            <button
              className="demo-btn"
              onClick={handleSplit}
              disabled={isGenerating || !secret || numShares < 2 || threshold < 2}
              style={{ marginTop: '1rem' }}
            >
              {isGenerating ? (
                'Splitting...'
              ) : (
                <>
                  <FaDice /> Split Secret into Shares
                </>
              )}
            </button>
          </motion.div>

          {/* Shares Display */}
          {shares.length > 0 && (
            <motion.div
              className="demo-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3>
                <FaKey /> Step 2: Select Shares to Reconstruct
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1rem' }}>
                Select at least <strong>{threshold}</strong> shares to reconstruct the secret.
                Try selecting different combinations!
              </p>
              
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {shares.map((share, index) => (
                  <div
                    key={index}
                    onClick={() => toggleShare(index)}
                    style={{
                      padding: '1rem',
                      background: selectedShares.has(index) 
                        ? 'linear-gradient(135deg, var(--primary-color), var(--accent-color))' 
                        : 'var(--bg-secondary)',
                      border: selectedShares.has(index) ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      wordBreak: 'break-all',
                      opacity: selectedShares.has(index) ? 1 : 0.7,
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Share {index + 1} {selectedShares.has(index) && '✓'}
                    </div>
                    <div style={{ opacity: 0.8 }}>
                      {share.substring(0, 60)}...
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="demo-btn"
                onClick={handleReconstruct}
                disabled={isReconstructing || selectedShares.size < threshold}
                style={{ marginTop: '1rem', background: 'var(--accent-color)' }}
              >
                {isReconstructing ? (
                  'Reconstructing...'
                ) : (
                  <>
                    <FaUnlock /> Reconstruct Secret ({selectedShares.size}/{threshold})
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Reconstruction Result */}
          {reconstructed && (
            <motion.div
              className="demo-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                background: reconstructed === secret 
                  ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.1))'
                  : 'linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(200, 0, 0, 0.1))',
                border: reconstructed === secret ? '2px solid #0f0' : '2px solid #f00',
              }}
            >
              <h3>
                {reconstructed === secret ? '✅' : '❌'} Step 3: Reconstructed Secret
              </h3>
              <div
                className="demo-textarea"
                style={{ 
                  background: 'var(--bg-primary)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                }}
              >
                {reconstructed}
              </div>
              {reconstructed === secret ? (
                <p style={{ marginTop: '1rem', color: '#0f0' }}>
                  ✅ Success! The secret was perfectly reconstructed.
                </p>
              ) : (
                <p style={{ marginTop: '1rem', color: '#f00' }}>
                  ❌ The reconstructed secret doesn't match. This shouldn't happen!
                </p>
              )}
            </motion.div>
          )}
        </div>

        <motion.div
          className="demo-info"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ marginBottom: '1rem' }}>How It Works</h3>
          <ul style={{ lineHeight: '1.8', opacity: 0.9 }}>
            <li>🔑 <strong>Threshold Secret Sharing:</strong> Your secret is split into n shares, requiring any t of them to reconstruct</li>
            <li>🛡️ <strong>Information-Theoretically Secure:</strong> Having fewer than t shares reveals absolutely no information about the secret</li>
            <li>🧩 <strong>Flexible Recovery:</strong> Any combination of t shares works - lose some shares and still recover your secret</li>
            <li>⚡ <strong>Pure Mathematics:</strong> Based on polynomial interpolation over finite fields (Galois Fields)</li>
          </ul>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Demo;
