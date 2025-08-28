# StepUP - Tienda en Línea 🛍️

## 🚀 Descripción

¡Bienvenido al repositorio de StepUP! Este proyecto es la tienda en línea de nuestra marca de ropa, construida para ofrecer una experiencia de compra moderna y sin fricciones. Desde la navegación del catálogo hasta el checkout, todo está diseñado para que la experiencia del usuario sea increíble.

## ✨ Características Principales

- **Catálogo Interactivo**: 👕 Explora nuestros productos con filtros y búsqueda
- **Carrito de Compras**: 🛒 Agrega, elimina y actualiza artículos fácilmente antes de comprar
- **Procesamiento de Pagos Seguro**: 💳 Integración con Stripe para transacciones confiables
- **Autenticación de Usuario**: 🔐 Inicia sesión, regístrate y gestiona tu cuenta
- **Diseño Responsivo**: 📱🖥️ Navega sin problemas desde cualquier dispositivo

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React**: Para la UI declarativa
- **TypeScript**: Para un código más seguro y predecible
- **Tailwind CSS**: Para un desarrollo rápido de estilos
- **Vite**: Como empaquetador para un desarrollo ágil

### Manejo de Estado y Rutas
- **Redux Toolkit**: Para una gestión de estado centralizada y eficiente
- **React Router Dom**: Para la navegación en la aplicación

### Servicios Externos
- **Stripe**: Para procesar los pagos de forma segura

## 📂 Estructura del Proyecto

```
/src
├── assets/                  # 🖼️ Imágenes, íconos y otros recursos
├── components/              # 🧩 Componentes reutilizables de la UI
├── pages/                   # 📄 Páginas principales de la aplicación
├── services/                # 📞 Lógica de peticiones a la API
├── state/                   # 🧠 Archivos de Redux para la gestión de estado
├── hooks/                   # 🎣 Custom hooks
├── styles/                  # 🎨 Estilos globales
├── App.tsx                  # Componente principal
└── main.tsx                 # Punto de entrada de la aplicación
```

## ⬇️ Guía de Instalación y Uso

### 1. Requisitos Previos
Asegúrate de tener Node.js y npm (o Yarn) instalados.

### 2. Clonar e Instalar

```bash
# Clona el repositorio
git clone https://github.com/Shuh3n/StepUp_ecommerce.git

# Ve al directorio del proyecto
cd stepup-tienda

# Instala las dependencias
npm install
```

### 3. Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto y agrega tus claves de API. Puedes usar el archivo `.env.example` como referencia.

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave_publica_de_stripe
```

### 4. Iniciar la Aplicación

```bash
npm run dev
```

¡Listo! La aplicación estará corriendo en http://localhost:5173.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 📧 Contacto

¿Tienes preguntas o sugerencias? No dudes en contactar al equipo en santiago.orozcoz.dev@gmail.com

---

⭐ ¡Dale una estrella a este repositorio si te gusta el proyecto!
