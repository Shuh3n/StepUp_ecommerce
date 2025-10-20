import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const EDGE_UPDATE_ORDER_PAYMENT = "https://xrflzmovtmlfrjhtoejs.supabase.co/functions/v1/update-order-payment-status";

const PagoExitoso = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Obtén el order_id de la query
  const query = new URLSearchParams(location.search);
  const orderId = query.get("order_id");

  // Cambia el estado del pedido a pagado y procesando al llegar a la página
  useEffect(() => {
    const updateOrderPaymentStatus = async () => {
      if (!orderId) return;
      setUpdating(true);
      try {
        await fetch(EDGE_UPDATE_ORDER_PAYMENT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            order_id: orderId,
            payment_status: "Pagado",
            status: "Procesando"
          })
        });
      } catch (e) {
        // Puedes mostrar un error si lo deseas
      }
      setUpdating(false);
    };
    updateOrderPaymentStatus();
  }, [orderId]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return setLoading(false);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      setOrder(data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <CheckCircle className="text-green-500 w-20 h-20 mb-6" />
        <h2 className="text-3xl font-bold mb-2">¡Pago exitoso!</h2>
        <p className="text-lg text-muted-foreground mb-4">
          No pudimos identificar tu pedido. Si tienes dudas, contáctanos.
        </p>
        <Button size="lg" onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    );
  }

  if (loading || updating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <p className="text-lg">Cargando tu pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <CheckCircle className="text-yellow-500 w-20 h-20 mb-6" />
        <h2 className="text-3xl font-bold mb-2">Pago recibido</h2>
        <p className="text-lg text-muted-foreground mb-4">
          No encontramos detalles de tu pedido. Por favor revisa tu correo o contacta soporte.
        </p>
        <Button size="lg" onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    );
  }

  // items: jsonb
  let items = [];
  try {
    items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
  } catch {
    items = [];
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <CheckCircle className="text-green-500 w-20 h-20 mb-6" />
      <h2 className="text-3xl font-bold mb-2">¡Pago exitoso!</h2>
      <p className="text-lg text-muted-foreground mb-4">
        Gracias por tu compra. Aquí tienes el resumen de tu pedido:
      </p>
      <div className="bg-card border rounded-xl shadow p-6 w-full max-w-md mb-6">
        <div className="mb-4 flex flex-col gap-2">
          <div><b>ID Pedido:</b> {order.id}</div>
          <div><b>Estado:</b> {order.status}</div>
          <div><b>Fecha:</b> {order.created_at?.slice(0, 16).replace("T", " ")}</div>
          <div><b>Total:</b> ${Number(order.total).toLocaleString()}</div>
          {order.address && <div><b>Dirección:</b> {order.address}</div>}
          {order.phone && <div><b>Teléfono:</b> {order.phone}</div>}
          <div><b>Método de pago:</b> {order.payment_method}</div>
        </div>
        <div>
          <b>Productos:</b>
          <ul className="mt-2">
            {items.map((item, idx) => (
              <li key={idx} className="mb-2 border-b pb-2 last:border-b-0 last:pb-0">
                <div className="font-medium">{item.name} <span className="text-xs text-muted-foreground">x{item.quantity}</span></div>
                {item.talla && <div className="text-xs">Talla: {item.talla}</div>}
                <div className="text-xs text-muted-foreground">${Number(item.price).toLocaleString()} c/u</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Button size="lg" className="mt-2" onClick={() => navigate("/")}>
        Volver al inicio
      </Button>
      <Button variant="ghost" className="mt-2" onClick={() => navigate("/pedidos")}>
        Ver mis pedidos
      </Button>
    </div>
  );
};

export default PagoExitoso;