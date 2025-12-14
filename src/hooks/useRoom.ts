import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Room {
  id: string;
  code: string;
  host_id: string;
  is_active: boolean;
  current_track: string | null;
  playback_state: {
    isPlaying: boolean;
    currentTime: number;
  };
}

interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  is_muted: boolean;
  joined_at: string;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

// Generate a simple user ID for this session
const getUserId = () => {
  let userId = localStorage.getItem("music_rooms_user_id");
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("music_rooms_user_id", userId);
  }
  return userId;
};

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useRoom = (roomCode?: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState(getUserId);
  const [nickname, setNickname] = useState(`Guest${Math.floor(Math.random() * 1000)}`);

  const isHost = room?.host_id === userId;

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    if (!roomCode) return null;

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching room:", error);
      return null;
    }

    if (data) {
      const typedRoom: Room = {
        ...data,
        playback_state: (data.playback_state as Room["playback_state"]) || {
          isPlaying: false,
          currentTime: 0,
        },
      };
      setRoom(typedRoom);
      return typedRoom;
    }
    return null;
  }, [roomCode]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!room?.id) return;

    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching participants:", error);
      return;
    }

    setParticipants(data || []);
  }, [room?.id]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!room?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  }, [room?.id]);

  // Create a new room
  const createRoom = useCallback(async () => {
    const code = generateRoomCode();

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        host_id: userId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create room");
      return null;
    }

    return data.code;
  }, [userId]);

  // Join room as participant
  const joinRoom = useCallback(async () => {
    if (!room?.id) return false;

    // Check if already in room
    const { data: existing } = await supabase
      .from("participants")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Update existing participant
      await supabase
        .from("participants")
        .update({ nickname })
        .eq("id", existing.id);
      return true;
    }

    const { error } = await supabase.from("participants").insert({
      room_id: room.id,
      user_id: userId,
      nickname: isHost ? `${nickname} (Host)` : nickname,
      is_muted: true,
    });

    if (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
      return false;
    }

    return true;
  }, [room?.id, userId, nickname, isHost]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!room?.id) return;

    await supabase
      .from("participants")
      .delete()
      .eq("room_id", room.id)
      .eq("user_id", userId);
  }, [room?.id, userId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!room?.id || !content.trim()) return;

      const { error } = await supabase.from("messages").insert({
        room_id: room.id,
        sender_id: userId,
        sender_name: isHost ? `${nickname} (Host)` : nickname,
        content: content.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      }
    },
    [room?.id, userId, nickname, isHost]
  );

  // Update mute status
  const updateMuteStatus = useCallback(
    async (isMuted: boolean) => {
      if (!room?.id) return;

      await supabase
        .from("participants")
        .update({ is_muted: isMuted })
        .eq("room_id", room.id)
        .eq("user_id", userId);
    },
    [room?.id, userId]
  );

  // Update playback state (host only)
  const updatePlaybackState = useCallback(
    async (isPlaying: boolean, currentTime: number) => {
      if (!room?.id || !isHost) return;

      await supabase
        .from("rooms")
        .update({
          playback_state: { isPlaying, currentTime },
        })
        .eq("id", room.id);
    },
    [room?.id, isHost]
  );

  // Update current track (host only)
  const updateCurrentTrack = useCallback(
    async (trackName: string) => {
      if (!room?.id || !isHost) return;

      await supabase
        .from("rooms")
        .update({
          current_track: trackName,
          playback_state: { isPlaying: false, currentTime: 0 },
        })
        .eq("id", room.id);
    },
    [room?.id, isHost]
  );

  // Initial data fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const roomData = await fetchRoom();
      if (roomData) {
        await fetchParticipants();
        await fetchMessages();
        await joinRoom();
      }
      setLoading(false);
    };

    if (roomCode) {
      init();
    }

    return () => {
      if (roomCode) {
        leaveRoom();
      }
    };
  }, [roomCode]);

  // Refetch when room changes
  useEffect(() => {
    if (room?.id) {
      fetchParticipants();
      fetchMessages();
    }
  }, [room?.id, fetchParticipants, fetchMessages]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setParticipants((prev) => [...prev, payload.new as Participant]);
            if ((payload.new as Participant).user_id !== userId) {
              toast.info(`${(payload.new as Participant).nickname} joined the room`);
            }
          } else if (payload.eventType === "DELETE") {
            setParticipants((prev) =>
              prev.filter((p) => p.id !== (payload.old as Participant).id)
            );
          } else if (payload.eventType === "UPDATE") {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Participant).id
                  ? (payload.new as Participant)
                  : p
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updatedRoom = payload.new as Room;
          setRoom({
            ...updatedRoom,
            playback_state: (updatedRoom.playback_state as Room["playback_state"]) || {
              isPlaying: false,
              currentTime: 0,
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, userId]);

  return {
    room,
    participants,
    messages,
    loading,
    userId,
    nickname,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateMuteStatus,
    updatePlaybackState,
    updateCurrentTrack,
    setNickname,
  };
};
