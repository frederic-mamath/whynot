import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
                {t("landing.hero.title1")}
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t("landing.hero.title2")}
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
                {t("landing.hero.description")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Button size="lg" className="w-full sm:w-auto text-base" asChild>
                <Link to="/register">
                  {t("landing.hero.ctaStart")}
                  <ArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base"
                asChild
              >
                <Link to="/login">{t("landing.hero.ctaSignIn")}</Link>
              </Button>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="size-4" />
                <span>{t("landing.hero.badgeLive")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gavel className="size-4" />
                <span>{t("landing.hero.badgeBidding")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" />
                <span>{t("landing.hero.badgeDeals")}</span>
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
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-16">
            {/* For Buyers */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="size-6 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">
                  {t("landing.howItWorks.buyers.title")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.buyers.step1Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.buyers.step1Desc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.buyers.step2Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.buyers.step2Desc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.buyers.step3Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.buyers.step3Desc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.buyers.step4Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.buyers.step4Desc")}
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
                <h3 className="text-2xl sm:text-3xl font-bold">
                  {t("landing.howItWorks.sellers.title")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.sellers.step1Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.sellers.step1Desc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.sellers.step2Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.sellers.step2Desc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.sellers.step3Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.sellers.step3Desc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      {t("landing.howItWorks.sellers.step4Title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.howItWorks.sellers.step4Desc")}
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
              {t("landing.features.title")}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
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
                {t("landing.features.liveStreaming.title")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                {t("landing.features.liveStreaming.desc")}
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
                {t("landing.features.chat.title")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                {t("landing.features.chat.desc")}
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
                {t("landing.features.auctions.title")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                {t("landing.features.auctions.desc")}
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
                {t("landing.features.shopping.title")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                {t("landing.features.shopping.desc")}
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
                {t("landing.features.dashboard.title")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                {t("landing.features.dashboard.desc")}
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
                {t("landing.features.deals.title")}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                {t("landing.features.deals.desc")}
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
            {t("landing.cta.title")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto">
            {t("landing.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base" asChild>
              <Link to="/register">
                {t("landing.cta.startShopping")}
                <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base"
              asChild
            >
              <Link to="/register">{t("landing.cta.becomeSeller")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
