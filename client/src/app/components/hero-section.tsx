import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { Shield, CheckCircle, Lock, Zap, Search, Settings, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse animate-float" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in hover-glow border border-primary/20">
            <Shield className="h-4 w-4" />
            <span>Blockchain-Powered Certificate Verification</span>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-in-left">
            <span className="gradient-text">Secure Digital</span>
            <br />
            <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Certificates
            </span>
          </h1>

          <p
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-in-right"
            style={{ animationDelay: "0.2s" }}
          >
            Revolutionize credential verification with blockchain technology. Issue, verify, and manage certificates
            with unparalleled security and transparency.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href="/verify">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift hover-glow group"
              >
                <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Verify Certificate
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 hover:bg-primary/5 transition-all duration-300 bg-transparent hover-lift group"
              >
                <Settings className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Admin Portal
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group hover-lift animate-scale-in"
              style={{ animationDelay: "0.6s" }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Verification</h3>
                <p className="text-muted-foreground">
                  Verify any certificate in seconds using our blockchain-powered system
                </p>
              </CardContent>
            </Card>

            <Card
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group hover-lift animate-scale-in"
              style={{ animationDelay: "0.8s" }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tamper-Proof</h3>
                <p className="text-muted-foreground">
                  Blockchain technology ensures certificates cannot be forged or altered
                </p>
              </CardContent>
            </Card>

            <Card
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group hover-lift animate-scale-in"
              style={{ animationDelay: "1s" }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Advanced blockchain infrastructure for rapid certificate processing
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
