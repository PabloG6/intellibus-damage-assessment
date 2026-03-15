import { config } from "dotenv";
import {
  asc,
  eq,
  getConnectedDb,
  incidents,
  resolveConnectionString,
} from "@workspace/db";
import { reverseGeocodeAddress, shouldEnrichAddress } from "../src/google-maps";
import { resolveGoogleMapsApiKey } from "../src/env";

config({ path: ".env" });
config({ path: ".env.local" });
config({ path: "packages/db/.env.local" });
config({ path: "apps/web/.env.local" });

const refresh = process.argv.includes("--refresh");

async function enrich() {
  const apiKey = resolveGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is required for incident address enrichment");
  }

  const connectionString = resolveConnectionString();
  const { db, client } = await getConnectedDb(connectionString);

  try {
    const rows = await db
      .select({
        id: incidents.id,
        centroidLng: incidents.centroidLng,
        centroidLat: incidents.centroidLat,
        formattedAddress: incidents.formattedAddress,
      })
      .from(incidents)
      .orderBy(asc(incidents.id));

    let enriched = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
      if (!shouldEnrichAddress(row, refresh)) {
        skipped += 1;
        continue;
      }

      try {
        const address = await reverseGeocodeAddress(
          [row.centroidLng, row.centroidLat],
          apiKey,
        );

        await db
          .update(incidents)
          .set({
            formattedAddress: address.formatted,
            placeId: address.placeId,
            addressResolution: address.resolution,
            enrichedAt: new Date(),
          })
          .where(eq(incidents.id, row.id));

        enriched += 1;
      } catch (error) {
        failed += 1;
        console.error(`Failed to enrich ${row.id}`, error);
      }
    }

    console.log(
      `Incident enrichment complete. Enriched: ${enriched}, skipped: ${skipped}, failed: ${failed}`,
    );
  } finally {
    await client.end();
  }
}

enrich().catch((error) => {
  console.error("Failed to enrich incidents", error);
  process.exitCode = 1;
});
