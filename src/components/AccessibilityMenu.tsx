import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Type, X } from "lucide-react";

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  const adjustFontSize = (increment: number) => {
    const newSize = Math.max(80, Math.min(150, fontSize + increment));
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  const resetFontSize = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = "100%";
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-stepup shadow-floating hover:scale-110 transition-transform"
        size="icon"
        aria-label="Abrir menú de accesibilidad"
      >
        <Type className="h-6 w-6" />
      </Button>

      {/* Accessibility Menu */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 p-4 shadow-floating bg-card border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground">Accesibilidad</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tamaño de letra</span>
              <span className="text-sm font-medium">{fontSize}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustFontSize(-10)}
                className="h-8 w-8"
                disabled={fontSize <= 80}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                onClick={resetFontSize}
                className="flex-1 h-8 text-xs"
              >
                Reset
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustFontSize(10)}
                className="h-8 w-8"
                disabled={fontSize >= 150}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AccessibilityMenu;