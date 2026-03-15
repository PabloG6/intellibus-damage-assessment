import { desc, incidents, sql } from "@workspace/db";
import {
  buildIncidentsOverview,
  type IncidentsOverview,
} from "../incidents";
import { publicProcedure, router } from "../trpc";

export const incidentsRouter = router({
  overview: publicProcedure.query(async ({ ctx }): Promise<IncidentsOverview> => {
    const severityOrder = sql<number>`
      case
        when ${incidents.severity} = 'critical' then 0
        when ${incidents.severity} = 'high' then 1
        when ${incidents.severity} = 'medium' then 2
        else 3
      end
    `;

    const rows = await ctx.db
      .select()
      .from(incidents)
      .orderBy(severityOrder, desc(incidents.damagePct0m));

    return buildIncidentsOverview(rows);
  }),
});
