import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Clock, CreditCard, Ban, DollarSign, RefreshCcw, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReturnPolicy = () => {
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

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
            <RefreshCcw className="inline-block h-8 w-8 text-primary" />
            Política de Devoluciones
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 border rounded-lg">
              <Clock className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="font-semibold mb-2 text-white">30 Días</h3>
              <p className="text-sm text-muted-foreground">Para solicitar devolución</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <Package className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="font-semibold mb-2 text-white">Estado Original</h3>
              <p className="text-sm text-muted-foreground">Sin usar, con etiquetas</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="font-semibold mb-2 text-white">Reembolso</h3>
              <p className="text-sm text-muted-foreground">En 5-10 días hábiles</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <Package className="inline-block h-6 w-6 text-primary" />
                Condiciones para Devoluciones
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-white">
                <li>El producto debe estar en su empaque original</li>
                <li>Sin signos de uso o daño</li>
                <li>Con todas las etiquetas originales</li>
                <li>Incluir todos los accesorios</li>
                <li>Factura de compra</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <RefreshCcw className="inline-block h-6 w-6 text-secondary" />
                Proceso de Devolución
              </h2>
              <ol className="list-decimal pl-6 space-y-3 text-white">
                <li>Contacta nuestro servicio al cliente: <strong>soporte@stepupstore.com</strong></li>
                <li>Proporciona número de pedido y motivo de devolución</li>
                <li>Recibe autorización de devolución (RMA)</li>
                <li>Empaca el producto de forma segura</li>
                <li>Envía a la dirección que te proporcionaremos</li>
                <li>Recibirás el reembolso una vez inspeccionado el producto</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <Ban className="inline-block h-6 w-6 text-pink-500" />
                Productos No Retornables
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-white">
                <li>Productos personalizados o bajo pedido</li>
                <li>Artículos en liquidación o descuento especial</li>
                <li>Productos dañados por mal uso</li>
                <li>Artículos sin empaque original</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <DollarSign className="inline-block h-6 w-6 text-primary" />
                Costos de Envío
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-white">
                <li>El cliente asume el costo de envío de devolución</li>
                <li>Recomendamos usar servicio con seguimiento</li>
                <li>StepUp Store no se hace responsable por productos perdidos en tránsito</li>
                <li>En caso de producto defectuoso, asumimos el costo de envío</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <RefreshCcw className="inline-block h-6 w-6 text-secondary" />
                Intercambios
              </h2>
              <p className="mb-4 text-white">
                Ofrecemos intercambios por talla o
                El proceso es similar a las devoluciones, pero notifica que deseas un intercambio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
                <Mail className="inline-block h-6 w-6 text-pink-500" />
                Contacto
              </h2>
              <p className="text-white">Email: <strong>soporte@stepupstore.com</strong></p>
              <p className="text-white">Teléfono: <strong>+57 300 123 4567</strong></p>
              <p className="text-white">Horario: Lunes a Viernes, 8:00 AM - 6:00 PM</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;