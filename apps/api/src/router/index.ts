import { demoRouter } from './demo';
import { incidentsRouter } from './incidents';
import { sessionRouter } from './session';

import { publicProcedure, router } from '../trpc';

export const appRouter = router({
	hello: publicProcedure.query(() => {
		return {
			message: 'Hello from the YardWatch tRPC API.',
			timestamp: new Date().toISOString(),
		};
	}),
	demo: demoRouter,
	incidents: incidentsRouter,
	session: sessionRouter,
});

export type AppRouter = typeof appRouter;
export type {
  IncidentAddress,
  IncidentAddressResolution,
  IncidentBounds,
  IncidentCentroid,
  IncidentFeatureProperties,
  IncidentSeverity,
  IncidentStatus,
  IncidentSummary,
  IncidentsOverview,
} from "../incidents";
