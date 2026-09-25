import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicDataContext } from "@/contexts/PublicDataContext";
import { MusicEvent } from "@/types/admin";
import { generateGoogleCalendarUrl, downloadCalendarFile, generateOutlookCalendarUrl, CalendarEvent } from "@/utils/calendar";

const EventCard = ({ event }: { event: MusicEvent }) => {
  const { t } = useLanguage();
  const eventDateTime = new Date(event.date);
  if (event.time) {
    const [hours, minutes] = event.time.split(':');
    eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  const isPastEvent = eventDateTime < new Date();
  
  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).toUpperCase();
  };

  // Format time for display
  const formatEventTime = (timeString: string) => {
    if (!timeString) return '';
    // Time is in HH:MM format, convert to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Create calendar event from MusicEvent
  const createCalendarEvent = (event: MusicEvent): CalendarEvent => {
    const eventDate = new Date(event.date);
    const [hours, minutes] = (event.time || '20:00').split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: eventDate,
      duration: 120, // 2 hours default
    };
  };

  const handleAddToCalendar = (event: MusicEvent, provider: 'google' | 'apple' | 'outlook') => {
    const calendarEvent = createCalendarEvent(event);
    
    if (provider === 'google') {
      window.open(generateGoogleCalendarUrl(calendarEvent), '_blank');
    } else if (provider === 'outlook') {
      window.open(generateOutlookCalendarUrl(calendarEvent), '_blank');
    } else if (provider === 'apple') {
      downloadCalendarFile(calendarEvent);
    }
  };
  
  return (
    <div className="flex flex-col overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl rounded-xl bg-gradient-to-br from-black/80 to-gray-800/80 backdrop-blur border border-white/5">
      <div className="h-48 relative overflow-hidden">
        {event.picture && typeof event.picture === 'string' && event.picture.trim().length > 0 ? (
          <img 
            src={event.picture.startsWith('/') ? event.picture : '/' + event.picture} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        {!event.picture && (
          <div className="w-full h-full bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-white/30" />
          </div>
        )}
        <div className="absolute top-0 left-0 m-4 flex flex-col gap-1">
          <div className="px-3 py-1 bg-blue-dark/90 text-white font-semibold rounded-full text-sm">
            {formatEventDate(event.date)}
          </div>
          {event.time && (
            <div className="px-3 py-1 bg-blue-dark/90 text-white font-medium rounded-full text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatEventTime(event.time)}
            </div>
          )}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
        <p className="text-white/70 mb-4 flex-grow">{event.description || 'Event details coming soon...'}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Calendar className="h-4 w-4 text-white/40" />
            <span>{formatEventDate(event.date)}</span>
            {event.time && (
              <>
                <span className="text-white/30">•</span>
                <Clock className="h-4 w-4 text-white/40" />
                <span>{formatEventTime(event.time)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-white/60">
            <span className="text-white/40">📍</span>
            {event.location}
          </div>
          
          {/* Add to Calendar Button */}
          {!isPastEvent && (
            <div className="mt-2">
            <div className="relative group">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  // Show dropdown or open Google Calendar by default
                  handleAddToCalendar(event, 'google');
                }}
                className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold text-sm"
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
              
              {/* Calendar Provider Dropdown */}
              <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCalendar(event, 'google');
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 text-sm flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Google Calendar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCalendar(event, 'outlook');
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 text-sm flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Outlook
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCalendar(event, 'apple');
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 text-sm flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Apple Calendar (.ics)
                  </button>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventsSection = () => {
  const { t } = useLanguage();
  const { events } = usePublicDataContext();
  const [allEvents, setAllEvents] = React.useState<MusicEvent[]>([]);
  
  React.useEffect(() => {
    // Fetch all events (both upcoming and past)
    const fetchAllEvents = async () => {
      try {
        const response = await fetch('/api/events-list.php?status=all');
        const result = await response.json();
        
        if (result.success) {
          const formattedEvents = (result.events || []).map((event: any) => {
            const dateTime = event.date && event.time 
              ? new Date(event.date + 'T' + event.time + ':00').toISOString()
              : new Date().toISOString();
            
            return {
              id: event.id.toString(),
              title: event.title,
              description: event.description || '',
              date: dateTime,
              time: event.time || '20:00',
              location: event.location || '',
              picture: event.picture || '',
              createdAt: event.createdAt || new Date().toISOString(),
              updatedAt: event.updatedAt || new Date().toISOString(),
              status: event.status
            };
          });
          setAllEvents(formattedEvents);
        }
      } catch (error) {
        console.error('Error fetching all events:', error);
      }
    };
    
    fetchAllEvents();
  }, []);
  
  // Separate upcoming and past events
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const upcomingEvents = allEvents.filter(event => {
    if (event.status === 'archived') return false;
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= now;
  });
  
  const pastEvents = allEvents.filter(event => {
    if (event.status === 'archived') return true;
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < now;
  });
  
  return (
    <section id="events" className="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-12 gap-4">
          <Calendar className="h-10 w-10 text-blue-medium" />
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t('events.title')}</h2>
            <p className="text-white/70 mt-2">{t('events.subtitle')}</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-black/30 rounded-lg border border-white/10">
              <p className="text-white/70 text-lg">To be announced</p>
              <p className="text-white/50 text-sm mt-2">Stay tuned for exciting new events!</p>
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Past Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State (if no events at all) */}
        {upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-white/30" />
            <p className="text-white/70 text-lg">No events at the moment.</p>
            <p className="text-white/50 text-sm mt-2">Check back soon for exciting new events!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
