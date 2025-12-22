import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Video, Zap, Shield, Users, ArrowRight } from 'lucide-react';
import { isAuthenticated } from '../lib/auth';
import Button from '../components/ui/Button';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
          <div className="text-center space-y-6 md:space-y-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 md:mb-6">
              <Video className="size-12 sm:size-14 md:size-16 text-primary" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">NoWhat</h1>
            </div>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              A modern live streaming platform built with tRPC, React, Agora, and PostgreSQL.
              Secure, type-safe, and ready for production.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/register')}>
                Get Started
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 sm:py-16 md:py-24 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">Why Choose NoWhat?</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Everything you need for live streaming</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-lg border border-border p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="size-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Real-Time Streaming</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Crystal clear video and audio powered by Agora's industry-leading WebRTC technology
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-lg border border-border p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="size-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Secure & Private</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                End-to-end type safety with tRPC and secure authentication for all users
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-lg border border-border p-6 text-center space-y-4 sm:col-span-2 md:col-span-1">
              <div className="flex justify-center">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="size-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Built with modern technologies for blazing fast performance and reliability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Users className="size-12 sm:size-14 md:size-16 text-primary mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to get started?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Join thousands of users already streaming live on NoWhat
          </p>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/register')}>
            Create Your Account
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
