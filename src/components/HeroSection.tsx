import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  const scrollToEvents = () => {
    window.dispatchEvent(new CustomEvent("closeFullGallery"));
    const element = document.querySelector("#events");
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-darker to-black">
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-light/20 filter blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-blue-medium/30 filter blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <img
              src="/logo-elektr-ame-hero.png"
              alt="Elektr-Âme"
              width={420}
              height={420}
              className="max-w-[min(85vw,420px)] w-full h-auto aspect-square object-contain"
              decoding="async"
              onError={(e) => {
                const el = e.currentTarget;
                el.onerror = null;
                el.src = "/logo-elektr-ame.png";
              }}
            />
          </div>
          <h1 className="sr-only text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            <span className="text-blue-light">Elektr</span>-Âme
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12">
            {t('hero.description')}
          </p>
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={scrollToEvents}
              className="bg-blue-dark hover:bg-blue-darker text-white text-lg px-8 py-6"
            >
              {t('hero.events')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
