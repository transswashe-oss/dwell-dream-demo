import Navigation from "../components/Navigation";
import Hero from "../components/Hero";
import FeaturedProperties from "../components/FeaturedProperties";
import SubscribeForm from "../components/SubscribeForm";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <FeaturedProperties />
      <SubscribeForm />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
