import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck, Clock, MapPin, DollarSign, Info, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShippingPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-3xl w-full mx-auto rounded-xl shadow-lg p-8 relative bg-background">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-white" />
          Volver
        </Button>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white flex items-center gap-2">
            <Truck className="inline-block h-8 w-8 text-primary" />
            Política de Envíos
          </h1>
          <p className="text-lg text-gray-200">
            Información importante sobre tiempos, costos y cobertura de envíos
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col items-center">
            <Truck className="h-10 w-10 text-primary mb-2" />
            <h3 className="font-semibold mb-1 text-white">Cobertura Nacional</h3>
            <p className="text-sm text-center text-gray-300">
              Realizamos envíos a todas las ciudades y municipios de Colombia.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Clock className="h-10 w-10 text-secondary mb-2" />
            <h3 className="font-semibold mb-1 text-white">Tiempos de Entrega</h3>
            <p className="text-sm text-center text-gray-300">
              Entregas entre 3 y 7 días hábiles, dependiendo de la ubicación.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <MapPin className="h-10 w-10 text-pink-500 mb-2" />
            <h3 className="font-semibold mb-1 text-white">Seguimiento</h3>
            <p className="text-sm text-center text-gray-300">
              Recibe tu número de guía y rastrea tu pedido en tiempo real.
            </p>
          </div>
        </div>
        <div className="prose prose-lg prose-invert mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
            <DollarSign className="inline-block h-6 w-6 text-primary" />
            Costos de Envío
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-white">
            <li>Envío gratis en compras superiores a $100,000 COP</li>
            <li>Costo de envío estándar: $15,000 COP para compras menores</li>
            <li>El costo se muestra antes de finalizar tu compra</li>
          </ul>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white flex items-center gap-2">
            <Info className="inline-block h-6 w-6 text-secondary" />
            Condiciones
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-white">
            <li>La dirección de entrega debe ser válida y completa</li>
            <li>No realizamos envíos internacionales</li>
            <li>En caso de retrasos, te notificaremos por email</li>
            <li>Si el paquete llega dañado, repórtalo en menos de 24 horas</li>
          </ul>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white flex items-center gap-2">
            <Mail className="inline-block h-6 w-6 text-pink-500" />
            Contacto para Envíos
          </h2>
          <p className="text-white">
            Para dudas sobre tu pedido, escríbenos a <strong>envios@stepupstore.com</strong> o llama al <strong>+57 300 123 4567</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;