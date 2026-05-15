import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesBento from "@/components/landing/FeaturesBento";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import BottomCTA from "@/components/landing/BottomCTA";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/50 dark:selection:text-blue-100 bg-white dark:bg-[#050505] transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesBento />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
