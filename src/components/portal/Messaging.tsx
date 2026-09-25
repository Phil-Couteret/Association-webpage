import { useState, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import RecipientSelector from '@/components/portal/RecipientSelector';

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject: string | null;
  message: string;
  parent_message_id: number | null;
  is_read: boolean;
  created_at: string;
  is_from_me: boolean;
}

interface Thread {
  thread_id: number;
  other_member_id: number;
  other_member_name: string;
  other_member_artist_name: string | null;
  other_member_profile_picture: string | null;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

interface MessagingProps {
  prefillRecipientId?: number;
  prefillRecipientName?: string;
}

const Messaging = ({ prefillRecipientId, prefillRecipientName }: MessagingProps) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>(prefillRecipientId ? [prefillRecipientId] : []);
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (prefillRecipientId && !selectedRecipients.includes(prefillRecipientId)) {
      setSelectedRecipients([prefillRecipientId]);
    }
  }, [prefillRecipientId]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messages-list.php', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      if (data.success) {
        setThreads(data.threads || []);
        // Auto-expand first thread if there are threads
        if (data.threads && data.threads.length > 0 && expandedThreads.size === 0) {
          setExpandedThreads(new Set([data.threads[0].thread_id]));
        }
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (selectedRecipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one recipient',
        variant: 'destructive',
      });
      return;
    }

    if (!newMessageContent.trim()) {
      toast({
        title: 'Error',
        description: 'Message content is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Send message to each recipient
      const sendPromises = selectedRecipients.map(recipientId =>
        fetch('/api/messages-send.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            recipient_id: recipientId,
            subject: newMessageSubject || null,
            message: newMessageContent,
          }),
        })
      );

      const responses = await Promise.all(sendPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const failed = results.filter(r => !r.success);
      const succeeded = results.filter(r => r.success);

      if (failed.length > 0) {
        throw new Error(`Failed to send to ${failed.length} recipient(s)`);
      }

      toast({
        title: 'Success',
        description: `Message sent successfully to ${succeeded.length} recipient(s)`,
      });
      setNewMessageContent('');
      setNewMessageSubject('');
      setSelectedRecipients([]);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleThread = (threadId: number) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Threads */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-electric-blue" />
            Messages ({threads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-2">No messages yet</p>
              <p className="text-white/50 text-sm">
                Start a conversation by sending a message from the Directory tab
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <Collapsible
                  key={thread.thread_id}
                  open={expandedThreads.has(thread.thread_id)}
                  onOpenChange={() => toggleThread(thread.thread_id)}
                >
                  <Card className="bg-black/20 border-white/10">
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {thread.other_member_profile_picture ? (
                              <img
                                src={thread.other_member_profile_picture}
                                alt={thread.other_member_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-electric-blue/50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-electric-blue/50 flex items-center justify-center">
                                <User className="h-6 w-6 text-white/30" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-semibold truncate">
                                  {thread.other_member_name}
                                </h3>
                                {thread.other_member_artist_name && (
                                  <span className="text-electric-blue text-sm truncate">
                                    "{thread.other_member_artist_name}"
                                  </span>
                                )}
                                {thread.unread_count > 0 && (
                                  <Badge className="bg-electric-blue text-white">
                                    {thread.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-white/60 text-xs truncate">
                                {thread.messages[thread.messages.length - 1]?.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-white/50 text-xs">
                              {formatDate(thread.last_message_at)}
                            </span>
                            {expandedThreads.has(thread.thread_id) ? (
                              <ChevronUp className="h-5 w-5 text-white/50" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-white/50" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {thread.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.is_from_me
                                ? 'bg-electric-blue/20 ml-8'
                                : 'bg-white/5 mr-8'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className={`text-sm font-medium ${
                                message.is_from_me ? 'text-electric-blue' : 'text-white'
                              }`}>
                                {message.is_from_me ? 'You' : thread.other_member_name}
                              </span>
                              <span className="text-white/50 text-xs">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                            {message.subject && (
                              <p className="text-white/70 text-sm font-semibold mb-1">
                                {message.subject}
                              </p>
                            )}
                            <p className="text-white/80 text-sm whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose New Message */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-electric-blue" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white/80 text-sm mb-2 block">To</Label>
            <RecipientSelector
              selectedRecipients={selectedRecipients}
              onRecipientsChange={setSelectedRecipients}
              prefillRecipientId={prefillRecipientId}
              prefillRecipientName={prefillRecipientName}
            />
            <p className="text-white/50 text-xs mt-1">
              Search and select one or more members. You can also select from Directory tab.
            </p>
          </div>
          <div>
            <Label className="text-white/80 text-sm mb-2 block">Subject (optional)</Label>
            <Input
              type="text"
              placeholder="Message subject..."
              value={newMessageSubject}
              onChange={(e) => setNewMessageSubject(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div>
            <Label className="text-white/80 text-sm mb-2 block">Message</Label>
            <Textarea
              placeholder="Type your message here..."
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={selectedRecipients.length === 0 || !newMessageContent.trim() || isSending}
            className="bg-electric-blue hover:bg-electric-blue/80 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending 
              ? `Sending to ${selectedRecipients.length} recipient(s)...` 
              : `Send to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messaging;

