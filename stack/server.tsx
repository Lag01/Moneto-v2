import "server-only";

import { StackServerApp } from "@stackframe/stack";

// Log de diagnostic pour vérifier les variables d'environnement
if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
  console.error('[Stack Server] NEXT_PUBLIC_STACK_PROJECT_ID manquant');
}
if (!process.env.STACK_SECRET_SERVER_KEY) {
  console.error('[Stack Server] STACK_SECRET_SERVER_KEY manquant');
}

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
});
