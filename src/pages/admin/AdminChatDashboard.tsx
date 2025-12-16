import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Star, User, AlertTriangle, Eye, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Conversation {
  id: string;
  user_display_name: string | null;
  started_at: string | null;
  last_message: string | null;
  summary: string | null;
}

interface ChatMessage {
  id: string;
  session_id: string | null;
  role: string | null;
  content: string | null;
  created_at: string | null;
  metadata: any;
}

const AdminChatDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setConversations(data || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const viewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract rating from metadata if available
  const getRating = (conversation: Conversation): number | null => {
    // Check if summary contains rating info (stored as JSON)
    if (conversation.summary) {
      try {
        const data = JSON.parse(conversation.summary);
        return data.rating || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getFeedback = (conversation: Conversation): string | null => {
    if (conversation.summary) {
      try {
        const data = JSON.parse(conversation.summary);
        return data.feedback || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const totalConversations = conversations.length;
  const ratedConversations = conversations.filter(c => getRating(c) !== null);
  const averageRating = ratedConversations.length > 0
    ? (ratedConversations.reduce((sum, c) => sum + (getRating(c) || 0), 0) / ratedConversations.length).toFixed(1)
    : '-';
  const lowRatings = conversations.filter(c => {
    const rating = getRating(c);
    return rating !== null && rating <= 2;
  }).length;
  const todayConversations = conversations.filter(c => {
    if (!c.started_at) return false;
    const today = new Date();
    const convDate = new Date(c.started_at);
    return convDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat Analytics Dashboard</h1>
        <Button onClick={fetchConversations} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              All time user chats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              {ratedConversations.length} rated conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowRatings}</div>
            <p className="text-xs text-muted-foreground">
              Ratings 2 or below
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayConversations}</div>
            <p className="text-xs text-muted-foreground">
              Conversations today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Recent Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground">
                User conversations will appear here when visitors use the chat feature.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => {
                  const rating = getRating(conv);
                  return (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {conv.user_display_name || 'Anonymous'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(conv.started_at)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm text-muted-foreground">
                          {conv.last_message || 'No messages'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rating ? (
                          <Badge variant={rating >= 4 ? 'default' : rating >= 3 ? 'secondary' : 'destructive'}>
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {rating}/5
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not rated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewConversation(conv)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversation with {selectedConversation?.user_display_name || 'Anonymous'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User Info */}
            {selectedConversation && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{' '}
                    {selectedConversation.user_display_name || 'Anonymous'}
                  </div>
                  <div>
                    <span className="font-medium">Started:</span>{' '}
                    {formatDate(selectedConversation.started_at)}
                  </div>
                  <div>
                    <span className="font-medium">Rating:</span>{' '}
                    {getRating(selectedConversation) ? `${getRating(selectedConversation)}/5` : 'Not rated'}
                  </div>
                </div>
                {getFeedback(selectedConversation) && (
                  <div className="mt-2">
                    <span className="font-medium">Feedback:</span>{' '}
                    {getFeedback(selectedConversation)}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="space-y-3">
              {loadingMessages ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No messages found</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                          {msg.role === 'user' ? 'User' : 'AI Assistant'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChatDashboard;