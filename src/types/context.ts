export interface User {
  id: number;
  email: string;
}

export interface Context {
  userId?: number;
  user?: User;
}
