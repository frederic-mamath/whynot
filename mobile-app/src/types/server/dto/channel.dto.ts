export interface ChannelOutboundDto {
  id: number;
  name: string;
  hostId: number;
  status: string;
  maxParticipants: number | null;
  isPrivate: boolean;
  createdAt: Date;
  endedAt: Date | null;
}

export interface ChannelInboundDto {
  name: string;
  maxParticipants?: number;
  isPrivate?: boolean;
}
