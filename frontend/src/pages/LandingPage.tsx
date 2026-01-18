import { Link } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Heart, Brain, BarChart3, Zap, MessageSquare, Calendar } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--secondary)_/_0.05)] to-[hsl(var(--accent)_/_0.1)]">
      <Header />

      <section className="px-6 lg:px-12 py-20 lg:py-32 max-w-6xl mx-auto relative">
        <div className="absolute top-10 right-10 text-6xl opacity-20">🌸</div>
        <div className="absolute bottom-20 left-10 text-5xl opacity-20">🌻</div>

        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-5xl lg:text-7xl font-bold text-[hsl(var(--foreground))] mb-6 leading-tight">
            Your Personal Mental Health
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--secondary))] bg-clip-text text-transparent">
              {' '}
              Flower Garden
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Cultivate your healing journey with daily mood tracking, journaling, and AI-powered insights in a peaceful garden sanctuary.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-[hsl(var(--primary))] text-white rounded-full px-8">
                Plant Your Seeds
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full px-8 bg-transparent">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-[hsl(var(--foreground))] mb-4">
          Designed for Your Wellness
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
          Grow stronger each day with tools designed to help you bloom and understand yourself better.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Daily Check-ins', description: 'Quick mood and energy tracking with beautiful emoji selectors.', flower: '🌱' },
            { icon: Brain, title: 'Smart Journaling', description: 'Write freely with AI-powered prompts. Capture your thoughts.', flower: '🌷' },
            { icon: MessageSquare, title: 'AI Chat Partner', description: '24/7 support with CBT-based conversations.', flower: '🌹' },
            { icon: BarChart3, title: 'Meaningful Analytics', description: 'Beautiful visualizations showing your mood trends.', flower: '📊' },
            { icon: Zap, title: 'Personalized Insights', description: 'AI analyzes your journey to detect patterns.', flower: '⚡' },
            { icon: Heart, title: 'Healing Content', description: 'Access curated breathing exercises and mindfulness content.', flower: '💚' },
          ].map((feature, idx) => (
            <Card key={idx} className="border border-[hsl(var(--border)_/_0.5)] hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.flower}</span>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="px-6 lg:px-12 py-8 border-t border-[hsl(var(--border))] mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="text-2xl">🌼</span>
            <span className="font-semibold text-[hsl(var(--foreground))]">Healing Garden</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2026 Healing Garden. Supporting your mental health journey.</p>
        </div>
      </footer>
    </main>
  )
}
