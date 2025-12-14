import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, MessageCircle, Phone, User, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  conversation_id: string;
  user_name: string;
  user_phone: string;
  rating: number;
  feedback: string;
  completed_at: string;
  messages: any[];
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  response: string;
  created_at: string;
  properties_found: number;
}

const AdminChatDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleViewConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.conversation_id);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesRating = filterRating === 'all' || conv.rating?.toString() === filterRating;
    const matchesSearch = !searchTerm ||
      conv.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user_phone?.includes(searchTerm) ||
      conv.feedback?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRating && matchesSearch;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getAverageRating = () => {
    const ratedConversations = conversations.filter(c => c.rating);
    if (ratedConversations.length === 0) return 0;
    const sum = ratedConversations.reduce((acc, c) => acc + c.rating, 0);
    return (sum / ratedConversations.length).toFixed(1);
  };

  const getSatisfactionRate = () => {
    const ratedConversations = conversations.filter(c => c.rating);
    if (ratedConversations.length === 0) return 0;
    const satisfied = ratedConversations.filter(c => c.rating >= 4).length;
    return ((satisfied / ratedConversations.length) * 100).toFixed(1);
  };

  const getLowRatedConversations = () => {
    return conversations.filter(c => c.rating && c.rating <= 2);
  };

  const getCommonIssues = () => {
    const issues = conversations
      .filter(c => c.feedback)
      .map(c => c.feedback.toLowerCase())
      .join(' ');

    const issueKeywords = ['slow', 'error', 'problem', 'issue', 'wrong', 'not working', 'confusing', 'difficult'];
    const foundIssues: { [key: string]: number } = {};

    issueKeywords.forEach(keyword => {
      const count = (issues.match(new RegExp(keyword, 'g')) || []).length;
      if (count > 0) {
        foundIssues[keyword] = count;
      }
    });

    return Object.entries(foundIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getLowRatingCount = () => {
    return conversations.filter(c => c.rating && c.rating <= 2).length;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

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
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              All time conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating()}/5</div>
            <p className="text-xs text-muted-foreground">
              {getSatisfactionRate()}% satisfaction rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getLowRatingCount()}</div>
            <p className="text-xs text-muted-foreground">
              Ratings 2 or below
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c =>
                new Date(c.completed_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Conversations today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issues Analysis */}
      {getCommonIssues().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Common Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getCommonIssues().map(([issue, count]) => (
                <div key={issue} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{issue.replace('_', ' ')}</span>
                  <Badge variant="secondary">{count} mentions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating()} ⭐</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings (≤2)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getLowRatingCount()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.length > 0
                ? Math.round((conversations.filter(c => c.rating).length / conversations.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by name, phone, or feedback..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conversation) => (
                <TableRow key={conversation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {conversation.user_name || 'Anonymous'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {conversation.user_phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    {conversation.rating ? (
                      <Badge className={getRatingColor(conversation.rating)}>
                        {conversation.rating} ⭐
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not rated</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(conversation.completed_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewConversation(conversation)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Conversation with {conversation.user_name || 'Anonymous'}
                          </DialogTitle>
                        </DialogHeader>
                        {selectedConversation && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Phone:</strong> {conversation.user_phone}
                              </div>
                              <div>
                                <strong>Rating:</strong> {conversation.rating || 'Not rated'} ⭐
                              </div>
                              <div>
                                <strong>Date:</strong> {format(new Date(conversation.completed_at), 'PPP p')}
                              </div>
                              <div>
                                <strong>Messages:</strong> {messages.length}
                              </div>
                            </div>

                            {conversation.feedback && (
                              <div>
                                <strong>Feedback:</strong>
                                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{conversation.feedback}</p>
                              </div>
                            )}

                            <div>
                              <strong>Conversation:</strong>
                              <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                                {messages.map((msg) => (
                                  <div key={msg.id} className="border rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-1">
                                      {format(new Date(msg.created_at), 'HH:mm:ss')}
                                    </div>
                                    <div className="font-medium text-blue-600">User: {msg.message}</div>
                                    <div className="mt-2 text-gray-700">Assistant: {msg.response}</div>
                                    {msg.properties_found > 0 && (
                                      <div className="text-xs text-green-600 mt-1">
                                        Found {msg.properties_found} properties
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatDashboard;