import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Mensaje enviado",
      description: "Te contactaremos pronto. ¡Gracias por escribirnos!",
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text animate-fade-in">
            Contáctanos
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">info@stepup.com</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-muted-foreground">+57 300 123 4567</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-muted-foreground">Bogotá, Colombia</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Horarios de Atención</h4>
              <div className="text-muted-foreground space-y-1">
                <p>Lunes - Viernes: 9:00 AM - 6:00 PM</p>
                <p>Sábados: 10:00 AM - 4:00 PM</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+57 300 123 4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-stepup hover:shadow-red transition-all duration-300 hover:scale-105"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Mensaje
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;