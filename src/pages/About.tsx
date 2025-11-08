import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Award, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-white" />
          Volver
        </Button>
        <div className="max-w-4xl mx-auto prose prose-lg prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-white">Sobre Nosotros</h1>
          <p className="text-lg mb-8 text-gray-200">
            Conoce la historia y valores de StepUp Store
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col items-center">
              <Users className="h-10 w-10 text-primary mb-2" />
              <h3 className="font-semibold mb-1 text-white">Equipo Apasionado</h3>
              <p className="text-sm text-center text-gray-300">
                Somos un grupo de emprendedores colombianos dedicados a ofrecer productos de calidad y atención personalizada.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Award className="h-10 w-10 text-secondary mb-2" />
              <h3 className="font-semibold mb-1 text-white">Excelencia y Confianza</h3>
              <p className="text-sm text-center text-gray-300">
                Más de 5 años en el mercado, miles de clientes satisfechos y reconocimientos por nuestro servicio.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Heart className="h-10 w-10 text-pink-500 mb-2" />
              <h3 className="font-semibold mb-1 text-white">Compromiso Social</h3>
              <p className="text-sm text-center text-gray-300">
                Apoyamos causas sociales y sostenibilidad, donando parte de nuestras ganancias a fundaciones locales.
              </p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Nuestra Misión</h2>
          <p className="text-white">
            En StepUp Store, nuestra misión es elevar tu experiencia de compra, brindando productos innovadores, atención cercana y soluciones rápidas. Creemos en el poder de la comunidad y la mejora continua.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">¿Por qué elegirnos?</h2>
          <ul className="list-disc pl-6 space-y-2 text-white">
            <li>Envíos rápidos y seguros a toda Colombia</li>
            <li>Política de devoluciones flexible</li>
            <li>Soporte disponible 24/7</li>
            <li>Pagos protegidos con PayPal</li>
            <li>Productos seleccionados por expertos</li>
          </ul>
          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Contáctanos</h2>
          <p className="text-white">
            ¿Tienes dudas o sugerencias? Escríbenos a <strong>soporte@stepupstore.com</strong> o llámanos al <strong>+57 300 123 4567</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;