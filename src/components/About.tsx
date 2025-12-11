import { Target, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  const features = [
    "Verified property listings",
    "Direct buyer-seller connections",
    "Professional property photography",
    "Transparent pricing",
    "Expert market guidance",
    "Secure transactions",
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              About Us
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Your Trusted Real Estate Partner
            </h2>
            <p className="text-muted-foreground mb-8">
              At Julin Real Estate, we believe in making property transactions simple, transparent, and accessible. Whether you are buying your dream home or selling a valuable asset, our organized system ensures a seamless experience.
            </p>

            {/* Vision & Mission */}
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Our Vision
                  </h3>
                  <p className="text-muted-foreground">
                    To connect buyers and sellers of real estate properties seamlessly and efficiently.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Our Mission
                  </h3>
                  <p className="text-muted-foreground">
                    To ease the process of buying and selling real estate properties through a well-organized system.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <a href="#contact">
                <Button variant="heroOutline">Contact Us</Button>
              </a>
            </div>
          </div>

          {/* Features Grid */}
          <div className="bg-card rounded-2xl p-8 shadow-lg">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Why Choose Julin Real Estate?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
