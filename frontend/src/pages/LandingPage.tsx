import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight, Leaf, BookOpen, MessageSquare, TrendingUp, Menu, X } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else {
            entry.target.classList.remove('in-view');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    revealElements.forEach((el) => observer.observe(el));

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      revealElements.forEach((el) => observer.unobserve(el));
      sectionRefs.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  useEffect(() => {
    // Disable automatic scroll restoration by the browser
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll to video section on mount/reload
    const scrollToVideo = () => {
      const videoSection = document.getElementById('hero-video-section');
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    // Run immediately and after a short delay to ensure it wins
    scrollToVideo();
    const timer = setTimeout(scrollToVideo, 100);

    return () => {
      clearTimeout(timer);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8f6] overflow-x-hidden">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 400
          ? 'bg-white shadow-lg backdrop-blur-0'
          : 'bg-transparent backdrop-blur-0'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Healing Garden Logo"
                className={`w-10 h-10 object-contain transition-opacity duration-300 ${scrollY > 400 ? 'opacity-100' : 'opacity-90'
                  }`}
              />
              <span
                className={`font-bold text-lg transition-all duration-300 ${scrollY > 400 ? 'text-[#122012]' : 'text-white'
                  } group-hover:text-[#188618]`}
              >
                Healing Garden
              </span>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="#aboutus"
                className={`px-4 py-2 rounded-full border border-transparent transition-all duration-300 font-medium ${scrollY > 400
                  ? 'text-[#122012] hover:text-[#188618] hover:bg-green-50/80 hover:backdrop-blur-md hover:border-green-100 hover:shadow-[0_4px_20px_rgba(24,134,24,0.1)]'
                  : 'text-white hover:bg-white/20 hover:backdrop-blur-md hover:border-white/30 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
                  }`}
              >
                About Us
              </a>
              <a
                href="#features"
                className={`px-4 py-2 rounded-full border border-transparent transition-all duration-300 font-medium ${scrollY > 400
                  ? 'text-[#122012] hover:text-[#188618] hover:bg-green-50/80 hover:backdrop-blur-md hover:border-green-100 hover:shadow-[0_4px_20px_rgba(24,134,24,0.1)]'
                  : 'text-white hover:bg-white/20 hover:backdrop-blur-md hover:border-white/30 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
                  }`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`px-4 py-2 rounded-full border border-transparent transition-all duration-300 font-medium ${scrollY > 400
                  ? 'text-[#122012] hover:text-[#188618] hover:bg-green-50/80 hover:backdrop-blur-md hover:border-green-100 hover:shadow-[0_4px_20px_rgba(24,134,24,0.1)]'
                  : 'text-white hover:bg-white/20 hover:backdrop-blur-md hover:border-white/30 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
                  }`}
              >
                How It Works
              </a>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" state={{ fromLanding: true }}>
                <Button
                  className={`${scrollY > 400
                    ? 'border border-[#188618] text-[#188618] bg-transparent hover:bg-[#188618] hover:text-white'
                    : 'bg-white/90 hover:bg-transparent text-[#188618] hover:text-white border border-white backdrop-blur-sm shadow-sm'
                    } px-5 py-2 font-semibold transition-colors duration-300`}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register" state={{ fromLanding: true }}>
                <Button className="bg-[#188618] hover:bg-[#127012] text-white">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-green-100/30 rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className={`md:hidden pb-6 space-y-2 ${scrollY > 400 ? 'bg-white' : 'bg-transparent'
                }`}
            >
              <a
                href="#aboutus"
                className={`block px-4 py-3 border border-transparent rounded-xl transition-all duration-300 ${scrollY > 400 
                  ? 'text-[#122012] hover:bg-green-50/80 hover:backdrop-blur-md hover:border-green-100 hover:shadow-[0_4px_15px_rgba(24,134,24,0.1)]' 
                  : 'text-white hover:bg-white/20 hover:backdrop-blur-md hover:border-white/30 hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)]'
                  }`}
              >
                About Us
              </a>
              <a
                href="#features"
                className={`block px-4 py-3 border border-transparent rounded-xl transition-all duration-300 ${scrollY > 400 
                  ? 'text-[#122012] hover:bg-green-50/80 hover:backdrop-blur-md hover:border-green-100 hover:shadow-[0_4px_15px_rgba(24,134,24,0.1)]' 
                  : 'text-white hover:bg-white/20 hover:backdrop-blur-md hover:border-white/30 hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)]'
                  }`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className={`block px-4 py-3 border border-transparent rounded-xl transition-all duration-300 ${scrollY > 400 
                  ? 'text-[#122012] hover:bg-green-50/80 hover:backdrop-blur-md hover:border-green-100 hover:shadow-[0_4px_15px_rgba(24,134,24,0.1)]' 
                  : 'text-white hover:bg-white/20 hover:backdrop-blur-md hover:border-white/30 hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)]'
                  }`}
              >
                How It Works
              </a>
              <div className="flex gap-3 px-4 pt-4">
                <Link to="/login" state={{ fromLanding: true }} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-[#188618] text-[#188618]"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" state={{ fromLanding: true }} className="flex-1">
                  <Button className="w-full bg-[#188618] text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-video-section" className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster="/flower.jpg"
          >
            <source src="/hero.mp4" type="video/mp4" />
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('/flower.jpg')`,
                backgroundAttachment: 'fixed',
              }}
            />
          </video>
        </div>
        {/* Transparent at the top, perfectly fading to solid green at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#bce3bc] via-transparent via-40% to-transparent" />

        {/* Content */}
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-5xl -mt-16">
            <div
              className="inline-block mb-12 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 transition-all duration-700 opacity-100 translate-y-0 hover:bg-white/30"
            >
              <span className="text-sm font-bold text-white drop-shadow-lg">New · Emotional Wellness Platform</span>
            </div>

            <h1
              className="text-6xl md:text-8xl font-bold mb-16 leading-tight transition-all duration-700 opacity-100 translate-y-0"
            >
              <span
                className="text-white drop-shadow-2xl block mb-2 text-7xl md:text-7xl"
                style={{ fontFamily: "'DM Serif Text', Georgia, sans-serif" }}
              >
                Nurture Your Emotions
              </span>
              <span
                className="text-green-200 drop-shadow-2xl block text-5xl md:text-6xl"
                style={{ fontFamily: "'Kithara Sophisticated Serif', Georgia, serif" }}
              >
                Bloom Your Soul
              </span>
            </h1>

            <div
              className="flex flex-col sm:flex-row gap-6 justify-center transition-all duration-700 delay-200 opacity-100 translate-y-0"
            >
              <Link to="/register" state={{ fromLanding: true }}>
                <Button size="lg" className="bg-[#188618] hover:bg-[#127012] text-white shadow-lg hover:shadow-xl gap-2 px-8">
                  Start Growing <ArrowRight size={20} />
                </Button>
              </Link>
              <a 
                href="#aboutus"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('aboutus');
                  if (target) {
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY;
                    const startPosition = window.scrollY;
                    const distance = targetPosition - startPosition;
                    let startTime: number | null = null;
                    const duration = 1200; // Slow custom scroll length (1.2s)
                    
                    const animation = (currentTime: number) => {
                      if (startTime === null) startTime = currentTime;
                      const timeElapsed = currentTime - startTime;
                      const progress = Math.min(timeElapsed / duration, 1);
                      // Smooth ease-in-out easing
                      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                      window.scrollTo(0, startPosition + distance * ease);
                      if (timeElapsed < duration) requestAnimationFrame(animation);
                    };
                    requestAnimationFrame(animation);
                  }
                }}
              >
                <Button
                  size="lg"
                  className="bg-white/90 hover:bg-transparent text-[#188618] hover:text-white border border-white px-8 shadow-[0_4px_20px_rgba(255,255,255,0.2)] font-bold backdrop-blur-sm transition-colors duration-300"
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section with matching real-green background transition */}
      <section id="aboutus" className="relative py-24 bg-gradient-to-b from-[#bce3bc] via-[#f7fbf7] to-green-50">
        {/* We removed the floating overlay to ensure crisp text over a solid green background */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ${scrollY > 200 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            {/* Left - Text */}
            <div>
              <p className="text-[#188618] font-bold text-sm uppercase tracking-widest mb-4">About Us</p>
              <h2 className="text-4xl font-bold text-[#122012] mb-6">Nurturing Emotional Wellness</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                Healing Garden is built on the belief that emotional wellness is a journey, not a destination. We've created a compassionate digital sanctuary where your feelings are valid, and your growth is celebrated.              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Our mission is to provide accessible, personalized mental health support and truly empower users. Through daily check-ins, meaningful journaling, and AI-driven insights, we help you cultivate a vibrant inner garden.
              </p>

              <div className="flex gap-10">
                <div>
                  <p className="text-4xl font-bold text-[#188618]">50K+</p>
                  <p className="text-gray-600 text-sm">Users Growing</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#188618]">2M+</p>
                  <p className="text-gray-600 text-sm">Journal Entries</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#188618]">98%</p>
                  <p className="text-gray-600 text-sm">Satisfaction Rate</p>
                </div>
              </div>
            </div>

            {/* Right - Values & Privacy */}
            <div
              className={`space-y-6 transition-all duration-700 delay-100 ${scrollY > 200 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
            >
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 border border-green-200 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-[#122012] mb-4 text-xl">Our Values</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-[#188618] font-bold text-xl mt-1">✓</span>
                    <span>Compassionate & judgment-free support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#188618] font-bold text-xl mt-1">✓</span>
                    <span>Privacy & Absolute Confidentiality</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#188618] font-bold text-xl mt-1">✓</span>
                    <span>Personal Growth Through Self-Reflection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#188618] font-bold text-xl mt-1">✓</span>
                    <span>Technology Combined with Human Connection</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#188618]/10 to-[#188618]/5 rounded-2xl p-8 border border-[#188618]/20 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-[#122012] mb-4 text-xl">For Your Peace of Mind</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your data is encrypted end-to-end. We never sell your personal information, and you have complete control over your garden. Mental health is a private matter – we respect that.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transition-all duration-700 ${scrollY > 600 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <p className="text-[#188618] font-bold text-sm uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-4xl font-bold text-[#122012] mb-4">Everything You Need to Bloom</h2>
            <p className="text-gray-600 text-lg">A complete platform for emotional wellness and growth</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: 'Multimedia Journal', desc: 'Express with text, voice, and images', delay: 0, gradient: 'from-emerald-50 to-green-50' },
              { icon: MessageSquare, title: 'AI Companion', desc: 'Personalized guidance when you need it', delay: 100, gradient: 'from-green-50 to-teal-50' },
              { icon: TrendingUp, title: 'Mood Analytics', desc: 'Track patterns and celebrate growth', delay: 200, gradient: 'from-teal-50 to-cyan-50' },
              { icon: Leaf, title: 'Your Garden', desc: 'Visualize your emotional journey', delay: 300, gradient: 'from-teal-50 to-cyan-50' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`relative p-8 bg-gradient-to-br ${feature.gradient} border border-green-200 rounded-2xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group overflow-hidden ${scrollY > 600 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#188618]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-[#188618]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#188618]/20 transition-colors duration-300">
                    <feature.icon className="w-7 h-7 text-[#188618]" />
                  </div>
                  <h3 className="font-bold text-[#122012] mb-2 text-lg">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-green-50 via-white to-[#f1fbf1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transition-all duration-700 ${scrollY > 1100 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            <p className="text-[#188618] font-bold text-sm uppercase tracking-widest mb-2">Your Journey</p>
            <h2 className="text-4xl font-bold text-[#122012] mb-4">Four Steps to Inner Peace</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-6 right-6 h-0.5 bg-gradient-to-r from-[#188618]/20 via-[#188618]/60 to-[#188618]/20" />

            {[
              { num: '01', title: 'Check In', text: 'Start with your daily mood', delay: 0 },
              { num: '02', title: 'Journal', text: 'Express your authentic self', delay: 100 },
              { num: '03', title: 'Reflect', text: 'Gain AI-powered insights', delay: 200 },
              { num: '04', title: 'Grow', text: 'Watch yourself transform', delay: 300 },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`text-center relative z-10 transition-all duration-700 group ${scrollY > 1100 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${item.delay}ms` }}
              >
                <div className="w-16 h-16 bg-[#188618] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 hover:scale-125 hover:shadow-2xl transition-all duration-300 shadow-lg relative">
                  <span className="absolute inset-0 bg-[#188618] rounded-full opacity-20 group-hover:scale-150 transition-transform duration-300" />
                  <span className="relative">{item.num}</span>
                </div>
                <h3 className="font-bold text-[#122012] mb-2 text-lg">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="py-28 bg-gradient-to-br from-[#f1fbf1] via-[#e8f7ea] to-[#d2eed8] text-center reveal"
        data-reveal="fade-up"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-green-300 text-[#188618] font-semibold text-sm mb-6 reveal hover:bg-white/90 transition-all" style={{ '--reveal-delay': `80ms`, } as React.CSSProperties}>
            Ready to start your journey?
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#122012] leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            Ready to Bloom?
          </h2>
          <p className="text-[#122012]/75 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands nurturing their emotional gardens. Create a calming routine with mood check-ins, journaling, and gentle AI support.
          </p>
          <Link to="/register" state={{ fromLanding: true }}>
            <Button
              size="lg"
              className="bg-[#188618] hover:bg-[#127012] text-white shadow-2xl hover:shadow-2xl gap-2 px-10 py-7 text-lg rounded-full transition-all hover:scale-105 duration-300"
            >
              Plant Your First Seed <ArrowRight size={24} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2a12] text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/healing-garden-logo.png"
                  alt="Healing Garden Logo"
                  className="w-10 h-10 rounded-lg object-contain"
                />
                <span className="font-bold text-lg tracking-tight">Healing Garden</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Cultivating emotional wellness one day at a time.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Blog', 'Pricing'] },
              { title: 'Company', links: ['About', 'Contact', 'Team'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold mb-4 text-white/90">{col.title}</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>&copy; 2026 Healing Garden. Growing together in peace.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;