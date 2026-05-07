import Navigation from "../components/Navigation";
import Hero from "../components/Hero";
import ValueProps from "../components/ValueProps";
import FeaturedProperties from "../components/FeaturedProperties";
import RecentVideos from "../components/RecentVideos";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import SubscribeForm from "../components/SubscribeForm";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import WhatsAppChat from "../components/WhatsAppChat";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <ValueProps />
      <FeaturedProperties />
      <RecentVideos />
      <HowItWorks />
      <Testimonials />
      <SubscribeForm />
      <ContactSection />
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default Index;
