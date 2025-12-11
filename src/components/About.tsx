import { Target, Eye, CheckCircle, Shield, Home, Users, MapPin, Star, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    { title: "Verified property listings in Kenya", icon: Shield, description: "Every property undergoes rigorous verification for authenticity and legal compliance." },
    { title: "Professional property photography", icon: Award, description: "High-quality visuals that showcase properties in their best light." },
    { title: "Transparent pricing with market rates", icon: CheckCircle, description: "Real-time market analysis ensures fair and competitive pricing." },
    { title: "Local market expertise", icon: MapPin, description: "Deep understanding of Kenya's 47 counties and property markets." },
    { title: "Secure transaction support", icon: Shield, description: "Bank-grade security for all your real estate transactions." },
    { title: "Legal documentation assistance", icon: Star, description: "Expert guidance through Kenya's property registration process." },
    { title: "Property valuation services", icon: Home, description: "Accurate valuation using latest market data and trends." }
  ];

  const stats = [
    { label: "Happy Clients", value: "1,200+", icon: Users },
    { label: "Properties Verified", value: "850+", icon: CheckCircle },
    { label: "Counties Served", value: "47", icon: MapPin },
    { label: "Years of Trust", value: "3+", icon: Award }
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

  return (
    <section
      id="about"
      className="py-20 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80')" }}
    >
      <div className="backdrop-blur-sm bg-white/70 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm uppercase tracking-wider mb-6">
              <Award className="h-4 w-4" /> Trusted Since 2022
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your Trusted Partner in <span className="text-primary">Kenyan Real Estate</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Transforming property transactions across Kenya with transparency, expertise, and commitment to excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left Column */}
            <div className="space-y-12">

              {/* Intro */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 bg-primary rounded-full"></div>
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">About Julin Real Estate</h2>
                    <p className="text-muted-foreground mt-2">Pioneering excellence in Kenya since 2022</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  At Julin Real Estate, we’ve redefined property transactions in Kenya by combining local market expertise with modern technology.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  From Nairobi’s urban spaces to serene countryside locations, thousands trust us to guide them through Kenya’s property market.
                </p>
              </div>

              {/* Core Values */}
              <div className="space-y-8">
                <h3 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-8 h-1 bg-primary"></div> Our Core Values
                </h3>

                <div className="grid gap-6">

                  {/* Transparency */}
                  <div className="group p-6 bg-card rounded-2xl border border-gray-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex gap-4 items-start">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Eye className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display text-xl font-semibold mb-2">Transparency & Honesty</h4>
                        <p className="text-muted-foreground">Clear communication, no hidden costs — full trust from start to finish.</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Approach */}
                  <div className="group p-6 bg-card rounded-2xl border border-gray-200 hover:border-accent/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex gap-4 items-start">
                      <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <Target className="h-7 w-7 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-display text-xl font-semibold mb-2">Client-Centric Approach</h4>
                        <p className="text-muted-foreground">Your goals shape our service. We provide tailored real‑estate guidance.</p>
                      </div>
                    </div>
                  </div>

                  {/* Integrity */}
                  <div className="group p-6 bg-card rounded-2xl border border-gray-200 hover:border-green-500/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex gap-4 items-start">
                      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <Shield className="h-7 w-7 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-display text-xl font-semibold mb-2">Integrity & Security</h4>
                        <p className="text-muted-foreground">Ethical, legally sound transactions backed by secure processes.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Trusted By Many */}
              <div className="space-y-6">
                <h3 className="font-display text-2xl font-bold text-foreground">Trusted by Many</h3>
                <div className="grid grid-cols-2 gap-4">
                  <img src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80" className="rounded-xl shadow-md object-cover" />
                  <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80" className="rounded-xl shadow-md object-cover" />
                  <img src="https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80" className="rounded-xl shadow-md object-cover" />
                  <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80" className="rounded-xl shadow-md object-cover" />
                </div>
              </div>

              {/* CTA */} 
              <Link to="/contact">
                <Button className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  Start Your Property Journey
                  <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

            </div>

            {/* Right Column */}
            <div className="space-y-10">

              {/* Features */}
              <div className="bg-card rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold">Why Choose Julin?</h3>
                    <p className="text-muted-foreground text-sm">Experience real estate done right.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((f, i) => (
                    <div key={i} className="group p-5 bg-gradient-to-b from-white to-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <f.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold group-hover:text-primary transition-colors">{f.title}</h4>
                          <p className="text-sm text-muted-foreground">{f.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Highlight */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <div className="aspect-video relative">
                  <img
                    src="https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1600&q=80"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                </div>

                <div className="absolute bottom-10 left-8">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm mb-3">
                    <MapPin className="h-4 w-4" /> Featured • Nairobi
                  </span>
                  <h3 className="text-white text-2xl font-bold mb-2">Luxury Living in Kenya</h3>
                  <p className="text-white/90 max-w-sm">Premium properties blending elegance with modern comfort.</p>
                </div>

                <div className="absolute bottom-6 left-0 w-full px-8">
                  <Link to="/properties">
                    <Button className="w-full h-14 bg-white text-foreground rounded-xl hover:bg-white/95 shadow-xl">
                      Explore Premium Properties
                    </Button>
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
