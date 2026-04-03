import { z } from "zod";

import { errorResponseSchema, userResponseSchema } from "../../shared/schemas.js";

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema,
});

export const authErrorSchemas = {
  401: errorResponseSchema,
  403: errorResponseSchema,
} as const;
