import { useState, useEffect } from 'react';
import { Search, X, Check, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Member {
  id: number;
  full_name: string;
  artist_name?: string;
  profile_picture?: string;
}

interface RecipientSelectorProps {
  selectedRecipients: number[];
  onRecipientsChange: (recipientIds: number[]) => void;
  prefillRecipientId?: number;
  prefillRecipientName?: string;
}

const RecipientSelector = ({ 
  selectedRecipients, 
  onRecipientsChange,
  prefillRecipientId,
  prefillRecipientName 
}: RecipientSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMembersData, setSelectedMembersData] = useState<Member[]>([]);

  useEffect(() => {
    if (prefillRecipientId && prefillRecipientName && !selectedRecipients.includes(prefillRecipientId)) {
      onRecipientsChange([prefillRecipientId]);
      setSelectedMembersData([{
        id: prefillRecipientId,
        full_name: prefillRecipientName,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillRecipientId, prefillRecipientName]);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // Update selected members data when selectedRecipients change
    if (selectedRecipients.length > 0 && members.length > 0) {
      const selected = members.filter(m => selectedRecipients.includes(m.id));
      setSelectedMembersData(selected);
    } else if (selectedRecipients.length === 0) {
      setSelectedMembersData([]);
    }
  }, [selectedRecipients, members]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/members-directory.php', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.full_name.toLowerCase().includes(query) ||
      member.artist_name?.toLowerCase().includes(query)
    );
  });

  const toggleRecipient = (memberId: number) => {
    if (selectedRecipients.includes(memberId)) {
      onRecipientsChange(selectedRecipients.filter(id => id !== memberId));
    } else {
      onRecipientsChange([...selectedRecipients, memberId]);
    }
  };

  const selectAll = () => {
    const allIds = members.map(m => m.id);
    onRecipientsChange(allIds);
  };

  const clearAll = () => {
    onRecipientsChange([]);
  };

  const removeRecipient = (memberId: number) => {
    onRecipientsChange(selectedRecipients.filter(id => id !== memberId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedRecipients.length === 0
                  ? 'Select recipients...'
                  : selectedRecipients.length === 1
                  ? selectedMembersData[0]?.full_name || '1 recipient'
                  : `${selectedRecipients.length} recipients`}
              </span>
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-black/95 border-white/20" align="start">
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search members..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="text-white border-white/20"
            />
            <CommandList>
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup>
                <div className="px-2 py-1 border-b border-white/10 flex items-center justify-between">
                  <span className="text-white/70 text-xs">Actions</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAll}
                      className="h-6 px-2 text-xs text-white hover:bg-white/10"
                      title="Select all members"
                    >
                      Select All
                    </Button>
                    {selectedRecipients.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearAll}
                        className="h-6 px-2 text-xs text-white hover:bg-white/10"
                        title="Clear selection"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                {filteredMembers.map((member) => {
                  const isSelected = selectedRecipients.includes(member.id);
                  return (
                    <CommandItem
                      key={member.id}
                      value={member.full_name}
                      onSelect={() => toggleRecipient(member.id)}
                      className={cn(
                        "cursor-pointer text-white hover:bg-white/10",
                        isSelected && "bg-electric-blue/20"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {member.profile_picture ? (
                          <img
                            src={member.profile_picture}
                            alt={member.full_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-white/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{member.full_name}</div>
                          {member.artist_name && (
                            <div className="text-xs text-electric-blue truncate">
                              "{member.artist_name}"
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Recipients Chips */}
      {selectedMembersData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembersData.map((member) => (
            <Badge
              key={member.id}
              variant="secondary"
              className="bg-electric-blue/20 text-electric-blue border-electric-blue/50 flex items-center gap-1 pr-1"
            >
              <span className="truncate max-w-[150px]">
                {member.full_name}
                {member.artist_name && ` "${member.artist_name}"`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-electric-blue/30 rounded-full"
                onClick={() => removeRecipient(member.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipientSelector;

