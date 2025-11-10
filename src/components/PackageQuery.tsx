import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Clock, MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PackageQuery = () => {
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const querySpecificPackage = async () => {
    setLoading(true);
    try {
      // Buscar el paquete SP1206OQ6S específicamente
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("tracking_number", "SP1206OQ6S")
        .single();

      if (order) {
        // Calcular fecha estimada de entrega
        const orderDate = new Date(order.created_at);
        const estimatedDelivery = new Date(orderDate);
        
        // Determinar días de entrega según destino
        let deliveryDays = 2; // Default
        if (order.address) {
          if (order.address.toLowerCase().includes("bogotá")) deliveryDays = 2;
          else if (order.address.toLowerCase().includes("cali")) deliveryDays = 3;
          else if (order.address.toLowerCase().includes("barranquilla")) deliveryDays = 4;
          else if (order.address.toLowerCase().includes("medellín")) deliveryDays = 1;
        }
        
        estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);
        
        // Ajustar para día hábil
        while (estimatedDelivery.getDay() === 0 || estimatedDelivery.getDay() === 6) {
          estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
        }

        setPackageInfo({
          ...order,
          estimatedDelivery: estimatedDelivery.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          deliveryTime: estimatedDelivery.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      }
    } catch (error) {
      console.error('Error querying package:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    querySpecificPackage();
  }, []);

  if (loading) {
    return (
      <Card className="mt-8 bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-6 text-center">
          <Package className="h-8 w-8 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Consultando paquete SP1206OQ6S...</p>
        </CardContent>
      </Card>
    );
  }

  if (!packageInfo) {
    return (
      <Card className="mt-8 bg-red-500/10 border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-red-300 font-semibold">Paquete SP1206OQ6S no encontrado</h3>
              <p className="text-red-100/80 text-sm">
                Este código de seguimiento no existe en nuestro sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const estimatedDate = new Date(packageInfo.estimatedDelivery);
  const isOverdue = now > estimatedDate && packageInfo.status !== "Entregado";

  return (
    <Card className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-2">
              Información del Paquete SP1206OQ6S
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <span className="text-white text-sm font-medium">Estado actual:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    packageInfo.status === "Entregado" ? "bg-green-500/20 text-green-300" :
                    packageInfo.status === "En tránsito" ? "bg-blue-500/20 text-blue-300" :
                    "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {packageInfo.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-sm font-medium">Fecha estimada:</span>
                  <span className={`text-sm ${isOverdue ? "text-red-300" : "text-purple-300"}`}>
                    {packageInfo.estimatedDelivery}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-sm font-medium">Hora estimada:</span>
                  <span className="text-purple-300 text-sm">
                    Entre 8:00 AM - 6:00 PM
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {packageInfo.address && (
                  <div>
                    <span className="text-white text-sm font-medium">Dirección:</span>
                    <p className="text-gray-300 text-sm">{packageInfo.address}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-white text-sm font-medium">Total:</span>
                  <span className="text-green-300 text-sm ml-2">
                    ${new Intl.NumberFormat('es-CO').format(packageInfo.total)} COP
                  </span>
                </div>
              </div>
            </div>

            {isOverdue && packageInfo.status !== "Entregado" && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">
                    Entrega retrasada
                  </span>
                </div>
                <p className="text-red-200 text-xs mt-1">
                  El paquete debía entregarse el {packageInfo.estimatedDelivery}. 
                  Contacta soporte para más información.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageQuery;