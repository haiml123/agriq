import { z } from 'zod';

export const weatherObservationSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  recordedAt: z.string(),
});

export type WeatherObservation = z.infer<typeof weatherObservationSchema>;
