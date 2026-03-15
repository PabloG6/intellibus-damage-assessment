import { describe, expect, it } from "vitest";
import {
  pickBestReverseGeocodeMatch,
  shouldEnrichAddress,
} from "../src/google-maps";

describe("google maps enrichment helpers", () => {
  it("prefers street address matches before broader place types", () => {
    const result = pickBestReverseGeocodeMatch([
      {
        formatted_address: "Westmoreland, Jamaica",
        place_id: "locality-1",
        types: ["locality", "political"],
      },
      {
        formatted_address: "Main Road, Westmoreland, Jamaica",
        place_id: "route-1",
        types: ["route"],
      },
      {
        formatted_address: "1 Main Road, Westmoreland, Jamaica",
        place_id: "street-1",
        types: ["street_address"],
      },
    ]);

    expect(result).toEqual({
      formatted: "1 Main Road, Westmoreland, Jamaica",
      placeId: "street-1",
      resolution: "street_address",
    });
  });

  it("falls back to missing when no supported address types are returned", () => {
    const result = pickBestReverseGeocodeMatch([
      {
        formatted_address: "Unnamed place",
        place_id: "misc-1",
        types: ["plus_code"],
      },
    ]);

    expect(result).toEqual({
      formatted: null,
      placeId: null,
      resolution: "missing",
    });
  });

  it("skips already enriched incidents unless refresh is requested", () => {
    expect(shouldEnrichAddress({ formattedAddress: "1 Main Street" }, false)).toBe(false);
    expect(shouldEnrichAddress({ formattedAddress: null }, false)).toBe(true);
    expect(shouldEnrichAddress({ formattedAddress: "1 Main Street" }, true)).toBe(true);
  });
});
