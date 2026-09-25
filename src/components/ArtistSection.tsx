import { Button } from "@/components/ui/button";
import { Volume, ChevronDown, ChevronUp, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicDataContext } from "@/contexts/PublicDataContext";
import { Artist } from "@/types/admin";

const ArtistCard = ({ artist }: { artist: Artist }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Get role display text
  const getRoleDisplay = () => {
    if (artist.nickname && artist.nickname.trim()) {
      return artist.nickname;
    }
    return "DJ / Producer"; // Default role
  };

  // Get bio text - use bioTranslations first, then bioKey, then fallback to bio
  const getBioText = () => {
    // First try direct translations by language
    if (artist.bioTranslations) {
      const langBio = artist.bioTranslations[language as keyof typeof artist.bioTranslations];
      if (langBio && langBio.trim()) {
        return langBio;
      }
    }
    
    // Then try translation key
    if (artist.bioKey) {
      return t(artist.bioKey);
    }
    
    // Finally fallback to main bio field
    return artist.bio;
  };

  return (
    <div className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-black/80 to-gray-800/60 backdrop-blur border border-white/5 group">
      <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-2 border-blue-medium/50 group-hover:border-blue-medium transition-all">
        {artist.picture && typeof artist.picture === 'string' && artist.picture.trim().length > 0 ? (
          <img 
            src={artist.picture.startsWith('/') ? artist.picture : `/${artist.picture}`} 
            alt={artist.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center">
            <User className="h-16 w-16 text-white/30" />
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-1">{artist.name}</h3>
      <p className="text-blue-light mb-4">{getRoleDisplay()}</p>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
        <div className="text-white/70 text-sm text-center mb-6 leading-relaxed">
          <div className={`${!isExpanded ? 'line-clamp-2' : ''}`}>
            {getBioText()}
          </div>
          <CollapsibleTrigger className="flex items-center justify-center w-full mt-2 text-blue-medium hover:text-white transition-colors">
            {isExpanded ? (
              <>
                <span className="mr-1">{t('artists.showLess')}</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span className="mr-1">{t('artists.readMore')}</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </CollapsibleTrigger>
        </div>
      </Collapsible>
      
      <div className="flex space-x-3 flex-wrap justify-center gap-y-2">
        {Object.entries(artist.socialLinks).map(([platform, url]) => {
          if (!url || url === '#') return null;
          
          const getSocialIcon = (platform: string) => {
            switch (platform) {
              case 'soundcloud':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.56 8.87V17h1.87V9c-.52-.28-1.3-.4-1.87-.13zm-1.87 3.82c-.2-.13-.4-.13-.53 0V17h.53V12.7zm-2.13.39c0-.13 0-.13-.13-.26a.8.8 0 0 0-.4 0c-.13.13-.27.13-.27.26V17h.67v-4.1h.13zm-2.13-.26c0-.27-.13-.27-.27-.4-.13 0-.4 0-.53.13V17h.67v-4.36h.13zm-2.14.52c.13 0 .13-.13.26-.13s.27-.13.27-.26a.5.5 0 0 0-.27-.4c-.13 0-.13.14-.26.27v.53zm-1.2 2.26A2.74 2.74 0 0 1 2 14.79v.79c0 .26.14.52.27.79.13.13.26.39.4.52.13 0 .26.13.26.26h.14c.26-.26.53-.52.66-.92 0-.13.13-.13.13-.26V14.4c0-.26-.13-.39-.13-.66a.47.47 0 0 0-.66-.26c-.13 0-.13.13-.26.13zm17.07-6.48a7.52 7.52 0 0 0-1.73-2.74 7.19 7.19 0 0 0-2.6-1.87 8.33 8.33 0 0 0-3.06-.66c-1.2 0-2.34.27-3.47.67-.4.13-.66.26-1.06.39-.27.13-.53.13-.8.26 0 0-.13.13-.13 0V4.4c0-.39-.13-.52-.53-.52h-.8c-.93 0-1.2.39-1.33 1.19v.13s-.14 1.2-.14 2.79c0 1.59.14 3.18.14 3.31v.4c0 .4 0 .8.13 1.2.13.92.92 1.05 1.73 1.05h.4c.8 0 1.2-.13 1.33-.92v-.26-1.7c0-.4.13-.67.53-.67h.13c.94.53 1.87.92 2.94 1.05 1.2.27 2.4.27 3.6 0a7.2 7.2 0 0 0 2.26-.92c1.07-.53 1.87-1.33 2.4-2.39.52-1.05.79-2.1.79-3.31s-.13-2.52-.53-3.44zM14.5 14.26c0 .4-.14.67-.4.93-.27.27-.67.27-1.07.27a1.5 1.5 0 0 1-1.06-.27c-.27-.26-.4-.53-.4-.92V9.52c0-.26.13-.53.26-.66.14-.13.27-.13.54-.13a.95.95 0 0 1 .8.13c.26.13.26.4.26.66v4.74h1.07z" />
                  </svg>
                );
              case 'instagram':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.977.207 1.505.344 1.858.182.466.398.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.977-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.977-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.469a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
                  </svg>
                );
              case 'linktree':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.73 4.25 12 6.41l-1.73-2.16h-3.8L12 10.94l5.53-6.69h-3.8zm-3.46 9.19L12 15.6l1.73-2.16h3.8L12 6.76l-5.53 6.68h3.8zm0 5.94L12 17.19l1.73 2.16h3.8L12 12.66l-5.53 6.69h3.8z"/>
                  </svg>
                );
              case 'spotify':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                );
              case 'beatport':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5h-2.25v-4.25h-4.5V16.5H7.5v-9h2.25v2.25h4.5V7.5h2.25v9z"/>
                  </svg>
                );
              case 'residentAdvisor':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-3H8v-4h3V7h2v3h3v4h-3v3h-2z"/>
                  </svg>
                );
              case 'facebook':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                );
              case 'twitter':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                );
              case 'youtube':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                );
              case 'tiktok':
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                );
              default:
                return (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.5 2C13.5 2.44772 13.3244 2.87749 13.0118 3.19454C12.6993 3.5116 12.2754 3.68892 11.8333 3.68892C11.3913 3.68892 10.9674 3.5116 10.6548 3.19454C10.3423 2.87749 10.1667 2.44772 10.1667 2C10.1667 1.55228 10.3423 1.12251 10.6548 0.805456C10.9674 0.488398 11.3913 0.311081 11.8333 0.311081C12.2754 0.311081 12.6993 0.488398 13.0118 0.805456C13.3244 1.12251 13.5 1.55228 13.5 2ZM13.5 22C13.5 22.4477 13.3244 22.8775 13.0118 23.1945C12.6993 23.5116 12.2754 23.6889 11.8333 23.6889C11.3913 23.6889 10.9674 23.5116 10.6548 23.1945C10.3423 22.8775 10.1667 22.4477 10.1667 22C10.1667 21.5523 10.3423 21.1225 10.6548 20.8055C10.9674 20.4884 11.3913 20.3111 11.8333 20.3111C12.2754 20.3111 12.6993 20.4884 13.0118 20.8055C13.3244 21.1225 13.5 21.5523 13.5 22ZM20.5 12C20.5 12.4477 20.3244 12.8775 20.0118 13.1945C19.6993 13.5116 19.2754 13.6889 18.8333 13.6889C18.3913 13.6889 17.9674 13.5116 17.6548 13.1945C17.3423 12.8775 17.1667 12.4477 17.1667 12C17.1667 11.5523 17.3423 11.1225 17.6548 10.8055C17.9674 10.4884 18.3913 10.3111 18.8333 10.3111C19.2754 10.3111 19.6993 10.4884 20.0118 10.8055C20.3244 11.1225 20.5 11.5523 20.5 12ZM6.5 12C6.5 12.4477 6.32441 12.8775 6.01185 13.1945C5.69929 13.5116 5.27536 13.6889 4.83333 13.6889C4.39131 13.6889 3.96738 13.5116 3.65482 13.1945C3.34226 12.8775 3.16667 12.4477 3.16667 12C3.16667 11.5523 3.34226 11.1225 3.65482 10.8055C3.96738 10.4884 4.39131 10.3111 4.83333 10.3111C5.27536 10.3111 5.69929 10.4884 6.01185 10.8055C6.32441 11.1225 6.5 11.5523 6.5 12Z" transform="translate(0, 0)"/>
                  </svg>
                );
            }
          };
          
          return (
            <a 
              key={platform}
              href={url} 
              className="text-white/60 hover:text-blue-light transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
              title={platform.charAt(0).toUpperCase() + platform.slice(1)}
            >
              {getSocialIcon(platform)}
            </a>
          );
        })}
      </div>
      
      {/* View Profile Button */}
      <div className="mt-6">
        <Button
          onClick={() => navigate(`/artist/${artist.id}`)}
          className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-medium"
        >
          View Full Profile & Gallery
        </Button>
      </div>
    </div>
  );
};

const ArtistSection = () => {
  const { t } = useLanguage();
  const { artists } = usePublicDataContext();
  
  return (
    <section id="artists" className="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-12 gap-4">
          <Volume className="h-10 w-10 text-blue-medium" />
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t('artists.title')}</h2>
            <p className="text-white/70 mt-2">{t('artists.subtitle')}</p>
          </div>
        </div>

        {artists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-white/30" />
            <p className="text-white/70 text-lg">No artists to showcase at the moment.</p>
            <p className="text-white/50 text-sm mt-2">Check back soon for featured artists!</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button 
            className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
          >
            {t('artists.viewAll')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ArtistSection;
