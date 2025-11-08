const EDGE_UPDATE_ORDER_STATUS = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/update-order-status";

export const updateOrderStatus = async (
  orderId: string, 
  status: string = "Confirmado",
  paymentStatus: string = "Pagado",
  paypalData?: {
    orderId?: string;
    transactionId?: string;
    payerId?: string;
  }
) => {
  try {
    const token = localStorage.getItem('sb-xrflzmovtmlfrjhtoejs-auth-token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const authData = JSON.parse(token);
    const accessToken = authData.access_token;

    console.log('🔄 Actualizando estado de orden:', orderId);

    const response = await fetch(EDGE_UPDATE_ORDER_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        status,
        payment_status: paymentStatus,
        paypal_order_id: paypalData?.orderId,
        paypal_transaction_id: paypalData?.transactionId,
        paypal_payer_id: paypalData?.payerId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar el estado de la orden');
    }

    console.log('✅ Orden actualizada exitosamente:', data.order);
    return {
      success: true,
      order: data.order
    };

  } catch (error) {
    console.error('❌ Error al actualizar orden:', error);
    return {
      success: false,
      error: error.message
    };
  }
};