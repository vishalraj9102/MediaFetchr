import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.onrender.com/api';

function App() {
  const [url, setUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (downloading) {
      const interval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + Math.random() * 15 : prev);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [downloading]);

  const handleDownload = async () => {
    if (!url) return;
    
    setDownloading(true);
    setError('');
    setAnalysis(null);
    setTaskId('');
    setStatus(null);
    setDownloadUrl('');
    setProgress(0);
    setShowSuccess(false);
    
    try {
      // First analyze the URL
      console.log('Making request to:', `${API_URL}/analyze`);
      console.log('Request body:', JSON.stringify({ url }));
      
      const analyzeRes = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      console.log('Response status:', analyzeRes.status);
      console.log('Response headers:', analyzeRes.headers);
      
      if (!analyzeRes.ok) {
        const errorText = await analyzeRes.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${analyzeRes.status}: ${errorText}`);
      }
      
      const analyzeData = await analyzeRes.json();
      console.log('Analyze response:', analyzeData);
      
      if (!analyzeData.success) {
        throw new Error(analyzeData.error || 'Analysis failed');
      }

      setAnalysis(analyzeData.info);
      setProgress(20);
      
      // Then start download
      const downloadRes = await fetch(`${API_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const downloadData = await downloadRes.json();
      
      if (!downloadData.success) {
        throw new Error(downloadData.error || 'Download failed');
      }
      
      setTaskId(downloadData.task_id);
      pollStatus(downloadData.task_id);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message);
      setDownloading(false);
      setProgress(0);
    }
  };

  const pollStatus = (taskId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/status/${taskId}`);
        const data = await res.json();
        setStatus(data.status);
        
        if (data.status === 'completed') {
          setProgress(100);
          setDownloadUrl(`${API_URL}/file/${data.filename}`);
          setDownloading(false);
          setShowSuccess(true);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setError(data.error || 'Download failed');
          setDownloading(false);
          setProgress(0);
          clearInterval(interval);
        }
      } catch (err) {
        setError('Status check failed');
        setDownloading(false);
        setProgress(0);
        clearInterval(interval);
      }
    }, 2000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-emoji">🚀</span>
            <span className="logo-text">MediaFetchr</span>
          </div>
          <div className="nav-links">
            <span className="nav-link">Home</span>
            <span className="nav-link">About</span>
            <span className="nav-link">Contact</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>✨ New & Improved</span>
            </div>
            <h1 className="hero-title">
              Download Any
              <span className="gradient-text"> Media </span>
              Instantly
            </h1>
            <p className="hero-subtitle">
              Fast, secure, and free media downloader for YouTube, Instagram, TikTok, and more!
            </p>
            
            {/* Download Card */}
            <div className="download-card">
              <div className="card-header">
                <h3>🎯 Ready to Download?</h3>
                <p>Paste your link and let the magic happen!</p>
              </div>
              
              <div className="input-section">
                <div className="input-group">
                  <div className="input-icon">🔗</div>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    disabled={downloading}
                    className="modern-input"
                  />
                  <button 
                    className={`action-button ${downloading ? 'loading' : ''}`}
                    onClick={handleDownload} 
                    disabled={downloading || !url}
                  >
                    {downloading ? (
                      <>
                        <div className="button-spinner"></div>
                        <span>Processing</span>
                      </>
                    ) : (
                      <>
                        <span className="button-icon">⚡</span>
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="error-alert">
                  <div className="alert-icon">🚨</div>
                  <div className="alert-content">
                    <h4>Oops! Something went wrong</h4>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Progress Section */}
              {downloading && (
                <div className="progress-container">
                  <div className="progress-header">
                    <div className="progress-icon">
                      {status === 'downloading' ? '📥' : status === 'starting' ? '🔄' : '⚡'}
                    </div>
                    <div className="progress-text">
                      <h4>
                        {status === 'downloading' ? 'Downloading your media...' : 
                         status === 'starting' ? 'Getting ready...' : 'Processing...'}
                      </h4>
                      <p>{Math.round(progress)}% complete</p>
                    </div>
                  </div>
                  <div className="modern-progress">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Media Info */}
              {analysis && !downloading && (
                <div className="media-preview">
                  <div className="preview-header">
                    <h4>📊 Media Preview</h4>
                  </div>
                  {analysis.thumbnail && (
                    <div className="preview-thumbnail">
                      <img src={analysis.thumbnail} alt="Preview" />
                      <div className="thumbnail-overlay">
                        <div className="play-button">▶</div>
                      </div>
                    </div>
                  )}
                  <div className="preview-details">
                    {analysis.title && (
                      <div className="detail-row">
                        <span className="detail-label">📝 Title</span>
                        <span className="detail-value">{analysis.title}</span>
                      </div>
                    )}
                    {analysis.type && (
                      <div className="detail-row">
                        <span className="detail-label">
                          {analysis.type === 'video' ? '🎥' : analysis.type === 'audio' ? '🎵' : '📁'} Type
                        </span>
                        <span className="detail-value">{analysis.type}</span>
                      </div>
                    )}
                    {analysis.duration && (
                      <div className="detail-row">
                        <span className="detail-label">⏱️ Duration</span>
                        <span className="detail-value">{formatDuration(analysis.duration)}</span>
                      </div>
                    )}
                    {analysis.size && (
                      <div className="detail-row">
                        <span className="detail-label">💾 Size</span>
                        <span className="detail-value">{formatFileSize(analysis.size)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success Section */}
              {showSuccess && downloadUrl && (
                <div className="success-container">
                  <div className="success-animation">
                    <div className="success-circle">
                      <div className="checkmark">✓</div>
                    </div>
                  </div>
                  <div className="success-content">
                    <h3>🎉 Download Ready!</h3>
                    <p>Your media has been processed successfully</p>
                    <a 
                      href={downloadUrl} 
                      className="download-link"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <span className="link-icon">📱</span>
                      <span>Get Your File</span>
                      <span className="link-arrow">→</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="section-header">
            <h2>Why Choose MediaFetchr?</h2>
            <p>The most advanced media downloader with cutting-edge features</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>100% Secure</h3>
              <p>Your privacy matters. We don't store any personal data or downloaded files.</p>
              <div className="feature-badge">Trusted</div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Advanced algorithms ensure the fastest possible download speeds.</p>
              <div className="feature-badge">Speed</div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Multi-Platform</h3>
              <p>Supports 50+ platforms including YouTube, Instagram, TikTok & more.</p>
              <div className="feature-badge">Universal</div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>High Quality</h3>
              <p>Download in the highest available quality, up to 4K resolution.</p>
              <div className="feature-badge">Premium</div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="developer">
        <div className="developer-container">
          <div className="developer-content">
            <div className="developer-image-section">
              <div className="dev-image-container">
                <img src="/Developer.jpg" alt="Vishal Raj" className="dev-image" />
                <div className="dev-status">
                  <span className="status-dot"></span>
                  <span>Available for work</span>
                </div>
              </div>
            </div>
            
            <div className="developer-info-section">
              <div className="dev-badge">👨‍💻 Meet the Developer</div>
              <h2>Vishal Raj</h2>
              <p className="dev-title">Full-Stack Developer & Backend Specialist</p>
              <p className="dev-description">
                Passionate about creating innovative web solutions with expertise in modern 
                technologies. Specializing in backend development, API design, and scalable architectures.
              </p>
              
              <div className="dev-skills">
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Flask</span>
                <span className="skill-tag">FastAPI</span>
                <span className="skill-tag">Django</span>
                <span className="skill-tag">Redis</span>
                <span className="skill-tag">Docker</span>
                <span className="skill-tag">Java</span>
                <span className="skill-tag">SQL</span>
                <span className="skill-tag">AWS</span>
              </div>
              
              <div className="dev-social">
                <a href="https://sankatmochanai.onrender.com/" target="_blank" rel="noopener noreferrer" className="social-btn">💼 Own Product</a>
                <a href="https://contact-us-form-4.onrender.com/" target="_blank" rel="noopener noreferrer" className="social-btn">📧 Contact</a>
                <a href="https://www.linkedin.com/in/vishal-raj-699205235/" target="_blank" rel="noopener noreferrer" className="social-btn">🔗 LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-emoji">🚀</span>
                <span className="logo-text">MediaFetchr</span>
              </div>
              <p>The ultimate media downloading experience</p>
            </div>
            
            <div className="footer-info">
              <div className="footer-note">
                <span className="note-icon">🌟</span>
                <span>Supports 50+ platforms worldwide</span>
              </div>
              <div className="footer-disclaimer">
                Public content only • No registration required • Auto-cleanup after 1 hour
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
