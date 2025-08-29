
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, User, Menu, Heart, Mail, Home, Package } from "lucide-react";

interface NavbarProps {
  cartItems: number;
  onCartClick: () => void;
  onContactClick?: () => void;
  onFavoritesClick?: () => void;
}

const Navbar = ({ cartItems, onCartClick, onContactClick, onFavoritesClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-xl border-b border-border/20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-200">
              Step Up
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105 story-link flex items-center gap-2">
              <Home className="h-4 w-4" />
              Inicio
            </a>
            <a href="/productos" className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105 story-link flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </a>
            <button
              onClick={onContactClick}
              className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105 story-link flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contacto
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex hover:scale-110 transition-all duration-200 hover:bg-red-500/20"
              onClick={onFavoritesClick}
            >
              <Heart className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex hover:scale-110 transition-all duration-200 hover:bg-primary/20"
              onClick={() => window.location.href = '/login'}
            >
              <User className="h-5 w-5" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:scale-110 transition-all duration-200 hover:bg-primary/20"
              onClick={onCartClick}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItems > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-secondary text-secondary-foreground text-xs animate-pulse"
                >
                  {cartItems}
                </Badge>
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:scale-110 transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/"
                className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Inicio
              </a>
              <a
                href="/productos"
                className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Productos
              </a>
              <button
                onClick={onContactClick}
                className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contacto
              </button>
              <button
                onClick={onFavoritesClick}
                className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Favoritos
              </button>
              <a
                href="/login"
                className="block px-3 py-2 text-foreground hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Iniciar Sesión
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
