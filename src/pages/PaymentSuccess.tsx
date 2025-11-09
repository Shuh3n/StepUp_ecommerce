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
  Receipt,
  Truck,
  Box,
  CheckCircle2,
  Star,
  AlertCircle
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
        console.log('🔄 Procesando pago exitoso para orden:', orderId);
        
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

        if (result.success && result.order) {
          console.log('✅ Estado actualizado correctamente');
          setOrderData(result.order);
          
          toast({
            title: "✅ Pago exitoso",
            description: "Tu pedido ha sido confirmado y será procesado pronto.",
            variant: "default"
          });
        } else {
          console.warn('⚠️ Pago exitoso pero error al actualizar:', result.error);
          setUpdateError(result.error);
          
          toast({
            title: "⚠️ Advertencia",
            description: "El pago fue exitoso pero hubo un problema al actualizar el estado del pedido.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('❌ Error al procesar pago exitoso:', error);
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

  const handleViewOrders = () => {
    navigate('/profile?tab=orders');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-900 to-green-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/80 border-green-500/20 backdrop-blur-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-white">Procesando pago exitoso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-900 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header de éxito con animaciones */}
        <Card className="bg-black/80 border-green-500/30 text-center backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-6">
            {/* Animación de éxito */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-green-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white animate-bounce" />
              </div>
            </div>
            
            <CardTitle className="text-3xl sm:text-4xl text-white mb-3 animate-fade-in">
              ¡Pago Exitoso! 🎉
            </CardTitle>
            <p className="text-green-200 text-lg mb-4">
              Tu pedido ha sido confirmado y será procesado pronto
            </p>
            
            {/* Ilustraciones de camión */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-400/30">
                <Box className="h-5 w-5 text-green-300" />
                <span className="text-green-200 text-sm font-medium">Pedido Procesado</span>
              </div>
              
              <ArrowRight className="h-5 w-5 text-green-400 animate-pulse" />
              
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30">
                <Truck className="h-5 w-5 text-blue-300" />
                <span className="text-blue-200 text-sm font-medium">En Camino</span>
              </div>
              
              <ArrowRight className="h-5 w-5 text-blue-400 animate-pulse" />
              
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-400/30">
                <Star className="h-5 w-5 text-yellow-300" />
                <span className="text-yellow-200 text-sm font-medium">Entregado</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Botones de acción principales - MOVIDOS AQUÍ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleViewOrders}
            variant="default"
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg text-lg font-semibold"
          >
            <Receipt className="h-6 w-6 mr-3" />
            Ver Mis Pedidos
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-14 text-white border-white/30 hover:bg-white/10 shadow-lg text-lg font-semibold"
          >
            <Home className="h-6 w-6 mr-3" />
            Ir al Inicio
          </Button>
        </div>

        {/* Detalles de la orden */}
        {orderData && (
          <Card className="bg-black/80 border-green-500/20 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="h-6 w-6 text-green-400" />
                Detalles del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información principal del pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-400/20">
                    <p className="text-green-200 text-sm mb-1">Número de Orden</p>
                    <p className="text-white font-mono text-lg font-bold">{orderData.id}</p>
                  </div>
                  
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
                    <p className="text-blue-200 text-sm mb-1">Total Pagado</p>
                    <p className="text-white font-bold text-2xl">
                      ${Number(orderData.total).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-emerald-200 text-sm">Estado del Pedido</p>
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {orderData.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-emerald-200 text-sm">Estado de Pago</p>
                      <Badge className="bg-blue-500 text-white">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {orderData.payment_status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-400/20">
                    <p className="text-purple-200 text-sm mb-1">Método de Pago</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-300" />
                      <span className="text-white font-medium">{orderData.payment_method}</span>
                    </div>
                    {orderData.paypal_transaction_id && (
                      <p className="text-purple-300 font-mono text-xs mt-2">
                        ID: {orderData.paypal_transaction_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de envío */}
              {orderData.address && (
                <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-600/30">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-400" />
                    Dirección de Envío
                  </h4>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 bg-green-500/20 rounded-lg">
                      <Truck className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-lg">{orderData.address}</p>
                      <p className="text-gray-300 text-sm mt-1">
                        📦 Tu pedido llegará en 2-5 días hábiles
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline de procesamiento mejorado */}
              <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-400/20">
                <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-400" />
                  Estado de tu Pedido
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Paso 1: Confirmado */}
                  <div className="flex flex-col items-center text-center p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h5 className="text-green-200 font-medium mb-1">Pago Confirmado</h5>
                    <p className="text-green-300 text-sm">¡Listo! Tu pago fue procesado</p>
                    <Badge className="mt-2 bg-green-600 text-white">Completado</Badge>
                  </div>

                  {/* Paso 2: Preparando */}
                  <div className="flex flex-col items-center text-center p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <h5 className="text-blue-200 font-medium mb-1">Preparando Pedido</h5>
                    <p className="text-blue-300 text-sm">1-2 días hábiles</p>
                    <Badge className="mt-2 bg-blue-600 text-white">En Proceso</Badge>
                  </div>

                  {/* Paso 3: Enviado */}
                  <div className="flex flex-col items-center text-center p-4 bg-gray-500/20 rounded-lg border border-gray-400/30">
                    <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mb-3">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <h5 className="text-gray-200 font-medium mb-1">En Camino</h5>
                    <p className="text-gray-300 text-sm">2-5 días hábiles</p>
                    <Badge className="mt-2 bg-gray-600 text-white">Pendiente</Badge>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-400/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-yellow-200 font-medium">Información de Envío</p>
                      <p className="text-yellow-300 text-sm">
                        Recibirás un código de seguimiento por email cuando tu pedido sea enviado
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error si hubo problemas */}
        {updateError && (
          <Card className="bg-red-900/30 border-red-500/30 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-red-200 font-medium mb-2">
                    Nota: Tu pago fue exitoso
                  </p>
                  <p className="text-red-300 text-sm mb-2">
                    Hubo un problema técnico: {updateError}
                  </p>
                  <p className="text-red-400 text-xs">
                    Por favor contacta a soporte si tienes dudas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Card className="bg-black/60 border-green-500/20 backdrop-blur-md">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-200 font-medium">Confirmación Enviada</span>
            </div>
            <p className="text-gray-300 text-sm">
              Recibirás un email de confirmación con todos los detalles de tu pedido
            </p>
            <p className="text-gray-400 text-xs mt-2">
              🚚 Seguimiento disponible una vez enviado el pedido
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;