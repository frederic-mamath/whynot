export interface UserOutboundDto {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInboundDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
