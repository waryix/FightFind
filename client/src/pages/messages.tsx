import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect as useAuthEffect } from "react";

export default function Messages() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Redirect if not authenticated
  useAuthEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch messages for selected connection
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/connections", selectedConnection, "messages"],
    enabled: !!selectedConnection,
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      if (!selectedConnection) throw new Error("No connection selected");
      return apiRequest("POST", `/api/connections/${selectedConnection}/messages`, messageData);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/connections", selectedConnection, "messages"] });
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate({ content: messageText.trim() });
  };

  if (isLoading || connectionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const acceptedConnections = (connections as any[]).filter((conn: any) => conn.status === "accepted");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Messages</h1>
          <p className="text-slate-300">Chat with your sparring partners</p>
        </div>

        {acceptedConnections.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Conversations</h3>
              <p className="text-slate-400 mb-4">
                You don't have any accepted connections yet. Find sparring partners to start chatting!
              </p>
              <Button onClick={() => window.location.href = "/partners"}>
                Find Partners
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[480px]">
                  <div className="space-y-2">
                    {acceptedConnections.map((connection: any) => (
                      <div
                        key={connection.id}
                        onClick={() => setSelectedConnection(connection.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConnection === connection.id
                            ? "bg-purple-600/20 border-purple-500"
                            : "bg-slate-700/50 hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={connection.partner?.profileImageUrl} />
                            <AvatarFallback className="bg-purple-600">
                              {connection.partner?.firstName?.[0]}{connection.partner?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {connection.partner?.firstName} {connection.partner?.lastName}
                            </p>
                            <p className="text-slate-400 text-sm truncate">
                              {connection.fighterProfile?.discipline} • {connection.fighterProfile?.experienceLevel}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                            Connected
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              {selectedConnection ? (
                <>
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white">
                      {acceptedConnections.find((c: any) => c.id === selectedConnection)?.partner?.firstName}{" "}
                      {acceptedConnections.find((c: any) => c.id === selectedConnection)?.partner?.lastName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] p-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-slate-400 mt-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(messages as any[]).map((message: any) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderId === user?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  message.senderId === user?.id
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-700 text-slate-100"
                                }`}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-4 border-t border-slate-700">
                      <div className="flex space-x-2">
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 bg-slate-700 border-slate-600 text-white"
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}