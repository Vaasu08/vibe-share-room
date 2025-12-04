import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Copy,
  Users,
  Music,
  LogOut,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

const Room = () => {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isHost = searchParams.get("host") === "true";
  
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", user: "System", text: "Welcome to the room! 🎵", timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: isHost ? "You (Host)" : "You", isSpeaking: false, isMuted: false },
  ]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [volume, setVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const [currentTrack, setCurrentTrack] = useState({
    title: "No track playing",
    artist: "Upload a track to start",
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, duration));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      user: "You",
      text: newMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(code || "");
    toast.success("Room code copied!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentTrack({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local file",
      });
      setCurrentTime(0);
      setIsPlaying(false);
      toast.success("Track uploaded! Press play to start.");
    }
  };

  const leaveRoom = () => {
    navigate("/");
    toast.info("You left the room");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between glass">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-foreground">Music Rooms</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <span className="font-mono text-sm tracking-wider text-foreground">{code}</span>
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <Button variant="ghost" size="sm" onClick={leaveRoom}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </header>

        {/* Music Player */}
        <div className="p-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-6">
              {/* Album Art Placeholder */}
              <div className="w-24 h-24 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Music className="w-10 h-10 text-primary-foreground" />
              </div>
              
              {/* Track Info & Controls */}
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold text-foreground truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-muted-foreground">{currentTrack.artist}</p>
                
                {/* Progress Bar */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-12">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                {isHost && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="glass"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5" />
                    </Button>
                  </>
                )}
                
                <Button
                  variant={isPlaying ? "secondary" : "hero"}
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={!isHost}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </Button>
                
                {isHost && (
                  <Button variant="glass" size="icon">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                )}
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center gap-2 pl-4 border-l border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-24 h-1 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col p-6 pt-0">
          <div className="glass-card flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.user === "You" && "flex-row-reverse"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-foreground">
                      {msg.user[0]}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[70%] px-4 py-2 rounded-2xl",
                      msg.user === "You"
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : msg.user === "System"
                        ? "bg-secondary/50 text-muted-foreground"
                        : "bg-secondary text-foreground rounded-tl-md"
                    )}
                  >
                    {msg.user !== "You" && msg.user !== "System" && (
                      <p className="text-xs font-medium mb-1 opacity-70">{msg.user}</p>
                    )}
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Button
                  variant={isMicMuted ? "secondary" : "hero"}
                  size="icon"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                >
                  {isMicMuted ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Participants */}
      <aside className="w-72 border-l border-border glass p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            Participants ({participants.length})
          </h3>
        </div>
        
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                participant.isSpeaking ? "bg-primary/10" : "bg-secondary/50"
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="font-medium text-foreground">
                    {participant.name[0]}
                  </span>
                </div>
                {participant.isSpeaking && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {participant.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {participant.isMuted ? "Muted" : "Listening"}
                </p>
              </div>
              {participant.isMuted && (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Share room code: <span className="font-mono text-primary">{code}</span>
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Room;
