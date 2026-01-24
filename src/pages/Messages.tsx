import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, User, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import ChatImageUploader from "@/components/chat/ChatImageUploader";
import TypingIndicator from "@/components/chat/TypingIndicator";
import AudioPlayer from "@/components/chat/AudioPlayer";
import ChatImage from "@/components/chat/ChatImage";

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
  message_type: string;
  media_url: string | null;
  media_duration: number | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get("user");
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(selectedUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation && user) {
      loadMessages(activeConversation);
      markAsRead(activeConversation);
      loadParticipantName(activeConversation);
    }
  }, [activeConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === activeConversation) {
            setMessages(prev => [...prev, newMsg]);
            markAsRead(activeConversation!);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversation]);

  // Realtime subscription for typing indicators
  useEffect(() => {
    if (!user || !activeConversation) return;

    const channel = supabase
      .channel('typing-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_partner_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new?.user_id === activeConversation) {
            setPartnerTyping(payload.new?.is_typing || false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversation]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول لعرض الرسائل",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const updateTypingStatus = useCallback(async (typing: boolean) => {
    if (!user || !activeConversation) return;

    try {
      await supabase.from("typing_indicators").upsert({
        user_id: user.id,
        conversation_partner_id: activeConversation,
        is_typing: typing,
        last_typed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }, [user, activeConversation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data: allMessages, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name),
          recipient:profiles!messages_recipient_id_fkey(full_name)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationsMap = new Map<string, Conversation>();
      
      allMessages?.forEach((msg: any) => {
        const isReceived = msg.recipient_id === user.id;
        const partnerId = isReceived ? msg.sender_id : msg.recipient_id;
        const partnerName = isReceived ? msg.sender?.full_name : msg.recipient?.full_name;
        
        let lastMessagePreview = msg.content;
        if (msg.message_type === "image") {
          lastMessagePreview = "📷 صورة";
        } else if (msg.message_type === "audio") {
          lastMessagePreview = "🎤 رسالة صوتية";
        }
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId,
            participant_id: partnerId,
            participant_name: partnerName || "مستخدم",
            last_message: lastMessagePreview,
            last_message_at: msg.created_at,
            unread_count: isReceived && !msg.is_read ? 1 : 0,
          });
        } else if (isReceived && !msg.is_read) {
          const conv = conversationsMap.get(partnerId)!;
          conv.unread_count++;
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (partnerId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadParticipantName = async (partnerId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", partnerId)
      .maybeSingle();
    
    setParticipantName(data?.full_name || "مستخدم");
  };

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", senderId)
      .eq("recipient_id", user.id);
  };

  const sendMessage = async (type: string = "text", content?: string, mediaUrl?: string, duration?: number) => {
    const messageContent = content || newMessage.trim();
    if ((!messageContent && type === "text") || !activeConversation || !user) return;
    
    setSending(true);
    updateTypingStatus(false);
    
    try {
      const messageData: any = {
        sender_id: user.id,
        recipient_id: activeConversation,
        content: messageContent || "",
        message_type: type,
      };

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
      }
      if (duration) {
        messageData.media_duration = duration;
      }

      const { error } = await supabase.from("messages").insert(messageData);

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: messageContent || "",
        sender_id: user.id,
        recipient_id: activeConversation,
        is_read: false,
        created_at: new Date().toISOString(),
        message_type: type,
        media_url: mediaUrl || null,
        media_duration: duration || null,
      }]);
      
      setNewMessage("");
      loadConversations();

      // Send notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "new_message",
            recipientId: activeConversation,
            title: "رسالة جديدة",
            message: type === "text" ? messageContent : (type === "image" ? "صورة جديدة" : "رسالة صوتية"),
            link: `/messages?user=${user.id}`,
            sendEmail: true,
          },
        });
      } catch (e) {
        // Don't fail if notification fails
        console.log("Notification not sent:", e);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    sendMessage("image", "", imageUrl);
  };

  const handleVoiceRecording = (audioUrl: string, duration: number) => {
    sendMessage("audio", "", audioUrl, duration);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "أمس";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("ar-MA", { weekday: "long" });
    }
    return date.toLocaleDateString("ar-MA");
  };

  const renderMessageContent = (msg: Message) => {
    const isSent = msg.sender_id === user?.id;

    switch (msg.message_type) {
      case "image":
        return (
          <div className="space-y-1">
            {msg.media_url && <ChatImage src={msg.media_url} isSent={isSent} />}
            {msg.content && <p className="text-sm">{msg.content}</p>}
          </div>
        );
      case "audio":
        return msg.media_url ? (
          <AudioPlayer src={msg.media_url} duration={msg.media_duration || undefined} isSent={isSent} />
        ) : null;
      default:
        return <p className="text-sm">{msg.content}</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">الرسائل</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1 animate-scale-in">
              <CardHeader>
                <CardTitle className="text-lg">المحادثات</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      لا توجد محادثات
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversation(conv.participant_id)}
                          className={`w-full p-4 text-right hover:bg-muted/50 transition-colors ${
                            activeConversation === conv.participant_id ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <User className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold truncate">
                                  {conv.participant_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(conv.last_message_at)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate">
                                  {conv.last_message}
                                </p>
                                {conv.unread_count > 0 && (
                                  <Badge className="bg-primary text-primary-foreground text-xs">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 animate-scale-in" style={{ animationDelay: "0.1s" }}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{participantName}</CardTitle>
                        {partnerTyping && (
                          <span className="text-xs text-muted-foreground">يكتب...</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="p-0">
                    <ScrollArea className="h-[350px] p-4">
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_id === user?.id ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                msg.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : "bg-muted rounded-bl-none"
                              }`}
                            >
                              {renderMessageContent(msg)}
                              <span className={`text-xs block mt-1 ${msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <TypingIndicator isVisible={partnerTyping} userName={participantName} />
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-center gap-2">
                        <ChatImageUploader onImageUpload={handleImageUpload} disabled={sending} />
                        <VoiceRecorder onRecordingComplete={handleVoiceRecording} disabled={sending} />
                        <Input
                          value={newMessage}
                          onChange={handleInputChange}
                          placeholder="اكتب رسالتك..."
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          disabled={sending}
                          className="flex-1"
                        />
                        <Button onClick={() => sendMessage()} disabled={sending || !newMessage.trim()}>
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="h-[500px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">اختر محادثة للبدء</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Messages;
