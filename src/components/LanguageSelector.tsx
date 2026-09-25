
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Globe, ChevronDown } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";

const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('lang.en') },
    { code: 'es', name: t('lang.es') },
    { code: 'ca', name: t('lang.ca') }
  ];

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    closeDropdown();
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm"
        className="flex items-center gap-1 text-white/80 hover:text-white"
        onClick={toggleDropdown}
      >
        <Globe className="h-4 w-4" />
        <span>{language.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeDropdown}
          />
          <div className="absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-black border border-white/10 z-50">
            <div className="py-1 rounded-md bg-black shadow-xs">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as Language)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  {lang.name}
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-electric-blue" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
