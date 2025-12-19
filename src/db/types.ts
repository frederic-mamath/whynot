import { Kysely } from 'kysely';

export interface Database {
  users: UsersTable;
  channels: ChannelsTable;
  channel_participants: ChannelParticipantsTable;
}

export interface UsersTable {
  id: Generated<number>;
  email: string;
  password: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelsTable {
  id: Generated<number>;
  name: string;
  host_id: number;
  status: string;
  max_participants: number | null;
  is_private: boolean | null;
  created_at: Date;
  ended_at: Date | null;
}

export interface ChannelParticipantsTable {
  id: Generated<number>;
  channel_id: number;
  user_id: number;
  joined_at: Date;
  left_at: Date | null;
  role: string;
}

// Import Generated type
import { Generated } from 'kysely';
