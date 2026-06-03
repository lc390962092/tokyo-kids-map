export type Playdate = {
  id: string;
  user_id: string;
  place_id: string | null;
  title: string;
  description: string | null;
  meet_at: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  max_participants: number;
  status: "active" | "cancelled" | "completed";
  created_at: string;
};

export type PlaydateResponse = {
  id: string;
  playdate_id: string;
  user_id: string;
  message: string | null;
  status: "going" | "cancelled";
  created_at: string;
};

export type PlaydateWithResponses = Playdate & {
  responses: PlaydateResponse[];
};
