
import { Guitar, Headphones, MapPin, Waves, Sparkles, Leaf } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  translationKey: string;
}

const AboutSection = () => {
  const { t } = useLanguage();
  
  const features: FeatureProps[] = [
    {
      icon: <Headphones className="h-8 w-8 text-blue-light" />,
      title: t('feature.community'),
      description: t('feature.community.text'),
      translationKey: "community"
    },
    {
      icon: <Guitar className="h-8 w-8 text-blue-medium" />,
      title: t('feature.workshops'),
      description: t('feature.workshops.text'),
      translationKey: "workshops"
    },
    {
      icon: <MapPin className="h-8 w-8 text-blue-dark" />,
      title: t('feature.venues'),
      description: t('feature.venues.text'),
      translationKey: "venues"
    },
    {
      icon: <Waves className="h-8 w-8 text-blue-light" />,
      title: t('feature.therapy'),
      description: t('feature.therapy.text'),
      translationKey: "therapy"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-blue-medium" />,
      title: t('feature.innovation'),
      description: t('feature.innovation.text'),
      translationKey: "innovation"
    },
    {
      icon: <Leaf className="h-8 w-8 text-blue-dark" />,
      title: t('feature.eco'),
      description: t('feature.eco.text'),
      translationKey: "eco"
    }
  ];

  const FeatureCard = ({ feature }: { feature: FeatureProps }) => {
    return (
      <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:border-blue-medium/50 transition-all">
        <div className="mb-4">{feature.icon}</div>
        <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-white/70">{feature.description}</p>
      </div>
    );
  };

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-blue-light filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-darker filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t('about.title')}</h2>
          <p className="text-lg text-white/80">
            {t('about.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>

        <div className="mt-16 bg-black/30 rounded-2xl p-8 border border-white/10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold text-white mb-4">{t('about.mission')}</h3>
              <p className="text-white/80 mb-6">
                {t('about.mission.text')}
              </p>
              <div className="space-y-3">
                <p className="text-white/80">
                  <span className="text-blue-light font-medium">{t('about.values')}</span> {t('about.values.text')}
                </p>
                <p className="text-white/80">
                  <span className="text-blue-light font-medium">{t('about.focus')}</span> {t('about.focus.text')}
                </p>
                <p className="text-white/80">
                  <span className="text-blue-light font-medium">{t('about.community')}</span> {t('about.community.text')}
                </p>
              </div>
            </div>
            <div className="md:w-1/2 h-64 rounded-xl overflow-hidden">
              <img 
                src="/about-dj-mixer.jpg" 
                alt="Elektr-Âme"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
