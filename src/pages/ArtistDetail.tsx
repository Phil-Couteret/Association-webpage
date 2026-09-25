import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArtistProfile from "@/components/ArtistProfile";
import PressKitModal from "@/components/PressKitModal";
import SongModal from "@/components/SongModal";
import StreamModal from "@/components/StreamModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, FileText, Music, Video } from "lucide-react";
import { SEO } from "@/components/SEO";
import { generatePersonData, generateBreadcrumbData, getDefaultOrganizationData } from "@/utils/structuredData";

interface Artist {
  id: string;
  name: string;
  nickname?: string;
  bio: string;
  picture?: string;
  pressKitUrl?: string;
  song1Url?: string;
  song2Url?: string;
  song3Url?: string;
  stream1Url?: string;
  stream2Url?: string;
  stream3Url?: string;
  socialLinks: { [key: string]: string };
}

const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [pressKitModalOpen, setPressKitModalOpen] = useState(false);
  const [songModalOpen, setSongModalOpen] = useState(false);
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>('');
  const [selectedSongTitle, setSelectedSongTitle] = useState<string>('');
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string>('');
  const [selectedStreamTitle, setSelectedStreamTitle] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchArtist(id);
    }
  }, [id]);

  const fetchArtist = async (artistId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/artists-list.php', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        const foundArtist = result.artists.find((a: any) => a.id.toString() === artistId);
        if (foundArtist) {
          setArtist(foundArtist);
        }
      }
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue mx-auto"></div>
          <p className="text-white/70 mt-4">Loading artist...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-24 text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-white/30" />
          <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
          <p className="text-white/70 mb-6">The artist you're looking for doesn't exist.</p>
          <Button 
            onClick={() => navigate('/#artists')}
            className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Artists
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const artistImage = artist?.picture 
    ? (artist.picture.startsWith('/') ? artist.picture : `/${artist.picture}`)
    : "https://www.elektr-ame.com/elektr-ame-media/85e5425f-9e5d-4f41-a064-2e7734dc6c51.png";

  // Generate structured data for artist
  const structuredData = artist ? [
    generatePersonData({
      name: artist.name,
      alternateName: artist.nickname,
      description: artist.bio || `${artist.name} - Electronic music artist on Elektr-Âme`,
      image: artistImage.startsWith('http') ? artistImage : `https://www.elektr-ame.com${artistImage}`,
      url: `https://www.elektr-ame.com/artist/${id}`,
      jobTitle: 'Electronic Music Artist',
      sameAs: artist.socialLinks ? Object.values(artist.socialLinks).filter(Boolean) : [],
    }),
    generateBreadcrumbData({
      items: [
        { name: 'Home', url: 'https://www.elektr-ame.com' },
        { name: 'Artists', url: 'https://www.elektr-ame.com/#artists' },
        { name: artist.name, url: `https://www.elektr-ame.com/artist/${id}` },
      ],
    }),
    getDefaultOrganizationData(),
  ] : [getDefaultOrganizationData()];

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO 
        title={artist ? `${artist.name} | Elektr-Âme` : "Artist | Elektr-Âme"}
        description={artist ? `${artist.name} - ${artist.bio?.substring(0, 150) || 'Artist profile on Elektr-Âme'}...` : "Artist profile on Elektr-Âme"}
        image={artistImage.startsWith('http') ? artistImage : `https://www.elektr-ame.com${artistImage}`}
        url={`https://www.elektr-ame.com/artist/${id}`}
        type="profile"
        keywords={artist ? `${artist.name}, electronic music, Barcelona, DJ, producer, ${artist.nickname || ''}` : "electronic music, Barcelona"}
        structuredData={structuredData}
      />
      <Header />
      
      {/* Artist Header */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-deep-purple to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={() => navigate('/#artists')}
            className="mb-6 bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Artists
          </Button>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {artist.picture ? (
              <img
                src={artist.picture}
                alt={artist.name}
                className="w-48 h-48 rounded-full object-cover border-4 border-electric-blue/50"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-electric-blue/20 to-neon-pink/20 flex items-center justify-center border-4 border-white/20">
                <User className="h-24 w-24 text-white/30" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{artist.name}</h1>
              {artist.nickname && (
                <p className="text-2xl text-electric-blue mb-4">"{artist.nickname}"</p>
              )}
              <p className="text-white/80 text-lg mb-6 max-w-3xl">{artist.bio}</p>

              {/* Press Kit Link */}
              {artist.pressKitUrl && artist.pressKitUrl.trim() !== '' && (
                <div className="mb-6 flex justify-center md:justify-start">
                  <Button
                    onClick={() => setPressKitModalOpen(true)}
                    className="bg-electric-blue/20 hover:bg-electric-blue/30 text-electric-blue border border-electric-blue/50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Press-Kit
                  </Button>
                </div>
              )}
              {/* Debug: Show press-kit status */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-white/50 mb-2">
                  Debug: pressKitUrl = {artist.pressKitUrl ? `"${artist.pressKitUrl}"` : 'null/undefined'}
                </div>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {Object.entries(artist.socialLinks).map(([platform, url]) => {
                  if (!url || url === '#') return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-colors text-sm font-medium"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  );
                })}
              </div>

              {/* Songs Links */}
              {(artist.song1Url || artist.song2Url || artist.song3Url) && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                  {artist.song1Url && (
                    <Button
                      onClick={() => {
                        setSelectedSongUrl(artist.song1Url!);
                        setSelectedSongTitle(`${artist.name} - Song 1`);
                        setSongModalOpen(true);
                      }}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50"
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Song 1
                    </Button>
                  )}
                  {artist.song2Url && (
                    <Button
                      onClick={() => {
                        setSelectedSongUrl(artist.song2Url!);
                        setSelectedSongTitle(`${artist.name} - Song 2`);
                        setSongModalOpen(true);
                      }}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50"
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Song 2
                    </Button>
                  )}
                  {artist.song3Url && (
                    <Button
                      onClick={() => {
                        setSelectedSongUrl(artist.song3Url!);
                        setSelectedSongTitle(`${artist.name} - Song 3`);
                        setSongModalOpen(true);
                      }}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50"
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Song 3
                    </Button>
                  )}
                </div>
              )}

              {/* Streams Links */}
              {(artist.stream1Url || artist.stream2Url || artist.stream3Url) && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                  {artist.stream1Url && (
                    <Button
                      onClick={() => {
                        setSelectedStreamUrl(artist.stream1Url!);
                        setSelectedStreamTitle(`${artist.name} - Stream 1`);
                        setStreamModalOpen(true);
                      }}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Stream 1
                    </Button>
                  )}
                  {artist.stream2Url && (
                    <Button
                      onClick={() => {
                        setSelectedStreamUrl(artist.stream2Url!);
                        setSelectedStreamTitle(`${artist.name} - Stream 2`);
                        setStreamModalOpen(true);
                      }}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Stream 2
                    </Button>
                  )}
                  {artist.stream3Url && (
                    <Button
                      onClick={() => {
                        setSelectedStreamUrl(artist.stream3Url!);
                        setSelectedStreamTitle(`${artist.name} - Stream 3`);
                        setStreamModalOpen(true);
                      }}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Stream 3
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Artist Gallery */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-8">Gallery</h2>
          <ArtistProfile 
            artistId={parseInt(id!)} 
            artistName={artist.name} 
            isAdmin={false}
          />
        </div>
      </section>

      {/* Press Kit Modal */}
      {artist?.pressKitUrl && (
        <PressKitModal
          isOpen={pressKitModalOpen}
          onClose={() => setPressKitModalOpen(false)}
          pressKitUrl={artist.pressKitUrl}
          artistName={artist.name}
        />
      )}

      {/* Song Modal */}
      {selectedSongUrl && (
        <SongModal
          isOpen={songModalOpen}
          onClose={() => {
            setSongModalOpen(false);
            setSelectedSongUrl('');
            setSelectedSongTitle('');
          }}
          songUrl={selectedSongUrl}
          songTitle={selectedSongTitle}
        />
      )}

      {/* Stream Modal */}
      {selectedStreamUrl && (
        <StreamModal
          isOpen={streamModalOpen}
          onClose={() => {
            setStreamModalOpen(false);
            setSelectedStreamUrl('');
            setSelectedStreamTitle('');
          }}
          streamUrl={selectedStreamUrl}
          streamTitle={selectedStreamTitle}
        />
      )}

      <Footer />
    </div>
  );
};

export default ArtistDetail;

