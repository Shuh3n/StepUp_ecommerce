import { Button } from "@/components/ui/button";
// Using the Step Up logo image directly

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lovable-uploads/5b6a5e66-fee1-4903-bf75-da75f3f68c68.png"
          alt="Step Up - No necesitamos permiso para pisar fuerte"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/80"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl float animate-float"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl float animate-float" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent/20 rounded-full blur-xl float animate-float" style={{ animationDelay: "2s" }}></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-black mb-6 animate-fade-in" style={{ animationDelay: '0.2s', fontWeight: '900' }}>
          <span className="gradient-text font-black tracking-tight">STEP </span>
          <span className="text-white font-black tracking-tight">UP</span>
        </h1>
        
        <p className="text-xl md:text-3xl font-bold text-white mb-8 animate-fade-in" style={{ animationDelay: '0.4s', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          Eleva tu estilo con la moda juvenil más trendy
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <a href="/productos">
            <Button 
              variant="hero" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform duration-200"
            >
              Explorar Colección
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">500+</div>
            <div className="text-muted-foreground">Productos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">10k+</div>
            <div className="text-muted-foreground">Clientes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">24/7</div>
            <div className="text-muted-foreground">Soporte</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-subtle">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce-subtle"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;