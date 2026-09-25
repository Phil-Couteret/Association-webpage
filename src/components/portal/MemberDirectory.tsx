import { useState, useEffect } from 'react';
import { Search, Users, MapPin, Filter, X, Music, Video, Palette, Heart, ExternalLink, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface Member {
  id: number;
  first_name: string;
  second_name?: string;
  last_name?: string;
  full_name: string;
  artist_name?: string;
  profile_picture?: string;
  bio?: string;
  social_links?: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    youtube?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
  city?: string;
  country?: string;
  membership_type?: string;
  roles: string[];
  is_dj: boolean;
  is_producer: boolean;
  is_vj: boolean;
  is_visual_artist: boolean;
  is_fan: boolean;
  created_at: string;
}

interface MemberDirectoryProps {
  onSendMessage?: (memberId: number, memberName: string) => void;
}

const MemberDirectory = ({ onSendMessage }: MemberDirectoryProps = {}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const { toast } = useToast();

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (cityFilter) params.append('city', cityFilter);

      const response = await fetch(`/api/members-directory.php?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch members' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMembers(data.members || []);
        setFilteredMembers(data.members || []);
      } else {
        throw new Error(data.message || 'Failed to fetch members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load member directory';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchMembers();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setCityFilter('');
    // Use setTimeout to ensure state updates before fetching
    setTimeout(() => {
      // Create a new fetch with empty filters
      const fetchAllMembers = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/members-directory.php`, {
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch members' }));
            throw new Error(errorData.message || `Server error: ${response.status}`);
          }

          const data = await response.json();
          if (data.success) {
            setMembers(data.members || []);
            setFilteredMembers(data.members || []);
          } else {
            throw new Error(data.message || 'Failed to fetch members');
          }
        } catch (error) {
          console.error('Error fetching members:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load member directory',
            variant: 'destructive',
          });
          setMembers([]);
          setFilteredMembers([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllMembers();
    }, 0);
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'dj':
        return <Music className="h-4 w-4" />;
      case 'producer':
        return <Music className="h-4 w-4" />;
      case 'vj':
        return <Video className="h-4 w-4" />;
      case 'visual artist':
        return <Palette className="h-4 w-4" />;
      case 'fan':
        return <Heart className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Show error state if there's an error and no members
  if (error && !isLoading && members.length === 0) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-red-400/50 mx-auto mb-4" />
          <p className="text-white/70 text-lg mb-2">Error Loading Directory</p>
          <p className="text-white/50 text-sm mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              fetchMembers();
            }}
            className="bg-electric-blue hover:bg-electric-blue/80 text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <label className="text-white/80 text-xs mb-1 block font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    type="text"
                    placeholder="Search by name, artist name, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
              <Button
                onClick={handleSearch}
                className="bg-electric-blue hover:bg-electric-blue/80 text-white h-[42px]"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex flex-col">
                <label className="text-white/80 text-xs mb-1 font-medium">Filter by Role</label>
                <Select value={roleFilter || undefined} onValueChange={(value) => setRoleFilter(value || '')}>
                  <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white h-[42px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/20">
                    <SelectItem value="all" className="text-white">All Roles</SelectItem>
                    <SelectItem value="dj" className="text-white">DJ</SelectItem>
                    <SelectItem value="producer" className="text-white">Producer</SelectItem>
                    <SelectItem value="vj" className="text-white">VJ</SelectItem>
                    <SelectItem value="visual_artist" className="text-white">Visual Artist</SelectItem>
                    <SelectItem value="fan" className="text-white">Fan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-white/80 text-xs mb-1 font-medium">Filter by City</label>
                <Input
                  type="text"
                  placeholder="Enter city..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-[180px] bg-white/10 border-white/20 text-white placeholder:text-white/50 h-[42px]"
                />
              </div>

              {(searchQuery || (roleFilter && roleFilter !== 'all') || cityFilter) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-[42px]"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/70">
          <Users className="h-5 w-5" />
          <span>
            {isLoading ? 'Loading...' : `${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''} found`}
          </span>
        </div>
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-2">No members found</p>
            <p className="text-white/50 text-sm">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="bg-black/40 border-white/10 hover:border-electric-blue/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {member.profile_picture ? (
                      <img
                        src={member.profile_picture}
                        alt={member.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-electric-blue/50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-electric-blue/50 flex items-center justify-center">
                        <User className="h-8 w-8 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg mb-1 truncate">
                      {member.full_name}
                    </h3>
                    {member.artist_name && (
                      <p className="text-electric-blue text-sm mb-2 truncate">
                        "{member.artist_name}"
                      </p>
                    )}

                    {/* Location */}
                    {member.city && (
                      <div className="flex items-center gap-1 text-white/60 text-xs mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{member.city}{member.country ? `, ${member.country}` : ''}</span>
                      </div>
                    )}

                    {/* Roles */}
                    {member.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {member.roles.map((role) => (
                          <Badge
                            key={role}
                            className="bg-electric-blue/20 text-electric-blue border-electric-blue/50 text-xs"
                          >
                            {getRoleIcon(role)}
                            <span className="ml-1">{role}</span>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Bio Preview */}
                    {member.bio && (
                      <p className="text-white/70 text-xs line-clamp-2 mb-2">
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {member.social_links && Object.keys(member.social_links).some(key => member.social_links![key]) && (
                      <div className="flex gap-2 mt-2">
                        {member.social_links.instagram && (
                          <a
                            href={member.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-electric-blue transition-colors"
                            title="Instagram"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {member.social_links.soundcloud && (
                          <a
                            href={member.social_links.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-electric-blue transition-colors"
                            title="SoundCloud"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {member.social_links.spotify && (
                          <a
                            href={member.social_links.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-electric-blue transition-colors"
                            title="Spotify"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {member.social_links.website && (
                          <a
                            href={member.social_links.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/50 hover:text-electric-blue transition-colors"
                            title="Website"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Send Message Button */}
                    {onSendMessage && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Button
                          onClick={() => onSendMessage(member.id, member.full_name)}
                          size="sm"
                          className="w-full bg-electric-blue hover:bg-electric-blue/80 text-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberDirectory;

