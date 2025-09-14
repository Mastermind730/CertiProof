import { Navigation } from "@/app/components/navigation"
import { HeroSection } from "@/app/components/hero-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Users, Award, Building, ArrowRight, Shield, Sparkles, CheckCircle2 } from "lucide-react"
import { AnimatedCounter } from "@/app/components/animated-counter"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                <AnimatedCounter end={10000} suffix="+" />
              </div>
              <div className="text-muted-foreground">Certificates Issued</div>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-muted-foreground">Institutions</div>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                <AnimatedCounter end={50000} suffix="+" />
              </div>
              <div className="text-muted-foreground">Students</div>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>How It Works</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 gradient-text">How CertifyChain Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our blockchain-powered system ensures secure, verifiable, and tamper-proof certificates
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card
              className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover-lift animate-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span>Institution Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Educational institutions and organizations create and issue digital certificates through our secure
                  admin portal
                </p>
              </CardContent>
            </Card>

            <Card
              className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover-lift animate-scale-in"
              style={{ animationDelay: "0.4s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span>Blockchain Storage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Certificate data is cryptographically secured and stored on the blockchain, making it immutable and
                  verifiable
                </p>
              </CardContent>
            </Card>

            <Card
              className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover-lift animate-scale-in"
              style={{ animationDelay: "0.6s" }}
            >
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span>Public Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Anyone can instantly verify certificate authenticity using our public verification portal
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float" />
        <div
          className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-xl animate-float"
          style={{ animationDelay: "1s" }}
        />

        <div className="container mx-auto px-4 text-center relative">
          <div className="animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <span>Get Started Today</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 gradient-text">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of institutions and students already using CertifyChain for secure certificate management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verify">
                <Button size="lg" className="text-lg px-8 py-6 hover-lift hover-glow group">
                  Verify a Certificate
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2 hover-lift bg-background/50 backdrop-blur-sm"
                >
                  Start Issuing Certificates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="animate-slide-in-left">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold gradient-text">CertifyChain</span>
              </div>
              <p className="text-muted-foreground">
                Secure, blockchain-powered certificate verification for the digital age.
              </p>
            </div>
            <div className="animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/verify" className="hover:text-primary transition-colors hover:underline">
                    Verify Certificate
                  </Link>
                </li>
                <li>
                  <Link href="/student" className="hover:text-primary transition-colors hover:underline">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-primary transition-colors hover:underline">
                    Admin Panel
                  </Link>
                </li>
              </ul>
            </div>
            <div className="animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors hover:underline">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors hover:underline">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors hover:underline">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="animate-slide-in-left" style={{ animationDelay: "0.3s" }}>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors hover:underline">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors hover:underline">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="border-t mt-8 pt-8 text-center text-muted-foreground animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <p>&copy; 2024 CertifyChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
