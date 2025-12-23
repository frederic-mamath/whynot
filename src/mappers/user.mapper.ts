import { UsersTable } from '../db/types';
import { UserOutboundDto, UserInboundDto } from '../types/dto/user.dto';

export function mapUserToUserOutboundDto(user: UsersTable): UserOutboundDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstname,
    lastName: user.lastname,
    isVerified: user.is_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function mapCreateUserInboundDtoToUser(dto: UserInboundDto, hashedPassword: string): Omit<UsersTable, 'id' | 'is_verified' | 'created_at' | 'updated_at'> {
  return {
    email: dto.email,
    password: hashedPassword,
    firstname: dto.firstName ?? null,
    lastname: dto.lastName ?? null,
  };
}
