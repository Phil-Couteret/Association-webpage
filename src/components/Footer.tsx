
import { Music, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-black py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="flex items-center mb-6 md:mb-0">
            <Music className="h-8 w-8 text-blue-medium" />
            <span className="ml-2 text-lg font-semibold text-white">
              <span className="text-blue-light">ELEKTR</span>-ÂME
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#artists" className="text-white/70 hover:text-blue-light transition-colors">
              {t('nav.artists')}
            </a>
            <a href="#events" className="text-white/70 hover:text-blue-light transition-colors">
              {t('nav.events')}
            </a>
            <a href="#gallery" className="text-white/70 hover:text-blue-light transition-colors">
              {t('nav.gallery')}
            </a>
            <a href="#about" className="text-white/70 hover:text-blue-light transition-colors">
              {t('nav.about')}
            </a>
            <Link to="/membership" className="text-white/70 hover:text-blue-light transition-colors">
              {t('nav.membership')}
            </Link>
            <Link to="/contact" className="text-white/70 hover:text-blue-light transition-colors">
              {t('nav.contact')}
            </Link>
          </div>
        </div>
        
        <hr className="border-white/10 mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-wrap gap-4 text-white/50 text-sm mb-4 md:mb-0">
            <Link to="/legal-notice" className="hover:text-white transition-colors">
              {t('footer.legalNotice')}
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
          <div className="text-white/50 text-sm mb-4 md:mb-0">
            {t('footer.rights')}
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.977.207 1.505.344 1.858.182.466.398.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.977-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.977-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.469a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
              </svg>
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-white/30 text-xs">
          <p>{t('footer.disclaimer')}</p>
          <p className="mt-2">www.elektr-ame.com</p>
          <p className="mt-1 text-white/25">{t('footer.craftedBy')}</p>
          <Link 
            to="/admin" 
            className="inline-block mt-2 text-white/20 hover:text-white/40 transition-colors"
            title="Admin Access"
          >
            ·
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
