import { Button } from "@/components/ui/button";
import { Search, MapPin, Home, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-property.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-32">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Luxury property"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <span className="inline-block text-accent font-semibold text-sm uppercase tracking-widest mb-4 animate-fade-in">
            Welcome to Julin Real Estate
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Find Your Perfect
            <span className="block text-accent">Dream Property</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Connecting buyers and sellers of real estate properties with a well-organized system that makes your property journey seamless.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/properties">
              <Button variant="hero" size="xl">
                <Search className="h-5 w-5" />
                Browse Properties
              </Button>
            </Link>
            <Button variant="heroOutline" size="xl" asChild>
              <a href="#contact">List Your Property</a>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-16 bg-card/95 backdrop-blur-md rounded-2xl p-6 shadow-xl max-w-4xl animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                  <input
                    type="text"
                    placeholder="Enter location"
                    className="bg-transparent text-foreground font-medium focus:outline-none w-full"
                  />
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <Home className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Property Type</p>
                <select className="bg-transparent text-foreground font-medium focus:outline-none w-full">
                  <option>Any</option>
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Land</option>
                  <option>Commercial</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Price Range</p>
                <select className="bg-transparent text-foreground font-medium focus:outline-none w-full">
                  <option>Any</option>
                  <option>Under KES 5M</option>
                  <option>KES 5M - 10M</option>
                  <option>KES 10M - 20M</option>
                  <option>Above KES 20M</option>
                </select>
              </div>
            </div>
            <Button variant="default" size="lg" className="h-full">
              <Search className="h-5 w-5" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
