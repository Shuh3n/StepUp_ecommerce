import { supabase } from '@/lib/supabase';

const EDGE_UPDATE_ORDER_STATUS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/update-order-status";

interface UpdateOrderStatusParams {
  orderId?: string;
  payerId?: string;
  transactionId?: string;
}

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  paymentStatus: string,
  paypalData?: UpdateOrderStatusParams
) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const access_token = sessionData?.session?.access_token;

    if (!access_token) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🔄 Actualizando estado de orden:', {
      orderId,
      status,
      paymentStatus,
      paypalData
    });

    const response = await fetch(EDGE_UPDATE_ORDER_STATUS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        status: status,
        payment_status: paymentStatus,
        paypal_transaction_id: paypalData?.transactionId || paypalData?.orderId || null,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Error al actualizar orden:', result);
      return {
        success: false,
        error: result.error || 'Error al actualizar el estado de la orden'
      };
    }

    console.log('✅ Orden actualizada exitosamente:', result.order);

    return {
      success: true,
      order: result.order
    };

  } catch (error: any) {
    console.error('❌ Error inesperado al actualizar orden:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al actualizar la orden'
    };
  }
};