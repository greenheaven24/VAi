export interface User {
  id: number;
  email: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}
