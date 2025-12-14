-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_track TEXT,
  playback_state JSONB DEFAULT '{"isPlaying": false, "currentTime": 0}'::jsonb
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Rooms are public (anyone with code can join)
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Host can update room" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Host can delete room" ON public.rooms FOR DELETE USING (true);

-- Participants policies (public room access)
CREATE POLICY "Participants are viewable by everyone" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join as participant" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update themselves" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Participants can leave" ON public.participants FOR DELETE USING (true);

-- Messages policies (public room access)
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create index for faster queries
CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_participants_room_id ON public.participants(room_id);
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);