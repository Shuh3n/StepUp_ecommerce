import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../lib/supabase'; // Agregar import
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Loader,
  AlertCircle,
  Calendar,
  Route,
  Home,
  Building,
  Navigation
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrackingEvent {
  status: string;
  location: string;
  description: string;
  timestamp: string;
  estimated: boolean;
}

interface TrackingData {
  trackingNumber: string;
  orderId: string;
  status: string;
  shippingStatus?: string | null; 
  progress: number;
  estimatedDelivery?: string;
  origin: string;
  destination: string;
  events: TrackingEvent[];
}

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

// CORREGIR LA URL DE LA EDGE FUNCTION
const EDGE_TRACKING_URL = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/track-packages";

const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose, orderId }) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrackingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      
      if (!access_token) {
        throw new Error("Sesión no válida");
      }

      console.log('🚚 Solicitando tracking para pedido:', orderId);
      
      const response = await fetch(`${EDGE_TRACKING_URL}?order_id=${orderId}`, {
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json"
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📦 Datos de tracking recibidos:', result);
      
      if (result.success) {
        setTrackingData(result.tracking);
      } else {
        throw new Error(result.error || "Error desconocido");
      }
    } catch (err: any) {
      console.error("❌ Error fetching tracking:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de seguimiento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchTrackingData();
    }
  }, [isOpen, orderId]);

  const getStatusIcon = (status: string, estimated: boolean) => {
    if (estimated) return <Clock className="h-4 w-4 text-yellow-500" />;
    
    switch (status.toLowerCase()) {
      case 'confirmado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'preparando':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'en tránsito':
      case 'listo para envío':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'en distribución':
      case 'fuera para entrega':
        return <Navigation className="h-4 w-4 text-orange-500" />;
      case 'entregado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  // Función para obtener el color del estado - ACTUALIZADA para usar estados originales
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmado':
      case 'confirmed':
        return 'text-green-400 bg-green-500/10 border border-green-500/20';
      case 'preparando':
      case 'preparing':
        return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'pendiente':
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'procesando':
      case 'processing':
        return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'listo para envío':
      case 'ready to ship':
        return 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20';
      case 'enviado':
      case 'shipped':
      case 'en tránsito':
      case 'in transit':
        return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
      case 'en distribución':
      case 'in distribution':
        return 'text-orange-400 bg-orange-500/10 border border-orange-500/20';
      case 'fuera para entrega':
      case 'out for delivery':
        return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'entregado':
      case 'delivered':
        return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      case 'cancelado':
      case 'cancelled':
        return 'text-red-400 bg-red-500/10 border border-red-500/20';
      case 'entrega estimada':
      case 'estimated delivery':
        return 'text-gray-400 bg-gray-500/10 border border-gray-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md border border-white/20">
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-primary mr-3" />
            <span className="text-white text-lg">Cargando información de seguimiento...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md border border-white/20">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Error al cargar seguimiento</h3>
            <p className="text-white/70 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchTrackingData} variant="outline" className="w-full">
                Reintentar
              </Button>
              <Button onClick={onClose} variant="ghost" className="w-full">
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!trackingData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Seguimiento de Paquete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Número de Seguimiento</h3>
                    <p className="text-primary font-mono text-lg">{trackingData.trackingNumber}</p>
                  </div>
                  
                    <div>
                      <h3 className="text-white font-semibold mb-1">Estado del Pedido</h3>
                      <div className="flex flex-wrap gap-2">
                        {/* Badge del estado general del pedido */}
                        {trackingData.status && (
                          <Badge className={`${getStatusColor(trackingData.status)} font-medium`}>
                            📦 {trackingData.status}
                          </Badge>
                        )}
                        
                        {/* 🔥 MEJORAR LA VALIDACIÓN DEL SHIPPING STATUS */}
                        {trackingData.shippingStatus && 
                         trackingData.shippingStatus.trim() !== "" && 
                         trackingData.shippingStatus !== "null" && (
                          <Badge className={`${getStatusColor(trackingData.shippingStatus)} font-medium border-dashed`}>
                            🚚 {trackingData.shippingStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Progreso de Entrega</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${trackingData.progress}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{trackingData.progress}%</span>
                    </div>
                    
                    {/* 🔥 MEJORAR VALIDACIÓN DEL INDICADOR DE ESTADO */}
                    {trackingData.shippingStatus && 
                     trackingData.shippingStatus.trim() !== "" && 
                     trackingData.shippingStatus !== "null" && (
                      <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Estado actual: {trackingData.shippingStatus}
                      </p>
                    )}
                  </div>

                  {trackingData.estimatedDelivery && (
                    <div>
                      <h3 className="text-white font-semibold mb-1">Entrega Estimada</h3>
                      <p className="text-white/80 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(trackingData.estimatedDelivery), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ruta de envío */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Route className="h-5 w-5" />
                Ruta de Envío
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Building className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-green-300 text-sm font-medium">Origen</p>
                    <p className="text-white">{trackingData.origin}</p>
                    <p className="text-green-200 text-xs">Sede principal StepUp</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Home className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Destino</p>
                    {trackingData.destination === "Dirección no especificada" ? (
                      <div className="space-y-1">
                        <p className="text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Sin dirección específica
                        </p>
                        <p className="text-blue-200 text-xs">
                          Contacta soporte para actualizar
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white">{trackingData.destination}</p>
                        <p className="text-blue-200 text-xs">Dirección de entrega confirmada</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Alerta si no hay dirección específica */}
              {trackingData.destination === "Dirección no especificada" && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-300 font-medium mb-1">Dirección Pendiente</h4>
                      <p className="text-yellow-100/80 text-sm">
                        No hemos encontrado una dirección específica para este pedido. 
                        El paquete será enviado a Medellín por defecto. Si necesitas cambiar 
                        la dirección de entrega, por favor contacta nuestro servicio al cliente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline de eventos */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Seguimiento
              </h3>
              
              <div className="space-y-4">
                {/* CAMBIAR EL ORDEN - EVENTOS MÁS RECIENTES ARRIBA */}
                {[...trackingData.events].reverse().map((event, index) => {
                  // Calcular el índice real para la línea temporal
                  const totalEvents = trackingData.events.length;
                  const isLastInTimeline = index === totalEvents - 1;
                  
                  return (
                    <div key={`event-${totalEvents - index - 1}`} className="flex gap-4">
                      {/* Línea temporal */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                          event.estimated 
                            ? 'border-yellow-500/50 bg-yellow-500/10' 
                            : 'border-primary/50 bg-primary/20'
                        }`}>
                          {getStatusIcon(event.status, event.estimated)}
                        </div>
                        {!isLastInTimeline && (
                          <div className={`w-0.5 h-12 ${
                            event.estimated ? 'bg-yellow-500/30' : 'bg-primary/30'
                          }`} />
                        )}
                      </div>

                      {/* Contenido del evento */}
                      <div className="flex-1 pb-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={`${getStatusColor(event.status)} text-sm`}>
                            {event.status}
                            {event.estimated && " (Estimado)"}
                          </Badge>
                          <span className="text-white/60 text-sm">
                            {event.estimated 
                              ? format(new Date(event.timestamp), "dd/MM/yyyy HH:mm")
                              : formatDistanceToNow(new Date(event.timestamp), { 
                                  addSuffix: true, 
                                  locale: es 
                                })
                            }
                          </span>
                          {/* Badge para evento más reciente */}
                          {index === 0 && !event.estimated && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Más reciente
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="text-white font-medium mb-1">{event.description}</h4>
                        <p className="text-white/70 text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                        
                        {!event.estimated && (
                          <p className="text-white/50 text-xs mt-1">
                            {format(new Date(event.timestamp), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Información adicional - ACTUALIZADA */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-300 font-medium mb-1">Información Importante</h4>
                  <ul className="text-blue-100/80 text-sm space-y-1">
                    <li>• Las entregas se realizan de lunes a viernes de 8:00 AM a 6:00 PM</li>
                    <li>• Si no estás disponible, el paquete será reprogramado para el siguiente día hábil</li>
                    <li>• Recibirás una notificación cuando el paquete esté fuera para entrega</li>
                    
                    {/* 🔥 MEJORAR VALIDACIÓN EN INFORMACIÓN ADICIONAL */}
                    {trackingData.shippingStatus && 
                     trackingData.shippingStatus.trim() !== "" && 
                     trackingData.shippingStatus !== "null" &&
                     trackingData.shippingStatus.toLowerCase() !== 'entregado' && (
                      <li>• <strong>Estado actual del envío:</strong> {trackingData.shippingStatus}</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrackingModal;