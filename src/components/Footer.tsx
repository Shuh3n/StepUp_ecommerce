import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  // Función para navegar y desplazar al inicio
  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text">Step Up</h3>
            <p className="text-gray-300 text-sm">
              Tu tienda de confianza para los mejores productos. 
              Calidad, estilo y comodidad en cada paso.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => handleNavigation('/productos')}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Productos
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/about')}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Sobre Nosotros
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => handleNavigation('/privacy-policy')}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/terms-of-service')}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Términos de Servicio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/return-policy')}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Política de Devoluciones
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/shipping-policy')}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Política de Envíos
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-300">soporte@stepupstore.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-gray-400" />
                <span className="text-gray-300">+57 300 123 4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-300">Medellín, Antioquia, Colombia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2025 StepUp Store. Todos los derechos reservados.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button 
                onClick={() => handleNavigation('/privacy-policy')}
                className="hover:text-white transition-colors"
              >
                Privacidad
              </button>
              <button 
                onClick={() => handleNavigation('/terms-of-service')}
                className="hover:text-white transition-colors"
              >
                Términos
              </button>
              <button 
                onClick={() => handleNavigation('/cookies-policy')}
                className="hover:text-white transition-colors"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;