import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Type, X, RotateCcw, Contrast, FileText, Keyboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [textOnly, setTextOnly] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 100);
      setTextOnly(settings.textOnly || false);
      setHighContrast(settings.highContrast || false);
      applySettings(settings);
    }
  }, []);

  const saveSettings = (settings: any) => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  };

  const applySettings = (settings: any) => {
    document.documentElement.style.fontSize = `${settings.fontSize || 100}%`;
    
    if (settings.textOnly) {
      document.body.classList.add('text-only-mode');
    } else {
      document.body.classList.remove('text-only-mode');
    }

    if (settings.highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  };

  const adjustFontSize = (increment: number) => {
    const newSize = Math.max(80, Math.min(150, fontSize + increment));
    setFontSize(newSize);
    const settings = { fontSize: newSize, textOnly, highContrast };
    applySettings(settings);
    saveSettings(settings);
  };

  const toggleTextOnly = () => {
    const newValue = !textOnly;
    setTextOnly(newValue);
    const settings = { fontSize, textOnly: newValue, highContrast };
    applySettings(settings);
    saveSettings(settings);
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    const settings = { fontSize, textOnly, highContrast: newValue };
    applySettings(settings);
    saveSettings(settings);
  };

  const resetAllSettings = () => {
    const defaultSettings = { fontSize: 100, textOnly: false, highContrast: false };
    setFontSize(100);
    setTextOnly(false);
    setHighContrast(false);
    applySettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  const handleOpen = () => {
    setIsAnimating(false);
    setIsOpen(true);
    // Trigger animation after mount
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const shortcuts = [
    { key: "Alt + A", description: "Abrir/Cerrar menú de accesibilidad" },
    { key: "Alt + T", description: "Abrir/Cerrar menú de accesibilidad" },
    { key: "Alt + +", description: "Aumentar tamaño de letra" },
    { key: "Alt + -", description: "Disminuir tamaño de letra" },
    { key: "Alt + R", description: "Restablecer configuración" },
    { key: "Alt + C", description: "Alternar alto contraste" },
    { key: "Alt + X", description: "Alternar modo solo texto" },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'a':
          case 't':
            e.preventDefault();
            if (isOpen) {
              handleClose();
            } else {
              handleOpen();
            }
            break;
          case '+':
          case '=':
            e.preventDefault();
            adjustFontSize(10);
            break;
          case '-':
            e.preventDefault();
            adjustFontSize(-10);
            break;
          case 'r':
            e.preventDefault();
            resetAllSettings();
            break;
          case 'c':
            e.preventDefault();
            toggleHighContrast();
            break;
          case 'x':
            e.preventDefault();
            toggleTextOnly();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, fontSize, textOnly, highContrast]);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full bg-gradient-stepup shadow-floating hover:scale-110 transition-transform animate-fade-in"
        size="icon"
        aria-label="Abrir menú de accesibilidad (Alt + A)"
      >
        <Type className="h-6 w-6" />
      </Button>

      {/* Accessibility Menu */}
      {isOpen && (
        <>
          <Card className={`fixed bottom-24 right-6 z-[100] p-6 shadow-floating bg-card border-primary/20 w-96 transition-all duration-300 ${
            isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Accesibilidad
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Tamaño de letra</span>
                  <Badge variant="outline">{fontSize}%</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustFontSize(-10)}
                    className="h-8 w-8"
                    disabled={fontSize <= 80}
                    aria-label="Disminuir tamaño (Alt + -)"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-stepup transition-all duration-300"
                      style={{ width: `${((fontSize - 80) / 70) * 100}%` }}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustFontSize(10)}
                    className="h-8 w-8"
                    disabled={fontSize >= 150}
                    aria-label="Aumentar tamaño (Alt + +)"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Text Only Mode */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Modo Solo Texto</p>
                    <p className="text-xs text-muted-foreground">Ocultar imágenes decorativas</p>
                  </div>
                </div>
                <Button
                  variant={textOnly ? "default" : "outline"}
                  size="sm"
                  onClick={toggleTextOnly}
                  aria-label="Alternar modo solo texto (Alt + X)"
                >
                  {textOnly ? "Activado" : "Desactivado"}
                </Button>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Contrast className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Alto Contraste</p>
                    <p className="text-xs text-muted-foreground">Mejorar legibilidad</p>
                  </div>
                </div>
                <Button
                  variant={highContrast ? "default" : "outline"}
                  size="sm"
                  onClick={toggleHighContrast}
                  aria-label="Alternar alto contraste (Alt + C)"
                >
                  {highContrast ? "Activado" : "Desactivado"}
                </Button>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="border-t border-border pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Atajos de Teclado
                </Button>
                
                {showShortcuts && (
                  <div className="mt-3 space-y-2 p-3 bg-muted/50 rounded-lg animate-fade-in">
                    {shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{shortcut.description}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {shortcut.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                onClick={resetAllSettings}
                aria-label="Restablecer configuración (Alt + R)"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer Todo
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  );
};

export default AccessibilityMenu;