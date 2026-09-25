import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import AboutSection from "@/components/AboutSection";
import ArtistSection from "@/components/ArtistSection";
import GallerySection from "@/components/GallerySection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { getDefaultOrganizationData, generateWebSiteData, generateEventData } from "@/utils/structuredData";
import { usePublicDataContext } from "@/contexts/PublicDataContext";

const Index = () => {
  const { events } = usePublicDataContext();
  const [structuredData, setStructuredData] = useState([
    getDefaultOrganizationData(),
    generateWebSiteData(
      'https://www.elektr-ame.com',
      'Elektr-Âme',
      "Barcelona's electronic music association. Join our community of artists, DJs, producers, and music lovers."
    ),
  ]);

  // Add event structured data for upcoming events
  useEffect(() => {
    const eventStructuredData = events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date();
      })
      .slice(0, 5) // Limit to first 5 upcoming events
      .map(event => {
        const eventDate = new Date(event.date);
        const [hours, minutes] = (event.time || '20:00').split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Calculate end date (default 2 hours duration)
        const endDate = new Date(eventDate);
        endDate.setHours(endDate.getHours() + 2);
        
        return generateEventData({
          name: event.title,
          description: event.description || `${event.title} - Electronic music event in Barcelona`,
          startDate: eventDate.toISOString(),
          endDate: endDate.toISOString(),
          location: {
            name: event.location || 'Barcelona, Spain',
            address: {
              addressLocality: 'Barcelona',
              addressCountry: 'ES',
            },
          },
          image: event.picture ? (event.picture.startsWith('http') ? event.picture : `https://www.elektr-ame.com${event.picture.startsWith('/') ? event.picture : '/' + event.picture}`) : undefined,
          organizer: {
            name: 'Elektr-Âme',
            url: 'https://www.elektr-ame.com',
          },
          eventStatus: 'EventScheduled',
          eventAttendanceMode: 'OfflineEventAttendanceMode',
        });
      });

    setStructuredData([
      getDefaultOrganizationData(),
      generateWebSiteData(
        'https://www.elektr-ame.com',
        'Elektr-Âme',
        "Barcelona's electronic music association. Join our community of artists, DJs, producers, and music lovers."
      ),
      ...eventStructuredData,
    ]);
  }, [events]);

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO 
        title="Elektr-Âme | Barcelona Electronic Music Association"
        description="Elektr-Âme - Barcelona's electronic music association. Join our community of artists, DJs, producers, and music lovers. Discover upcoming events, artist profiles, and more."
        url="https://www.elektr-ame.com"
        keywords="electronic music, Barcelona, DJ, producer, music association, events, concerts, techno, house music"
        structuredData={structuredData}
      />
      <Header />
      <HeroSection />
      <ArtistSection />
      <EventsSection />
      <GallerySection />
      <AboutSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Index;
