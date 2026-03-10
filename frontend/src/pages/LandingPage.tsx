import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight, Leaf, BookOpen, MessageSquare, TrendingUp, Menu, X } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  color: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'Understanding Your Emotional Patterns',
    excerpt: 'Discover how daily reflections can transform your mental health journey and unlock deeper self-awareness.',
    category: 'Wellness',
    date: 'Mar 15, 2024',
    color: 'from-[#188618] to-[#122012]',
  },
  {
    id: 2,
    title: 'The Power of Digital Journaling',
    excerpt: 'Learn why keeping a multimedia journal is one of the most powerful tools for emotional healing.',
    category: 'Journal',
    date: 'Mar 12, 2024',
    color: 'from-[#122012] to-[#188618]',
  },
  {
    id: 3,
    title: 'AI-Guided Emotional Support',
    excerpt: 'How artificial intelligence is revolutionizing personal wellness and emotional intelligence.',
    category: 'Technology',
    date: 'Mar 10, 2024',
    color: 'from-yellow-400 to-orange-400',
  },
  {
    id: 4,
    title: 'Growing Your Healing Garden',
    excerpt: 'Transform your emotional landscape into a thriving sanctuary of peace and growth.',
    category: 'Growth',
    date: 'Mar 8, 2024',
    color: 'from-green-400 to-[#188618]',
  },
];

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

  return (
    <div className="min-h-screen bg-[#f6f8f6] overflow-x-hidden">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-[#f6f8f6]/80 backdrop-blur-sm'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Healing Garden Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="font-bold text-lg text-[#122012] group-hover:text-[#188618] transition">
                Healing Garden
              </span>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#122012] hover:text-[#188618] transition font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-[#122012] hover:text-[#188618] transition font-medium">
                How It Works
              </a>
              <a href="#blog" className="text-[#122012] hover:text-[#188618] transition font-medium">
                Blog
              </a>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-[#122012] hover:bg-green-50">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#188618] hover:bg-[#127012] text-white">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-green-100 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#features" className="block px-4 py-2 text-[#122012] hover:bg-green-100 rounded">
                Features
              </a>
              <a href="#how-it-works" className="block px-4 py-2 text-[#122012] hover:bg-green-100 rounded">
                How It Works
              </a>
              <a href="#blog" className="block px-4 py-2 text-[#122012] hover:bg-green-100 rounded">
                Blog
              </a>
              <div className="flex gap-2 px-4 pt-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full border-[#188618] text-[#188618]">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="flex-1">
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
      <section className="relative pt-32 pb-40 overflow-hidden">
        {/* Background Image with Parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/flower.jpg')`,
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/50 to-[#f6f8f6]" />

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 z-10">
          <div
            className="inline-block mb-6 px-4 py-2 bg-[#188618]/15 rounded-full border border-[#188618]/30 transition-all duration-700 opacity-100 translate-y-0"
          >
            <span className="text-sm font-bold text-[#188618]">New · Emotional Wellness Platform</span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold text-[#122012] mb-6 leading-tight transition-all duration-700 opacity-100 translate-y-0"
          >
            Nurture Your Emotions,<br />
            <span className="text-[#188618]">Bloom Your Soul</span>
          </h1>

          <p
            className="text-xl text-[#122012]/80 mb-10 max-w-2xl mx-auto transition-all duration-700 delay-100 opacity-100 translate-y-0"
          >
            Your personal sanctuary for emotional wellness. Track moods, journal freely, and cultivate peace through AI-guided insights that truly understand you.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-200 opacity-100 translate-y-0"
          >
            <Link to="/register">
              <Button size="lg" className="bg-[#188618] hover:bg-[#127012] text-white shadow-lg hover:shadow-xl gap-2 px-8">
                Start Growing <ArrowRight size={20} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="border-2 border-[#188618] text-[#188618] hover:bg-[#188618]/5 px-8">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={(el) => { sectionRefs.current[0] = el; }}
        data-reveal="zoom"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#188618] font-bold text-sm uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-4xl font-bold text-[#122012] mb-4">Everything You Need to Bloom</h2>
            <p className="text-gray-600 text-lg">A complete platform for emotional wellness and growth</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: 'Multimedia Journal', desc: 'Express with text, voice, and images' },
              { icon: MessageSquare, title: 'AI Companion', desc: 'Personalized guidance when you need it' },
              { icon: TrendingUp, title: 'Mood Analytics', desc: 'Track patterns and celebrate growth' },
              { icon: Leaf, title: 'Your Garden', desc: 'Visualize your emotional journey' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-2xl hover:shadow-lg transition-all duration-500 reveal"
                data-reveal={idx % 2 === 0 ? 'fade-up' : 'zoom'}
                style={{ '--reveal-delay': `${idx * 140}ms`, } as React.CSSProperties}
              >
                <feature.icon className="w-12 h-12 text-[#188618] mb-4" />
                <h3 className="font-bold text-[#122012] mb-2 text-lg">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="py-20 bg-gradient-to-b from-green-50/50 to-white reveal"
        data-reveal="fade-up"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#188618] font-bold text-sm uppercase tracking-widest mb-2">Your Journey</p>
            <h2 className="text-4xl font-bold text-[#122012] mb-4">Four Steps to Inner Peace</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            {[
              { num: '01', title: 'Check In', text: 'Start with your daily mood' },
              { num: '02', title: 'Journal', text: 'Express your authentic self' },
              { num: '03', title: 'Reflect', text: 'Gain AI-powered insights' },
              { num: '04', title: 'Grow', text: 'Watch yourself transform' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="reveal"
                style={{ '--reveal-delay': `${idx * 180}ms`, } as React.CSSProperties}
              >
                <div className="w-14 h-14 rounded-full bg-[#188618] text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.num}
                </div>

                <h3 className="font-bold text-[#122012] text-lg mb-2">
                  {item.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section
        id="blog"
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="py-20 bg-white reveal"
        data-reveal="fade-up"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#188618] font-bold text-sm uppercase tracking-widest mb-2">Wellness Insights</p>
            <h2 className="text-4xl font-bold text-[#122012] mb-4">Learn & Grow</h2>
            <p className="text-gray-600 text-lg">Expert insights and community stories on the wellness journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {BLOG_POSTS.map((post, idx) => (
              <div
                key={post.id}
                className="group cursor-pointer h-full bg-white border border-green-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 "
                data-reveal={idx % 3 === 0 ? 'fade-up' : idx % 3 === 1 ? 'fade-left' : 'zoom'}
                style={{ '--reveal-delay': `${idx * 140}ms`, } as React.CSSProperties}
              >
                <div className={`h-40 bg-gradient-to-br ${post.color} group-hover:scale-105 transition-transform duration-300`} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#188618] bg-green-100 px-3 py-1 rounded-full">{post.category}</span>
                    <span className="text-xs text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="font-bold text-[#122012] mb-2 group-hover:text-[#188618] transition line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="mt-auto flex items-center gap-1 text-[#188618] font-medium text-sm group-hover:gap-2 transition">
                    Read More <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/blog">
              <Button className="bg-[#188618] hover:bg-[#127012] text-white px-8">View All Articles</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="py-24 bg-gradient-to-br from-[#f1fbf1] via-[#e3f4e6] to-[#d2eed8] text-center reveal"
        data-reveal="fade-up"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-green-200 text-[#188618] font-semibold text-sm mb-6 reveal" style={{ '--reveal-delay': `80ms`, } as React.CSSProperties}>
            Ready to start your journey?
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-5 text-[#122012] leading-tight">
            Ready to Bloom?
          </h2>
          <p className="text-[#122012]/75 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands nurturing their emotional gardens. Create a calming routine with mood check-ins, journaling, and gentle AI support.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-[#188618] hover:bg-[#127012] text-white shadow-xl hover:shadow-2xl gap-2 px-10 py-7 text-lg rounded-full"
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