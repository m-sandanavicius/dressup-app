import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';
import { compareSync } from 'bcrypt-ts-edge';
import CredentialsProvider from 'next-auth/providers/credentials';
import { CartItem } from './types';

export const config = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        // Find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // Check if user exists and if the password matches
        if (user && user.password) {
          const isMatch = await compareSync(
            credentials.password as string,
            user.password,
          );

          // If password is correct, return user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // If user does not exist or password does not match return null
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user, trigger, token }: any) {
      // Set the user ID from the token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // If there is an update, set the user name
      if (trigger === 'update') {
        session.user.name = user.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      // Assign user fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role;

        // If user has no name then use the email
        if (user.name === 'NO_NAME') {
          token.name = user.email!.split('@')[0];

          // Update database to reflect the token name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }

        if (trigger === 'signIn' || trigger === 'signUp') {
          const cookiesObject = await cookies();
          const sessionCartId = cookiesObject.get('sessionCartId')?.value;

          if (sessionCartId) {
            const sessionCart = await prisma.cart.findFirst({
              where: { sessionCartId },
            });

            const userCart = await prisma.cart.findFirst({
              where: { userId: user.id },
            });

            if (sessionCart) {
              if (userCart) {
                await prisma.cart.delete({
                  where: { id: userCart.id },
                });
              }
              await prisma.cart.upsert({
                where: { id: sessionCart.id },
                update: { userId: user.id },
                create: {
                  id: sessionCart.id,
                  userId: user.id,
                  sessionCartId: sessionCartId,
                  items: sessionCart.items as CartItem[],
                  itemsPrice: sessionCart.itemsPrice,
                  totalPrice: sessionCart.totalPrice,
                  shippingPrice: sessionCart.shippingPrice,
                  taxPrice: sessionCart.taxPrice,
                },
              });
            } else if (!userCart) {
              await prisma.cart.create({
                data: {
                  userId: user.id,
                  sessionCartId: sessionCartId,
                  items: [],
                  itemsPrice: 0,
                  totalPrice: 0,
                  shippingPrice: 0,
                  taxPrice: 0,
                },
              });
            }
          }
        }
      }

      // Handle session updates
      if (session?.user.name && trigger === 'update') {
        token.name = session.user.name;
      }

      return token;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
