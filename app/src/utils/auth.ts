import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

const MERGE_SECRET = process.env.MERGE_TOKEN_SECRET ?? JWT_SECRET;

export interface MergeTokenPayload {
  userId: number;
  provider: string;
  providerUserId: string;
  providerEmail: string;
  firstName: string | null;
  lastName: string | null;
}

export function generateMergeToken(data: MergeTokenPayload): string {
  return jwt.sign(data, MERGE_SECRET, { expiresIn: "5m" });
}

export function verifyMergeToken(token: string): MergeTokenPayload | null {
  try {
    return jwt.verify(token, MERGE_SECRET) as MergeTokenPayload;
  } catch {
    return null;
  }
}
