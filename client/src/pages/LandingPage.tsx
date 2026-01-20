import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import {
  Video,
  Gavel,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Users,
} from "lucide-react";
import { isAuthenticated } from "../lib/auth";
import Button from "../components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
          <div className="text-center space-y-6 md:space-y-8">
            <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
              <div className="relative">
                <Video className="size-14 sm:size-16 md:size-20 text-primary" />
                <Gavel className="size-7 sm:size-8 md:size-10 text-primary absolute -bottom-1 -right-1" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Live Shopping,
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Real-Time Auctions
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
                Join the future of interactive commerce. Watch live streams,
                chat with sellers, and bid on exclusive products in real-time.
                Why shop alone when you can shop live?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Button size="lg" className="w-full sm:w-auto text-base" asChild>
                <Link to="/register">
                  Start Bidding Now
                  <ArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base"
                asChild
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>Live interactions</span>
              </div>
              <div className="flex items-center gap-2">
                <Gavel className="size-4" />
                <span>Real-time bidding</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" />
                <span>Exclusive deals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 sm:py-20 md:py-28 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              How WhyNot Works
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              A seamless experience for both buyers and sellers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-16">
            {/* For Buyers */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="size-6 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">For Buyers</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Browse Live Channels
                    </h4>
                    <p className="text-muted-foreground">
                      Discover exciting live streams from sellers showcasing
                      their products
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Interact & Engage
                    </h4>
                    <p className="text-muted-foreground">
                      Chat with sellers and other buyers in real-time during the
                      stream
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Bid on Products
                    </h4>
                    <p className="text-muted-foreground">
                      Place your bid when a product catches your eye and win
                      great deals
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Win & Receive
                    </h4>
                    <p className="text-muted-foreground">
                      Win the auction and get the product delivered to your
                      address
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Sellers */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="size-6 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">For Sellers</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Set Up Your Shop
                    </h4>
                    <p className="text-muted-foreground">
                      Create your shop and add products you want to auction
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Go Live & Stream
                    </h4>
                    <p className="text-muted-foreground">
                      Start a live channel and showcase your products to
                      potential buyers
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Launch Auctions
                    </h4>
                    <p className="text-muted-foreground">
                      Promote products during your stream and start auctions to
                      create excitement
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Sell & Ship</h4>
                    <p className="text-muted-foreground">
                      Close the auction, process orders, and deliver to winning
                      bidders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Why Choose WhyNot?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              The most engaging way to buy and sell online
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="size-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Live Streaming
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                High-quality video streaming powered by Agora for smooth,
                real-time interactions between sellers and buyers
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="size-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Real-Time Chat
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                Engage with sellers and community through instant messaging
                during live auctions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gavel className="size-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Live Auctions
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                Competitive bidding system where the highest bidder wins
                exclusive products at great prices
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="size-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Seamless Shopping
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                Win your bids and complete purchases with integrated payment and
                delivery tracking
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="size-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Seller Dashboard
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                Powerful tools for sellers to manage shops, products, streams,
                and track sales performance
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="size-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center">
                Exclusive Deals
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                Access unique products and special offers only available during
                live auction events
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 md:py-28 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Video className="size-12 sm:size-14 text-primary" />
            <Gavel className="size-12 sm:size-14 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Join the Action?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto">
            Whether you're looking to discover amazing deals or reach new
            customers, WhyNot is your platform for live interactive commerce.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base" asChild>
              <Link to="/register">
                Start Shopping Live
                <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base"
              asChild
            >
              <Link to="/register">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
