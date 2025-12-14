import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "@/hooks/useRoom";

const Room = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    room,
    participants,
    messages,
    loading,
    userId,
    isHost,
    sendMessage,
    leaveRoom,
    updateMuteStatus,
    updatePlaybackState,
    updateCurrentTrack,
  } = useRoom(code);

  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [volume, setVolume] = useState(75);
  const [duration] = useState(180);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPlaying = room?.playback_state?.isPlaying ?? false;
  const currentTime = room?.playback_state?.currentTime ?? 0;
  const currentTrack = room?.current_track || "No track playing";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle mic mute updates
  useEffect(() => {
    updateMuteStatus(isMicMuted);
  }, [isMicMuted, updateMuteStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(code || "");
    toast.success("Room code copied!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const trackName = file.name.replace(/\.[^/.]+$/, "");
      await updateCurrentTrack(trackName);
      toast.success("Track uploaded! Press play to start.");
    }
  };

  const handlePlayPause = async () => {
    if (!isHost) return;
    await updatePlaybackState(!isPlaying, currentTime);
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    navigate("/");
    toast.info("You left the room");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            Room not found
          </h2>
          <p className="text-muted-foreground mb-6">
            This room doesn't exist or has been closed.
          </p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Find current user in participants
  const currentUserParticipant = participants.find((p) => p.user_id === userId);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between glass">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-foreground">
                Music Rooms
              </span>
            </div>
            <div className="h-6 w-px bg-border" />
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <span className="font-mono text-sm tracking-wider text-foreground">
                {code}
              </span>
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
            {isHost && (
              <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium">
                Host
              </span>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
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
                  {currentTrack}
                </h2>
                <p className="text-muted-foreground">
                  {room.current_track ? "Now playing" : "Upload a track to start"}
                </p>

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
                  onClick={handlePlayPause}
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
              {/* System welcome message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-foreground">S</span>
                </div>
                <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-secondary/50 text-muted-foreground">
                  <p className="text-sm">Welcome to the room! 🎵</p>
                </div>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.sender_id === userId && "flex-row-reverse"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-foreground">
                      {msg.sender_name[0]}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[70%] px-4 py-2 rounded-2xl",
                      msg.sender_id === userId
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-secondary text-foreground rounded-tl-md"
                    )}
                  >
                    {msg.sender_id !== userId && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
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
                participant.user_id === userId
                  ? "bg-primary/10"
                  : "bg-secondary/50"
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="font-medium text-foreground">
                    {participant.nickname[0]}
                  </span>
                </div>
                {participant.user_id === room.host_id && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[8px] text-primary-foreground font-bold">
                      H
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {participant.nickname}
                  {participant.user_id === userId && " (You)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {participant.is_muted ? "Muted" : "Listening"}
                </p>
              </div>
              {participant.is_muted && (
                <MicOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Share room code:{" "}
            <span className="font-mono text-primary">{code}</span>
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Room;
