import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Home, DollarSign, Filter, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-property.jpg";
import kenyaHeroImage from "@/assets/images/kenya-real-estate-hero.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from '@/hooks/use-media-query';
import type { Property } from '@/types/property';

// Types
interface InputBlockProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  isActive?: boolean;
}

// Reusable input block for search form
const InputBlock = ({ icon: Icon, label, children, isActive = false }: InputBlockProps) => (
  <motion.div 
    className={`
      flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 
      bg-white/10 backdrop-blur-sm rounded-xl w-full border-2 transition-all duration-300
      hover:bg-white/15 hover:border-accent/50 hover:shadow-lg
      ${isActive ? 'border-accent bg-white/15 shadow-lg' : 'border-transparent'}
      dark:bg-gray-900/20 dark:hover:bg-gray-900/30
    `}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-accent/10 rounded-lg">
        <Icon className="h-5 w-5 text-accent flex-shrink-0" />
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider block mb-1">
          {label}
        </label>
        <div className="text-foreground font-medium">
          {children}
        </div>
      </div>
    </div>
  </motion.div>
);

const Hero = () => {
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [totalProperties, setTotalProperties] = useState(0);
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  // Fallback images
  const fallbackImages = [heroImage, kenyaHeroImage];
  
  // Get current background image with fallbacks
  const getCurrentBackgroundImage = () => {
    if (properties.length > 0 && !imageError) {
      const property = properties[currentImageIndex % properties.length];
      return property?.images?.[0] || property?.image_url || fallbackImages[0];
    }
    return fallbackImages[currentImageIndex % fallbackImages.length];
  };

  // Fetch properties for hero background rotation and stats
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-properties`);
        if (response.ok) {
          const data = await response.json();
          const props = Array.isArray(data) ? data : data?.properties || [];
          
          // Set total count for stats
          setTotalProperties(props.length);
          
          // Filter to only properties with images for background rotation
          const propertiesWithImages = props.filter(p => p.images?.length > 0 || p.image_url);
          if (propertiesWithImages.length > 0) {
            setProperties(propertiesWithImages);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch properties for hero:', error);
        // Continue with fallback images
      }
    };

    fetchHeroData();
  }, []);

  // Rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => prev + 1);
      setImageError(false); // Reset error state for new image
    }, 8000); // Change image every 8 seconds

    return () => clearInterval(interval);
  }, [properties.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic
  };

  const scrollToSearch = () => {
    document.getElementById("search-section")?.scrollIntoView({ 
      behavior: "smooth",
      block: "center"
    });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-20 md:pt-32 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={getCurrentBackgroundImage()}
            alt="Luxury real estate property in Kenya"
            className="w-full h-full object-cover object-center scale-110"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            loading="eager"
            fetchPriority="high"
            onError={() => setImageError(true)}
          />
        </AnimatePresence>
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-navy/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-50" />
        
        {/* Animated Background Elements */}
        <motion.div 
          className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Property Info Overlay */}
      {properties.length > 0 && (
        <motion.div 
          className="absolute bottom-6 left-6 z-20 hidden md:flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20 max-w-xs"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          key={currentImageIndex}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground/90">
              {properties[currentImageIndex % properties.length]?.location || 'Featured Property'}
            </span>
          </div>
          <div className="text-xs text-primary-foreground/70">
            {properties[currentImageIndex % properties.length]?.title || 'Premium Real Estate'}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {properties.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === (currentImageIndex % properties.length)
                    ? 'bg-accent scale-125'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Floating Trust Badges */}
      {totalProperties >= 300 && (
        <div className="absolute top-6 right-6 z-20 hidden md:flex flex-col gap-2">
          <motion.div 
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ShieldCheck className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-primary-foreground/90">
              {totalProperties >= 1000 ? `${Math.floor(totalProperties / 100) * 100}+` : totalProperties.toLocaleString()} Verified Properties
            </span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-primary-foreground/90">
              98% Client Satisfaction
            </span>
          </motion.div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 xl:px-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span 
              className="inline-flex items-center gap-2 text-accent font-semibold text-sm tracking-widest uppercase mb-4 px-4 py-2 bg-accent/10 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Welcome to Julin Real Estate
            </motion.span>

            <motion.h1 
              className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Discover Your
              <span className="block bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent mt-2">
                Perfect Property
              </span>
            </motion.h1>

            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Kenya's premier property marketplace with{" "}
              <span className="font-semibold text-accent">admin-verified listings</span> 
              {" "}for secure and transparent real estate transactions.
            </motion.p>

            {/* Quick Stats */}
            {totalProperties >= 300 && (
              <motion.div 
                className="flex flex-wrap justify-center lg:justify-start gap-6 mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-accent">
                    {totalProperties >= 1000 ? `${Math.floor(totalProperties / 100) * 100}+` : totalProperties.toLocaleString()}
                  </div>
                  <div className="text-sm text-primary-foreground/70">Properties Listed</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-accent">98%</div>
                  <div className="text-sm text-primary-foreground/70">Client Satisfaction</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-accent">24/7</div>
                  <div className="text-sm text-primary-foreground/70">Support Available</div>
                </div>
              </motion.div>
            )}

            {/* Call to Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/properties" className="flex-1 sm:flex-initial">
                <Button 
                  variant="hero" 
                  size={isMobile ? "lg" : "xl"} 
                  className="w-full sm:w-auto group"
                >
                  <Search className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Browse Properties
                  <ArrowRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </Link>

              <Button 
                variant="heroOutline" 
                size={isMobile ? "lg" : "xl"} 
                className="group"
                onClick={scrollToSearch}
              >
                <Filter className="h-5 w-5 mr-2" />
                Advanced Search
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Search Form */}
          <motion.div 
            id="search-section"
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl border border-white/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ y: -5 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                Find Your Dream Property
              </h2>
              <p className="text-primary-foreground/70">
                Search through our verified listings with advanced filters
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-4">
                <InputBlock icon={MapPin} label="Location" isActive={activeFilter === "location"}>
                  <input
                    type="text"
                    placeholder="Nairobi, Mombasa, Kisumu..."
                    className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1 placeholder:text-foreground/50"
                    onFocus={() => setActiveFilter("location")}
                    onBlur={() => setActiveFilter("")}
                  />
                </InputBlock>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputBlock icon={Home} label="Property Type" isActive={activeFilter === "type"}>
                    <select 
                      className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1"
                      onFocus={() => setActiveFilter("type")}
                      onBlur={() => setActiveFilter("")}
                    >
                      <option value="">Any Type</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                      <option value="villa">Villa</option>
                    </select>
                  </InputBlock>

                  <InputBlock icon={DollarSign} label="Price Range" isActive={activeFilter === "price"}>
                    <select 
                      className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1"
                      onFocus={() => setActiveFilter("price")}
                      onBlur={() => setActiveFilter("")}
                    >
                      <option value="">Any Price</option>
                      <option value="0-5">Under KES 5M</option>
                      <option value="5-10">KES 5M - 10M</option>
                      <option value="10-20">KES 10M - 20M</option>
                      <option value="20-50">KES 20M - 50M</option>
                      <option value="50+">Above KES 50M</option>
                    </select>
                  </InputBlock>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>

              {/* Advanced Filters (Collapsible) */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputBlock icon={Home} label="Bedrooms">
                        <select className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1">
                          <option>Any</option>
                          <option>1+</option>
                          <option>2+</option>
                          <option>3+</option>
                          <option>4+</option>
                          <option>5+</option>
                        </select>
                      </InputBlock>
                      <InputBlock icon={Home} label="Bathrooms">
                        <select className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1">
                          <option>Any</option>
                          <option>1+</option>
                          <option>2+</option>
                          <option>3+</option>
                          <option>4+</option>
                        </select>
                      </InputBlock>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputBlock icon={Home} label="Square Feet">
                        <input 
                          type="text" 
                          placeholder="Min sq ft" 
                          className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1 placeholder:text-foreground/50"
                        />
                      </InputBlock>
                      <InputBlock icon={Home} label="Year Built">
                        <input 
                          type="text" 
                          placeholder="After year" 
                          className="bg-transparent text-foreground font-medium focus:outline-none w-full py-1 placeholder:text-foreground/50"
                        />
                      </InputBlock>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  variant="default" 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-accent to-blue-600 hover:from-accent/90 hover:to-blue-600/90"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search Properties
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Button>
              </motion.div>

              {/* Quick Search Tags */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-primary-foreground/70 mb-3">Popular Searches:</p>
                <div className="flex flex-wrap gap-2">
                  {['Nairobi Apartments', 'Mombasa Beach House', 'Kisumu Land', 'Nakuru Commercial'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="px-3 py-1.5 text-sm bg-white/5 hover:bg-accent/20 rounded-full border border-white/10 hover:border-accent/30 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-center">
            <div className="text-xs text-primary-foreground/60 mb-2">Scroll to explore</div>
            <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-primary-foreground/50 rounded-full mt-2" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;