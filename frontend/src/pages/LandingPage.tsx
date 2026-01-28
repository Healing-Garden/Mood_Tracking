import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ArrowRight, Leaf, Heart, BarChart3, Brain, Lock, Shield } from 'lucide-react'

interface FeatureItem {
  title: string
  description: string
  icon: React.ElementType
}

interface LeafConfig {
  left: string
  top: string
  size: number
  duration: string
  delay: string
}

interface FlowerConfig {
  left: string;
  top: string;
  size: number;
  duration: string;
  delay: string;
  color: string; 
  opacity: number;        
  rotation: number;
}

const FEATURES: FeatureItem[] = [
  {
    title: 'Daily Check-ins',
    description: 'Quick mood tracking with daily mood tracking, journaling, and more with peace of mind',
    icon: Heart,
  },
  {
    title: 'Smart Journaling',
    description: 'Write freely and let AI help you understand your thoughts and emotions better',
    icon: Brain,
  },
  {
    title: 'AI Chat Partner',
    description: 'Get AI-powered support and guidance designed just for your wellness journey',
    icon: BarChart3,
  },
  {
    title: 'Mindful Analytics',
    description: 'Visualize patterns, triggers, and progress with beautiful interactive charts',
    icon: Leaf,
  },
  {
    title: 'Personalized Insights',
    description: 'Get thoughtful recommendations based on your unique emotional patterns',
    icon: Brain,
  },
  {
    title: 'Healing Guides',
    description: 'Access breathing exercises, meditation tips, and wellness resources',
    icon: Heart,
  },
]

const generateLeaves = (): LeafConfig[] => {
  return Array.from({ length: 25 }).map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${-20 - Math.random() * 50}%`,
    size: Math.random() * 35 + 18,
    duration: `${20 + Math.random() * 15}s`,
    delay: `${Math.random() * 8}s`,
  }))
}

const generateFlowers = (): FlowerConfig[] => {
  const colors = ['#ffffff', '#fffacd', '#fff8dc'];

  return Array.from({ length: 30 }).map(() => {
    return {
      left: `${Math.random() * 100}%`,
      top: `${-20 - Math.random() * 50}%`,
      size: Math.random() * 28 + 16,
      duration: `${25 + Math.random() * 20}s`,
      delay: `${Math.random() * 10}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,  
      rotation: Math.random() * 360,                   
    }
  })
}

// SVG Daisy Flower component
const SVGFlower = ({ color, size }: { color: string; size: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* 12 petals for daisy */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const cx = 50 + 30 * Math.cos(angle);
        const cy = 50 + 30 * Math.sin(angle);
        return (
          <ellipse
            key={`petal-${i}`}
            cx={cx}
            cy={cy}
            rx="10"
            ry="20"
            fill={color}
            opacity="0.95"
            transform={`rotate(${i * 30} ${cx} ${cy})`}
          />
        );
      })}
      {/* Center circle - yellow */}
      <circle cx="50" cy="50" r="14" fill="#FFD700" opacity="0.95" />
      <circle cx="50" cy="50" r="11" fill="#FFC700" opacity="0.85" />
    </svg>
  );
}

const leaves = generateLeaves()
const flowers = generateFlowers()

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated falling leaves background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {leaves.map((leaf, i) => (
          <div
            key={i}
            className="absolute animate-fall-leaf"
            style={{
              left: leaf.left,
              top: leaf.top,
              opacity: 0.12,
              animation: `fall-leaf ${leaf.duration} linear infinite`,
              animationDelay: leaf.delay,
            }}
          >
            <Leaf size={leaf.size} className="text-primary" />
          </div>
        ))}
      </div>

      {/* Animated falling flowers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {flowers.map((flower, i) => (
          <div
            key={i}
            className="absolute animate-fall-flower"
            style={{
              left: flower.left,
              top: flower.top,
              animation: `fall-flower ${flower.duration} linear infinite`,
              animationDelay: flower.delay,
              width: flower.size,
              height: flower.size,
            }}
          >
            <SVGFlower color={flower.color} size={flower.size} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-border bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/healing-garden-logo.png"
              alt="Healing Garden"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div className="text-xl font-bold text-primary">Healing Garden</div>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="outline" className="border-primary text-primary hover:bg-secondary/30 bg-transparent">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Your Personal Mental Health
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold text-accent">
              Flower Garden
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Cultivate your feelings journey with daily mood tracking, journaling, and AI-powered insights in a peaceful garden sanctuary.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 text-base gap-2 px-8">
                Get Started Free <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-primary text-primary hover:bg-secondary/30 h-12 text-base px-8 bg-transparent">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Designed for Your Wellness */}
      <section className="relative z-10 bg-white/60 py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Designed for Your Wellness
            </h3>
            <p className="text-foreground/60">Drive strategic well-being with tools designed to help you understand yourself better</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const IconComponent = feature.icon
              return (
                <div 
                  key={i} 
                  className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                >
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                    <IconComponent size={24} className="text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="relative z-10 bg-muted py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-border">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Your Privacy & Security Matter
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Lock size={24} className="text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground/70">
                  <strong className="text-foreground">End-to-end encryption</strong> for all your personal mental and personal data
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Shield size={24} className="text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground/70">
                  <strong className="text-foreground">Your data stays yours</strong> with full control over who can access it
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <Heart size={24} className="text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground/70">
                  <strong className="text-foreground">HIPAA-compliant infrastructure</strong> with regular security audits
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-3">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Start Your Healing Garden Today
            </h3>
            <p className="text-lg text-foreground/60">
              Join thousands who are cultivating their wellness journey with daily insights and support
            </p>
          </div>
          <Link to="/register">
            <Button className="bg-primary hover:bg-primary/90 text-white h-12 text-base px-10 gap-2">
              Plant Your Seeds Now <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-white/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-foreground/60 text-sm">
          <p>🌼 Healing Garden - Nurturing Your Mental Wellness Journey Together</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage