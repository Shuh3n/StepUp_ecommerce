import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-white" />
          Volver
        </Button>

        <div className="max-w-4xl mx-auto prose prose-lg prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
            <Lock className="inline-block h-8 w-8 text-primary" />
            Política de Privacidad
          </h1>
          
          <p className="text-lg mb-8 text-gray-200">
            Última actualización: Octubre 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <User className="inline-block h-6 w-6 text-secondary" />
              1. Información que Recopilamos
            </h2>
            <p className="mb-4 text-white">
              En StepUp Store recopilamos la siguiente información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li><strong>Información Personal:</strong> Nombre, email, teléfono, dirección de envío</li>
              <li><strong>Información de Pago:</strong> Datos procesados de forma segura por PayPal</li>
              <li><strong>Información de Navegación:</strong> Cookies, historial de compras, preferencias</li>
              <li><strong>Información del Dispositivo:</strong> IP, tipo de navegador, sistema operativo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <Lock className="inline-block h-6 w-6 text-primary" />
              2. Uso de la Información
            </h2>
            <p className="mb-4 text-white">Utilizamos tu información para:</p>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Procesar y entregar tus pedidos</li>
              <li>Comunicarnos contigo sobre tu cuenta y pedidos</li>
              <li>Mejorar nuestros productos y servicios</li>
              <li>Personalizar tu experiencia de compra</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <Mail className="inline-block h-6 w-6 text-pink-500" />
              3. Contacto
            </h2>
            <p className="mb-4 text-white">
              Para consultas sobre privacidad, contáctanos en:
            </p>
            <p className="text-white">Email: privacy@stepupstore.com</p>
            <p className="text-white">Teléfono: +57 300 123 4567</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;