import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShoppingCart, UserCheck, CreditCard, Truck, RefreshCcw, ShieldCheck, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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

        <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
            <FileText className="inline-block h-8 w-8 text-primary" />
            Términos de Servicio
          </h1>
          
          <p className="text-lg text-gray-200 mb-8">
            Última actualización: Octubre 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <ShieldCheck className="inline-block h-6 w-6 text-secondary" />
              1. Aceptación de Términos
            </h2>
            <p className="mb-4 text-white">
              Al acceder y usar StepUp Store, aceptas estos términos de servicio. 
              Si no estás de acuerdo, no uses nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <ShoppingCart className="inline-block h-6 w-6 text-primary" />
              2. Descripción del Servicio
            </h2>
            <p className="mb-4 text-white">
              StepUp Store es una plataforma de comercio electrónico que ofrece:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Venta de productos de calidad</li>
              <li>Sistema de carrito de compras</li>
              <li>Procesamiento seguro de pagos</li>
              <li>Servicio de entrega a domicilio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <UserCheck className="inline-block h-6 w-6 text-pink-500" />
              3. Registro de Cuenta
            </h2>
            <p className="mb-4 text-white">Para realizar compras debes:</p>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de tu contraseña</li>
              <li>Ser responsable de todas las actividades en tu cuenta</li>
              <li>Notificar inmediatamente cualquier uso no autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <CreditCard className="inline-block h-6 w-6 text-primary" />
              4. Precios y Pagos
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Todos los precios están en pesos colombianos (COP)</li>
              <li>Los precios pueden cambiar sin previo aviso</li>
              <li>Aceptamos pagos a través de PayPal</li>
              <li>Envío gratis en compras superiores a $100,000 COP</li>
              <li>Costo de envío: $15,000 COP para compras menores</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <Truck className="inline-block h-6 w-6 text-secondary" />
              5. Envíos y Entregas
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Tiempo de entrega: 3-7 días hábiles</li>
              <li>Realizamos envíos a nivel nacional en Colombia</li>
              <li>El riesgo de pérdida pasa al comprador al momento de la entrega</li>
              <li>Debes proporcionar una dirección de entrega correcta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <RefreshCcw className="inline-block h-6 w-6 text-primary" />
              6. Devoluciones y Reembolsos
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Aceptamos devoluciones dentro de 30 días</li>
              <li>Los productos deben estar en condiciones originales</li>
              <li>El comprador asume el costo de envío de devolución</li>
              <li>Reembolsos procesados en 5-10 días hábiles</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <ShieldCheck className="inline-block h-6 w-6 text-secondary" />
              7. Uso Prohibido
            </h2>
            <p className="mb-4 text-white">No puedes usar nuestros servicios para:</p>
            <ul className="list-disc pl-6 space-y-2 text-white">
              <li>Actividades ilegales o fraudulentas</li>
              <li>Violar derechos de propiedad intelectual</li>
              <li>Transmitir virus o código malicioso</li>
              <li>Interferir con el funcionamiento del sitio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <ShieldCheck className="inline-block h-6 w-6 text-primary" />
              8. Limitación de Responsabilidad
            </h2>
            <p className="mb-4 text-white">
              StepUp Store no será responsable por daños indirectos, 
              incidentales o consecuentes que surjan del uso de nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              <Mail className="inline-block h-6 w-6 text-pink-500" />
              9. Contacto
            </h2>
            <p className="mb-4 text-white">
              Para consultas sobre estos términos:
            </p>
            <p className="text-white">Email: legal@stepupstore.com</p>
            <p className="text-white">Teléfono: +57 300 123 4567</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;