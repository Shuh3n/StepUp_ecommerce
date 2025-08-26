import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
}

const Cart = ({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }: CartProps) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="ml-auto w-full max-w-md h-full glass border-l border-white/20 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Carrito</h2>
            {itemCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {itemCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Tu carrito está vacío</h3>
              <p className="text-muted-foreground mb-6">
                Agrega algunos productos increíbles a tu carrito
              </p>
              <Button variant="hero" onClick={onClose}>
                Continuar Comprando
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card rounded-xl border border-white/10"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                    <Badge variant="outline" className="text-xs mb-2">
                      {item.category}
                    </Badge>
                    <div className="text-primary font-bold">
                      ${(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="h-6 w-6"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/20 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold gradient-text">
                ${total.toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-3">
              <Button variant="hero" className="w-full" size="lg">
                Proceder al Pago
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Continuar Comprando
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Envío gratis en compras superiores a $100.000
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;