export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  orgId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  orgId: string | null;
}
