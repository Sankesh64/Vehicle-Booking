import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { bookingApi } from './api';

const App: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'user' | 'driver' | 'admin'>('user');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const heroTitleRef = useRef<HTMLHeadingElement>(null);

  // ─── Constants ──────────────────────────────────────────
  const dashData = {
    user: {
      avatar: 'AK', name: 'Arjun Kumar', role: 'Premium Rider',
      greeting: 'Good morning, Arjun 👋',
      metrics: [
        { icon: '🛣️', value: '142', label: 'Total Rides', change: '↑ 12 this month', type: 'up' },
        { icon: '💰', value: '₹12.4k', label: 'Total Spent', change: '↑ Saved ₹2.1k', type: 'up' },
        { icon: '💳', value: '₹840', label: 'Wallet Balance', change: '+ Add Money', type: 'up' },
        { icon: '⭐', value: '4.9', label: 'Your Rating', change: 'Top 5% rider', type: 'up' }
      ]
    },
    driver: {
      avatar: 'RS', name: 'Ramesh Singh', role: 'Driver Partner',
      greeting: 'Good morning, Ramesh 🚗',
      metrics: [
        { icon: '🛣️', value: '1,842', label: 'Total Trips', change: '↑ 48 this week', type: 'up' },
        { icon: '💵', value: '₹68k', label: 'Monthly Earnings', change: '↑ +₹4k vs last', type: 'up' },
        { icon: '⭐', value: '4.8', label: 'Driver Rating', change: 'Top 10% driver', type: 'up' },
        { icon: '⏱️', value: '94%', label: 'Acceptance Rate', change: '↑ Excellent', type: 'up' }
      ]
    },
    admin: {
      avatar: 'AD', name: 'Admin Panel', role: 'Super Admin',
      greeting: 'Platform Overview 📊',
      metrics: [
        { icon: '👥', value: '10.2k', label: 'Total Users', change: '↑ 340 this week', type: 'up' },
        { icon: '🚗', value: '2,541', label: 'Active Drivers', change: '↑ 120 new', type: 'up' },
        { icon: '💸', value: '₹4.2L', label: "Today's Revenue", change: '↑ vs ₹3.8L yesterday', type: 'up' },
        { icon: '📋', value: '842', label: 'Pending KYC', change: '↓ 23 today', type: 'down' }
      ]
    }
  };

  // ─── Effects ───────────────────────────────────────────
  
  useEffect(() => {
    // Scroll Progress & Navbar sticky
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = (scrollTop / scrollHeight) * 100;
      setScrollProgress(pct);
      setIsScrolled(scrollTop > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    
    // Counter Observer
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const targetEl = e.target as HTMLElement;
        if (e.isIntersecting && !targetEl.dataset.counted) {
          targetEl.dataset.counted = '1';
          const target = parseInt(targetEl.dataset.count || '0');
          animateCounter(targetEl, target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // Hero Title Word Animation
    if (heroTitleRef.current) {
      const lines = [
        { text: "Book Smarter,", gradient: false },
        { text: "Travel Faster.", gradient: true }
      ];
      heroTitleRef.current.innerHTML = '';
      lines.forEach((line, li) => {
        const words = line.text.split(' ');
        const lineDiv = document.createElement('div');
        lineDiv.style.display = 'block';
        words.forEach((word, wi) => {
          const span = document.createElement('span');
          span.className = 'word' + (line.gradient ? ' gradient-text' : '');
          span.textContent = word + (wi < words.length - 1 ? '\u00A0' : '');
          span.style.transitionDelay = ((li * words.length + wi) * 0.08) + 's';
          lineDiv.appendChild(span);
        });
        heroTitleRef.current?.appendChild(lineDiv);
      });

      setTimeout(() => {
        document.querySelectorAll('.word').forEach(w => w.classList.add('visible'));
      }, 300);
    }
  }, []);

  const animateCounter = (el: HTMLElement, target: number) => {
    const duration = 1800;
    const suffix = target === 98 ? '%' : '+';
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString('en-IN') + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('en-IN') + suffix;
    };
    requestAnimationFrame(step);
  };

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({ pickup: '', dropoff: '', vehicleType: 'CAR' });
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // ─── Effects ───────────────────────────────────────────
  
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEstimating(true);
    try {
      // For demonstration, we'll try to call the real API
      // If it fails (e.g. rate limit), we'll show a friendly message
      const data = await bookingApi.estimateFare(bookingData.pickup, bookingData.dropoff, bookingData.vehicleType);
      setFareEstimate(data.data);
    } catch (err: any) {
      console.error(err);
      setNotification({ message: 'Failed to fetch estimate. Please check your inputs.', type: 'error' });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleBook = async () => {
    setNotification({ message: 'Ride booked successfully! A driver will be assigned shortly.', type: 'success' });
    setShowBookingModal(false);
    setFareEstimate(null);
  };
  
  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  const currentDash = dashData[activeTab];

  return (
    <>
      {/* Notifications */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', marginBottom: '24px' }}>Book Your Ride</h3>
            
            <form onSubmit={handleEstimate}>
              <div className="form-group">
                <label className="form-label">Pickup Location</label>
                <input 
                  type="text" className="form-input" placeholder="Enter pickup address" 
                  value={bookingData.pickup} onChange={e => setBookingData({...bookingData, pickup: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Drop-off Location</label>
                <input 
                  type="text" className="form-input" placeholder="Enter destination" 
                  value={bookingData.dropoff} onChange={e => setBookingData({...bookingData, dropoff: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select 
                  className="form-input" 
                  value={bookingData.vehicleType} onChange={e => setBookingData({...bookingData, vehicleType: e.target.value})}
                >
                  <option value="CAR">Premium Sedan</option>
                  <option value="BIKE">Velo Bike</option>
                  <option value="LUXURY">Luxury Elite</option>
                </select>
              </div>
              
              {!fareEstimate ? (
                <button type="submit" className="btn-primary filled" style={{ width: '100%', marginTop: '10px' }} disabled={isEstimating}>
                  {isEstimating ? 'Calculating...' : 'Get Fare Estimate'}
                </button>
              ) : (
                <div className="fare-card reveal">
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated Fare</div>
                  <div className="fare-amount">₹{fareEstimate.fare}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Includes taxes & fees • {fareEstimate.distance} km</div>
                  <button type="button" className="btn-primary filled" style={{ width: '100%', marginTop: '20px' }} onClick={handleBook}>
                    Confirm & Book Ride
                  </button>
                  <button type="button" style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'12px', marginTop:'12px', cursor:'pointer' }} onClick={() => setFareEstimate(null)}>
                    Edit Details
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div id="progress-bar" style={{ width: `${scrollProgress}%` }}></div>

      {/* Background Glows */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} id="mobileMenu">
        <a href="#services" onClick={closeMenu}>Services</a>
        <a href="#tracking" onClick={closeMenu}>Tracking</a>
        <a href="#kyc" onClick={closeMenu}>Verify</a>
        <a href="#dashboard" onClick={closeMenu}>Dashboard</a>
        <a href="#why-us" onClick={closeMenu}>Why Us</a>
      </div>

      {/* Navigation */}
      <nav id="navbar" className={isScrolled ? 'scrolled' : ''}>
        <a href="#hero" className="nav-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          VeloRide
        </a>

        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#tracking">Live Tracking</a></li>
          <li><a href="#kyc">Driver KYC</a></li>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#why-us">Why Us</a></li>
        </ul>

        <button onClick={() => setShowBookingModal(true)} className="nav-cta">Book a Ride →</button>

        <button className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} id="hamburger" onClick={toggleMenu} aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* HERO SECTION */}
      <section id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge reveal">
              <span className="badge">
                <span className="badge-dot"></span>
                Now with AI Smart Booking &nbsp;•&nbsp; What's new →
              </span>
            </div>

            <h1 className="hero-title" ref={heroTitleRef} id="heroTitle">
              {/* Words injected by JS */}
            </h1>

            <p className="hero-subtitle reveal reveal-delay-2">
              The intelligent vehicle booking platform built for users, drivers, and modern mobility businesses.
            </p>

            <div className="hero-ctas reveal reveal-delay-3">
              <button onClick={() => setShowBookingModal(true)} className="btn-primary filled">
                🚗 Book Your Ride
              </button>
              <a href="#tracking" className="btn-secondary">
                See Live Demo →
              </a>
            </div>

            <div className="hero-trust reveal reveal-delay-4">
              <span className="stars">★★★★★</span>
              <span>Trusted by <strong>10,000+</strong> users across India</span>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="hero-mockup-wrap reveal reveal-delay-5" style={{ maxWidth: '900px', margin: '64px auto 0' }}>
            <div className="browser-chrome">
              <div className="chrome-dots">
                <span className="chrome-dot red"></span>
                <span className="chrome-dot yellow"></span>
                <span className="chrome-dot green"></span>
              </div>
              <div className="chrome-bar">
                <span className="chrome-bar-lock">🔒</span>
                <span className="chrome-bar-url">veloride.app/dashboard</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>●●●</div>
            </div>
            <div className="dashboard-mockup">
              <div className="dash-sidebar">
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '20px', padding: '8px 12px' }}>VeloRide</div>
                <div className="dash-nav-item active">
                  <div className="dash-nav-icon">🏠</div>Dashboard
                </div>
                <div className="dash-nav-item">
                  <div className="dash-nav-icon" style={{ background: 'rgba(67,97,238,0.08)' }}>🚗</div>My Rides
                </div>
                <div className="dash-nav-item">
                  <div className="dash-nav-icon" style={{ background: 'rgba(67,97,238,0.08)' }}>💳</div>Payments
                </div>
                <div className="dash-nav-item">
                  <div className="dash-nav-icon" style={{ background: 'rgba(67,97,238,0.08)' }}>📍</div>Live Map
                </div>
              </div>
              <div className="dash-content">
                <div className="dash-stats-row">
                  <div className="stat-card">
                    <div className="stat-label">Total Rides</div>
                    <div className="stat-value">142</div>
                    <div className="stat-change">+12 this month</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Savings</div>
                    <div className="stat-value">₹2.4k</div>
                    <div className="stat-change">via VeloPass</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Wallet</div>
                    <div className="stat-value">₹840</div>
                    <div className="stat-change">Available</div>
                  </div>
                </div>
                <div className="dash-map-area">
                  <div className="map-grid-lines"></div>
                  <div className="map-road-h" style={{ top: '48%', left: 0, width: '100%' }}></div>
                  <div className="map-road-v" style={{ top: 0, left: '40%', height: '100%' }}></div>
                  <div className="map-route"></div>
                  <div className="map-dot" style={{ top: '42%', left: '28%' }}>
                    <div className="map-dot-pulse"></div>
                  </div>
                  <div className="map-dest-dot"></div>
                  <div className="eta-badge">ETA 4 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            <div className="stat-item">
              <div className="stat-num" data-count="10000">0</div>
              <div className="stat-txt">Happy Riders</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" data-count="2500">0</div>
              <div className="stat-txt">Verified Drivers</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" data-count="50000">0</div>
              <div className="stat-txt">Rides Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" data-count="98">0</div>
              <div className="stat-txt">% Satisfaction</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" data-count="25">0</div>
              <div className="stat-txt">Cities Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section id="services">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Our Services</span>
            <h2 className="section-title">Everything You Need to<br/>Move Smarter</h2>
            <p className="section-subtitle">From daily commutes to luxury rides, we have every mobility solution covered.</p>
          </div>

          <div className="services-grid">
            <ServiceCard icon="🚗" name="Car Booking" desc="Book sedans, SUVs, and hatchbacks at the tap of a button. AC, GPS, verified drivers." price="From ₹99" />
            <ServiceCard icon="🏍️" name="Bike Rentals" desc="Self-ride bikes and scooters for solo commuters. Flexible hourly and daily plans." price="From ₹29" delay="reveal-delay-1" />
            <ServiceCard icon="👤" name="Driver Booking" desc="Book a verified professional driver for your own vehicle. Safe, reliable, KYC-verified." price="From ₹249" delay="reveal-delay-2" />
            <ServiceCard icon="🏢" name="Corporate Fleet" desc="Manage company-wide vehicle needs with a centralized dashboard, invoicing, and team accounts." price="Custom" />
            <ServiceCard icon="✈️" name="Airport Pickup" desc="Track flight status, pre-book rides, and get met right at arrivals. Zero wait time." price="From ₹399" delay="reveal-delay-1" />
            <ServiceCard icon="💎" name="Luxury Rentals" desc="Premium BMW, Mercedes, and Audi fleet for weddings, events, and business travel." price="From ₹1,999" delay="reveal-delay-2" />
          </div>
        </div>
      </section>

      {/* LIVE TRACKING */}
      <section id="tracking">
        <div className="container">
          <div className="tracking-grid">
            <div className="reveal">
              <div className="live-map-card">
                <div className="map-container">
                  <div className="map-bg-grid"></div>
                  <div className="driver-marker">
                    <div className="driver-avatar">🚗</div>
                  </div>
                  <div className="dest-pin">📍</div>
                  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 400 380">
                    <path d="M 140 172 Q 200 160 240 120 Q 270 90 310 95" stroke="#4361ee" strokeWidth="3" strokeDasharray="8,5" fill="none" opacity="0.6"/>
                  </svg>
                  <div className="map-overlay-card">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4361ee, #7209b7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>👨✈️</div>
                    <div className="driver-info">
                      <div className="driver-name">Rahul K. — WB 05 AB 1234</div>
                      <div className="driver-status">
                        <span className="status-dot"></span>
                        En route to you
                      </div>
                    </div>
                    <div className="eta-info">
                      <div className="eta-time">3 min</div>
                      <div className="eta-label">ETA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tracking-info reveal reveal-delay-2">
              <span className="section-tag">Real-Time GPS</span>
              <h2 className="tracking-title">Know Exactly Where<br/>Your Driver Is</h2>
              <p className="tracking-desc">Powered by Socket.io, our live tracking engine refreshes every 2 seconds — so you're always in sync with your ride.</p>
              <div className="tracking-features">
                <TrackFeat icon="📍" title="Live Driver Location" sub="2-second GPS refresh via Socket.io" />
                <TrackFeat icon="⏱️" title="Smart ETA Prediction" sub="AI-adjusted for real-time traffic data" />
                <TrackFeat icon="🗺️" title="Full Route Visualization" sub="See the entire path from pickup to drop" />
                <TrackFeat icon="🔔" title="Push Notifications" sub="Driver arriving, on trip, and reached alerts" />
              </div>
              <a href="#services" className="btn-primary filled">Start Tracking Now →</a>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO KYC */}
      <section id="kyc">
        <div className="container">
          <div className="kyc-grid">
            <div className="kyc-info reveal">
              <span className="section-tag">Driver Verification</span>
              <h2 className="tracking-title">Zero Compromise on<br/>Your Safety</h2>
              <p className="tracking-desc">Every driver on VeloRide completes a full ZEGOCLOUD-powered video KYC process before their first ride.</p>
              <div className="tracking-features" style={{ marginBottom: '28px' }}>
                <TrackFeat icon="🎥" title="Video Identity Verification" sub="Live video call with AI face matching" />
                <TrackFeat icon="🪪" title="Document Scan & OCR" sub="Aadhaar, PAN, Driving License verified" />
                <TrackFeat icon="✅" title="Background Check" sub="Criminal record and police NOC verified" />
              </div>
              <div className="trust-badges">
                <div className="trust-badge">🔒 End-to-End Encrypted</div>
                <div className="trust-badge">🛡️ Govt. ID Verified</div>
                <div className="trust-badge">🤖 AI-Powered</div>
              </div>
            </div>

            <div className="reveal reveal-delay-2">
              <div className="kyc-mockup">
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.03em' }}>Driver Verification Portal</div>
                <div className="kyc-video-area">
                  <div className="kyc-person-silhouette"><div className="kyc-person-head"></div></div>
                  <div className="kyc-face-scan">
                    <div className="scan-line"></div>
                    <div className="kyc-corner tl"></div><div className="kyc-corner tr"></div>
                    <div className="kyc-corner bl"></div><div className="kyc-corner br"></div>
                  </div>
                  <div className="kyc-live-badge"><span className="live-dot"></span> LIVE</div>
                </div>
                <div className="kyc-steps">
                  <KycStep status="done" num="✓" label="Document Upload" sub="Driving License verified" />
                  <KycStep status="done" num="✓" label="Aadhaar eKYC" sub="Identity confirmed" />
                  <KycStep status="active" num="3" label="Video Verification" sub="Live selfie matching..." />
                  <KycStep status="pending" num="4" label="Background Check" sub="Pending approval" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="dashboard">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Multi-Role Platform</span>
            <h2 className="section-title">Built for Users, Drivers<br/>& Admins</h2>
            <p className="section-subtitle">A fully-featured dashboard system for every stakeholder.</p>
          </div>

          <div className="dashboard-tabs">
            <button className={`dash-tab ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>👤 User View</button>
            <button className={`dash-tab ${activeTab === 'driver' ? 'active' : ''}`} onClick={() => setActiveTab('driver')}>🚗 Driver View</button>
            <button className={`dash-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>⚙️ Admin View</button>
          </div>

          <div className="full-dashboard reveal" id="dashboardPanel">
            <div className="full-sidebar">
              <div className="sidebar-profile">
                <div className="profile-avatar">{currentDash.avatar}</div>
                <div>
                  <div className="profile-name">{currentDash.name}</div>
                  <div className="profile-role">{currentDash.role}</div>
                </div>
              </div>
              <div className="sidebar-menu">
                <div className="sidebar-item active"><span className="sidebar-item-icon">🏠</span> Dashboard</div>
                <div className="sidebar-item"><span className="sidebar-item-icon">🚗</span> My Rides <span className="sidebar-item-badge">3</span></div>
                <div className="sidebar-item"><span className="sidebar-item-icon">💳</span> Payments</div>
                <div className="sidebar-item"><span className="sidebar-item-icon">👥</span> Refer & Earn</div>
              </div>
            </div>

            <div className="full-dash-content">
              <div className="dash-header">
                <div>
                  <div className="dash-greeting">{currentDash.greeting}</div>
                  <div className="dash-date">Thursday, 30 April 2026</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div onClick={() => setShowBookingModal(true)} style={{ padding: '8px 14px', background: 'rgba(67,97,238,0.08)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>+ Book Ride</div>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer' }}>🔔</div>
                </div>
              </div>

              <div className="dash-metrics">
                {currentDash.metrics.map((m, i) => (
                  <div className="metric-card" key={i}>
                    <div className="metric-icon">{m.icon}</div>
                    <div className="metric-value">{m.value}</div>
                    <div className="metric-label">{m.label}</div>
                    <div className={`metric-change ${m.type}`}>{m.change}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">FAQ</span>
            <h2 className="section-title">Frequently Asked<br/>Questions</h2>
          </div>
          <div className="faq-list">
            <FaqItem index={0} openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} question="How does the driver verification process work?" answer="Every driver undergoes a 4-step verification: document upload, eKYC, live video verification, and background check." />
            <FaqItem index={1} openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} question="How does real-time tracking work?" answer="We use Socket.io for bidirectional real-time communication. Driver GPS is pushed every 2 seconds." />
            <FaqItem index={2} openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} question="What payment methods does VeloRide accept?" answer="We accept UPI, cards, net banking, and VeloWallet via Razorpay." />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#hero" className="nav-logo">VeloRide</a>
              <p className="footer-desc">The intelligent vehicle booking platform for modern India.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">© 2026 VeloRide Technologies Pvt. Ltd.</div>
          </div>
        </div>
      </footer>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────

const ServiceCard: React.FC<{ icon: string, name: string, desc: string, price: string, delay?: string }> = ({ icon, name, desc, price, delay }) => (
  <div className={`service-card reveal ${delay || ''}`}>
    <div className="service-icon">{icon}</div>
    <div className="service-name">{name}</div>
    <div className="service-desc">{desc}</div>
    <div className="service-price">{price} <span>/ ride</span></div>
  </div>
);

const TrackFeat: React.FC<{ icon: string, title: string, sub: string }> = ({ icon, title, sub }) => (
  <div className="track-feat">
    <div className="track-feat-icon">{icon}</div>
    <div>
      <div className="track-feat-text">{title}</div>
      <div className="track-feat-sub">{sub}</div>
    </div>
  </div>
);

const KycStep: React.FC<{ status: 'done' | 'active' | 'pending', num: string, label: string, sub: string }> = ({ status, num, label, sub }) => (
  <div className={`kyc-step ${status}`}>
    <div className="kyc-step-num">{num}</div>
    <div>
      <div className="kyc-step-label">{label}</div>
      <div className="kyc-step-sub">{sub}</div>
    </div>
  </div>
);

const FaqItem: React.FC<{ index: number, openIndex: number | null, setOpenIndex: (i: number | null) => void, question: string, answer: string }> = ({ index, openIndex, setOpenIndex, question, answer }) => {
  const isOpen = openIndex === index;
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''} reveal`}>
      <div className="faq-question" onClick={() => setOpenIndex(isOpen ? null : index)}>
        {question}
        <span className="faq-chevron">▾</span>
      </div>
      <div className="faq-answer" style={{ maxHeight: isOpen ? '200px' : '0' }}>
        <div className="faq-answer-inner">{answer}</div>
      </div>
    </div>
  );
};

export default App;
