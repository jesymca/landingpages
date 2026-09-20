import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'SUPER_ADMIN' | 'ADMIN' | string;
      plan_id: 'GRATIS' | 'PAGO' | string;
      slug?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
    plan_id?: string;
    slug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    plan_id?: string;
  }
}
