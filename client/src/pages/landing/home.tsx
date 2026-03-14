import Header from "@/components/marketing/Header";
import HeroSection from "@/components/marketing/HeroSection";
import InteractiveDemo from "@/components/marketing/InteractiveDemo";
import FeaturesGrid from "@/components/marketing/FeaturesGrid";
import FreeTrialSection from "@/components/marketing/FreeTrialSection";
import PricingSection from "@/components/marketing/PricingSection";
import FAQSection from "@/components/marketing/FAQSection";
import CTAFooter from "@/components/marketing/CTAFooter";

const LandingPage = () => {
    return (
        // AGREGAMOS "marketing-theme" AQUÍ 👇
        <div className="marketing-theme min-h-screen bg-background font-sans selection:bg-primary/20 text-foreground">
            <Header />

            <main>
                <HeroSection />
                <InteractiveDemo />
                <FeaturesGrid />
                <FreeTrialSection />
                <PricingSection />
                <FAQSection />
                <CTAFooter />
            </main>
        </div>
    );
};

export default LandingPage;