import { Target, Eye, CheckCircle, Shield, Home, Users, MapPin, Star, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    { 
      title: "Verified property listings in Kenya", 
      icon: Shield,
      description: "Every property undergoes rigorous verification for authenticity and legal compliance."
    },
    { 
      title: "Direct buyer-seller connections", 
      icon: Users,
      description: "We eliminate intermediaries for faster, more transparent transactions."
    },
    { 
      title: "Professional property photography", 
      icon: Award,
      description: "High-quality visuals that showcase properties in their best light."
    },
    { 
      title: "Transparent pricing with market rates", 
      icon: CheckCircle,
      description: "Real-time market analysis ensures fair and competitive pricing."
    },
    { 
      title: "Local market expertise", 
      icon: MapPin,
      description: "Deep understanding of Kenya's 47 counties and property markets."
    },
    { 
      title: "Secure transaction support", 
      icon: Shield,
      description: "Bank-grade security for all your real estate transactions."
    },
    { 
      title: "Legal documentation assistance", 
      icon: Star,
      description: "Expert guidance through Kenya's property registration process."
    },
    { 
      title: "Property valuation services", 
      icon: Home,
      description: "Accurate valuation using latest market data and trends."
    },
  ];

  // Kenyan real estate statistics
  const stats = [
    { value: "500+", label: "Properties Listed", icon: Home },
    { value: "10+", label: "Years Experience", icon: Award },
    { value: "47", label: "Counties Covered", icon: MapPin },
    { value: "98%", label: "Client Satisfaction", icon: Star },
  ];

  const marketSpecialties = [
    "Residential Properties",
    "Commercial Spaces",
    "Land & Plots",
    "Rental Properties",
    "Property Management",
    "Luxury Estates",
    "Beachfront Properties",
    "Agricultural Land"
  ];

  // Team members data
  const teamMembers = [
    { name: "Julius Mwangi", role: "Founder & CEO", experience: "15+ years in real estate" },
    { name: "Linda Kamau", role: "Head of Sales", experience: "Expert in Nairobi market" },
    { name: "David Ochieng", role: "Legal Consultant", experience: "Property law specialist" },
    { name: "Sarah Achieng", role: "Customer Relations", experience: "10+ years client service" },
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-background to-gray-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm uppercase tracking-wider mb-6">
            <Award className="h-4 w-4" />
            Trusted Since 2013
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your Trusted Partner in 
            <span className="text-primary"> Kenyan Real Estate</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Transforming property transactions across Kenya with transparency, expertise, and 
            commitment to excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Content Column */}
          <div className="space-y-12">
            {/* Introduction */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-3 h-12 bg-primary rounded-full"></div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    About Julin Real Estate
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Pioneering excellence in Kenya's property market since 2013
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  At Julin Real Estate, we've redefined property transactions in Kenya by combining 
                  deep local market knowledge with innovative technology. Our journey began with a 
                  simple mission: to make property buying, selling, and renting accessible, transparent, 
                  and stress-free for every Kenyan.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  From the bustling streets of Nairobi to the serene landscapes of the Rift Valley, 
                  we've helped thousands of clients find their perfect properties while navigating 
                  Kenya's unique real estate landscape with confidence.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="space-y-8">
              <h3 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="w-8 h-1 bg-primary"></div>
                Our Core Values
              </h3>
              
              <div className="grid gap-6">
                <div className="group p-6 bg-card rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Eye className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                        Transparency & Honesty
                      </h4>
                      <p className="text-muted-foreground">
                        We believe in complete transparency in all transactions. No hidden costs, 
                        no surprises – just honest advice and clear communication.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group p-6 bg-card rounded-2xl border border-gray-100 hover:border-accent/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Target className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                        Client-Centric Approach
                      </h4>
                      <p className="text-muted-foreground">
                        Your goals are our priorities. We tailor our services to meet your specific 
                        needs, ensuring a personalized experience from start to finish.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group p-6 bg-card rounded-2xl border border-gray-100 hover:border-green-500/20 hover:shadow-lg transition-all duration-300">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Shield className="h-7 w-7 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl font-semibold text-foreground mb-2">
                        Integrity & Security
                      </h4>
                      <p className="text-muted-foreground">
                        We adhere to the highest ethical standards and Kenyan laws, ensuring every 
                        transaction is secure and legally sound.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index} 
                    className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link to="/contact">
                <Button size="lg" className="group h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="flex items-center gap-3">
                    Start Your Property Journey
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Features Grid */}
            <div className="bg-card rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Why Choose Julin Real Estate?
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Experience the difference with our comprehensive services
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="group p-5 bg-gradient-to-b from-white to-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Image Section with Dynamic Online Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              {/* Dynamic Image Container */}
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700">
                {/* Background Image Placeholder - Replace with your image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-50"></div>
                
                {/* Dynamic Image URL - Replace with your chosen image */}
                <img 
                  src="https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                  alt="Modern Kenyan luxury property with panoramic views"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <div className="max-w-md">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-4">
                      <MapPin className="h-4 w-4" />
                      Featured Property • Nairobi
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Experience Luxury Living in Kenya
                    </h3>
                    <p className="text-white/90 mb-6">
                      Discover premium properties that combine modern design with authentic Kenyan elegance.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-white/20 rounded-tl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-white/20 rounded-br-3xl"></div>
              
              {/* CTA Button */}
              <div className="absolute bottom-8 left-8 right-8">
                <Link to="/properties">
                  <Button className="w-full h-14 bg-white text-foreground hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl">
                    <span className="flex items-center justify-center gap-3 font-semibold">
                      <MapPin className="h-5 w-5" />
                      Explore Premium Properties
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Team Preview */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
              <h4 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                Meet Our Expert Team
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {teamMembers.slice(0, 2).map((member, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium text-foreground">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                ))}
              </div>
              <Link to="/team" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1">
                View all team members <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Market Specialties Section */}
        <div className="mt-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-display text-3xl font-bold text-foreground mb-4">
                Specialized in Every Corner of Kenya
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From prime urban locations to emerging markets, we provide comprehensive real estate 
                solutions tailored to Kenya's diverse landscape.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {marketSpecialties.map((specialty, index) => (
                <div 
                  key={index}
                  className="group p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{specialty}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-6">
              <p className="text-muted-foreground text-sm">
                Serving clients in <span className="font-semibold text-primary">Nairobi</span>,{" "}
                <span className="font-semibold text-primary">Mombasa</span>,{" "}
                <span className="font-semibold text-primary">Kisumu</span>,{" "}
                <span className="font-semibold text-primary">Nakuru</span>, and all 47 counties
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-4">
            Trusted By
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            <div className="text-xl font-bold text-foreground">KENHA</div>
            <div className="text-xl font-bold text-foreground">NLC</div>
            <div className="text-xl font-bold text-foreground">PPOA</div>
            <div className="text-xl font-bold text-foreground">KNBS</div>
            <div className="text-xl font-bold text-foreground">500+ Clients</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;