export interface UserPushSubscription {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  endpoint: string;
  authKey: string;
  p256dhKey: string;
  expirationTime: Date | null;
  userAgent: string | null;
  isActive: boolean;
}
