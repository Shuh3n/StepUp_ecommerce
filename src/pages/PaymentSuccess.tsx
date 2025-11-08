import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateOrderStatus } from '@/utils/orderUtils';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Package, 
  Clock, 
  MapPin, 
  CreditCard,
  ArrowRight,
  Home,
  Receipt
} from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  // Obtener parámetros de la URL
  const orderId = searchParams.get('order_id');
  const paypalOrderId = searchParams.get('paypal_order_id');
  const paypalPayerId = searchParams.get('PayerID');
  const paypalToken = searchParams.get('token');

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (!orderId) {
        setUpdateError('No se encontró el ID de la orden');
        setIsLoading(false);
        return;
      }

      try {
        const result = await updateOrderStatus(
          orderId,
          "Confirmado",
          "Pagado",
          {
            orderId: paypalOrderId,
            payerId: paypalPayerId,
            transactionId: paypalToken
          }
        );

        if (result.success) {
          setOrderData(result.order);
          toast({
            title: "✅ Pago exitoso",
            description: "Tu pedido ha sido confirmado y será procesado pronto.",
            variant: "default"
          });
        } else {
          setUpdateError(result.error);
          toast({
            title: "⚠️ Advertencia",
            description: "El pago fue exitoso pero hubo un problema al actualizar el estado del pedido.",
            variant: "destructive"
          });
        }
      } catch (error) {
        setUpdateError(error.message);
        toast({
          title: "❌ Error",
          description: "Hubo un problema al procesar el pago exitoso.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    processPaymentSuccess();
  }, [orderId, paypalOrderId, paypalPayerId, paypalToken, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-white">Procesando pago exitoso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header de éxito */}
        <Card className="bg-white/10 border-white/20 text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl text-white mb-2">
              ¡Pago Exitoso!
            </CardTitle>
            <p className="text-white/70 text-lg">
              Tu pedido ha sido confirmado y será procesado pronto
            </p>
          </CardHeader>
        </Card>

        {/* Detalles de la orden */}
        {orderData && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Detalles del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/70 text-sm">Número de Orden</p>
                  <p className="text-white font-mono text-sm">{orderData.id}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total Pagado</p>
                  <p className="text-white font-bold text-lg">
                    ${Number(orderData.total).toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Estado</p>
                  <Badge variant="default" className="bg-green-500">
                    {orderData.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Método de Pago</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-white" />
                    <span className="text-white">{orderData.payment_method}</span>
                  </div>
                </div>
              </div>

              {/* Información de envío */}
              {orderData.address && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección de Envío
                  </h4>
                  <p className="text-white/70 text-sm">{orderData.address}</p>
                </div>
              )}

              {/* Timeline de procesamiento */}
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  ¿Qué sigue?
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Pago confirmado</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <Package className="h-4 w-4" />
                    <span>Preparando tu pedido (1-2 días hábiles)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Package className="h-4 w-4" />
                    <span>En camino (2-5 días hábiles)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error si hubo problemas */}
        {updateError && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <p className="text-red-200 text-sm">
                <strong>Nota:</strong> Tu pago fue exitoso, pero hubo un problema técnico: {updateError}
              </p>
              <p className="text-red-200/70 text-xs mt-2">
                Por favor contacta a soporte si tienes dudas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Botones de acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/profile?tab=orders')}
            variant="hero"
            className="w-full"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Ver Mis Pedidos
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full text-white border-white/30"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al Inicio
          </Button>
        </div>

        {/* Información adicional */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-white/70 text-sm">
              Recibirás un email de confirmación con los detalles de tu pedido
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;