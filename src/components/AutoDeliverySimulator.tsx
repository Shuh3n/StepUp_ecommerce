import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AutoDeliverySimulator = () => {
  useEffect(() => {
    const simulateDeliveries = async () => {
      try {
        // Obtener pedidos que deberían estar entregados (más de 3 días)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const { data: ordersToUpdate } = await supabase
          .from("orders")
          .select("id, status, tracking_number, created_at")
          .neq("status", "Entregado")
          .neq("status", "Cancelado")
          .lt("created_at", threeDaysAgo.toISOString());

        if (ordersToUpdate && ordersToUpdate.length > 0) {
          // Generar tracking numbers para pedidos que no los tienen
          for (const order of ordersToUpdate) {
            if (!order.tracking_number) {
              // Formato: SP + 8 caracteres alfanuméricos (total 10)
              const generateRandomChar = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                return chars.charAt(Math.floor(Math.random() * chars.length));
              };
              
              const shortId = order.id.slice(-4).toUpperCase();
              const randomPart = Array.from({length: 4}, () => generateRandomChar()).join('');
              const trackingNumber = `SP${shortId}${randomPart}`;
              
              // Verificar que sea único
              const { data: existing } = await supabase
                .from("orders")
                .select("id")
                .eq("tracking_number", trackingNumber)
                .single();
                
              if (!existing) {
                await supabase
                  .from("orders")
                  .update({ tracking_number: trackingNumber })
                  .eq("id", order.id);
                  
                console.log(`📋 Tracking generado para pedido ${order.id}: ${trackingNumber}`);
              }
            }
          }

          // Simular entrega de algunos pedidos (70% probabilidad)
          const ordersToDeliver = ordersToUpdate.filter(() => Math.random() > 0.3);
          
          if (ordersToDeliver.length > 0) {
            await supabase
              .from("orders")
              .update({ status: "Entregado" })
              .in("id", ordersToDeliver.map(o => o.id));
              
            console.log(`📦 ${ordersToDeliver.length} pedidos simulados como entregados`);
          }
        }
      } catch (error) {
        console.error("Error en simulación de entregas:", error);
      }
    };

    // Ejecutar cada 10 minutos
    const interval = setInterval(simulateDeliveries, 10 * 60 * 1000);
    
    // Ejecutar inmediatamente
    simulateDeliveries();

    return () => clearInterval(interval);
  }, []);

  return null; // Componente invisible
};

export default AutoDeliverySimulator;