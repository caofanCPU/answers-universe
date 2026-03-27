import { auth } from '@clerk/nextjs/server';
import { userService } from '@windrun-huaiin/backend-core/database';

export type AuthenticatedAppUser = {
  clerkUserId: string;
  userId: string;
};

export async function requireAppUser(): Promise<AuthenticatedAppUser> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error('UNAUTHORIZED');
  }

  const user = await userService.findByClerkUserId(clerkUserId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    clerkUserId,
    userId: user.userId,
  };
}
