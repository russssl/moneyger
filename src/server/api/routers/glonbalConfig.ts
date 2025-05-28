import {
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { type Provider } from "@/hooks/use-session";
import { env } from "@/env";

export const globalConfigRouter = createTRPCRouter({
  getGlobalConfig: publicProcedure
    .query(async (): Promise<Provider[]> => {
      const availableProviders: Provider[] = [];
      const providers = [
        {
          id: "github" as Provider,
          enabled: Boolean(env?.GITHUB_CLIENT_ID && env?.GITHUB_CLIENT_SECRET)
        },
        {
          id: "google" as Provider,
          enabled: Boolean(env?.GOOGLE_CLIENT_ID && env?.GOOGLE_CLIENT_SECRET)
        }
      ];

      providers
        .filter(provider => provider.enabled)
        .forEach(provider => availableProviders.push(provider.id));
      return availableProviders;
    }),
});