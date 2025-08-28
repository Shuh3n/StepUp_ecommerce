const StepUpLogo = () => {
  return (
    <div className="relative">
      <div className="text-6xl md:text-8xl font-black text-center">
        <span className="text-white drop-shadow-2xl">STEP</span>
        <span className="text-black ml-2">UP</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="w-full h-1 bg-white rounded-full"></div>
      </div>
      <div className="text-center mt-4">
        <p className="text-white text-lg md:text-xl font-bold tracking-wider">
          NO NECESITAMOS PERMISO PARA PISAR FUERTE
        </p>
      </div>
    </div>
  );
};

export default StepUpLogo;