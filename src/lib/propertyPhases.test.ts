import { describe, it, expect } from "vitest";
import { computeSaleResults, phaseFromStatus } from "./propertyPhases";

describe("computeSaleResults", () => {
  it("lucro = venda − documentação − comissão − total investido", () => {
    const r = computeSaleResults(
      [{ userId: "a", purchase: 30000, renovation: 10000 }, { userId: "b", purchase: 10000, renovation: 0 }],
      100000, 2000, 5000,
    );
    expect(r.totalInvested).toBe(50000);
    expect(r.profit).toBe(43000);
  });
  it("divide o lucro pelo % do total investido", () => {
    const r = computeSaleResults(
      [{ userId: "a", purchase: 30000, renovation: 10000 }, { userId: "b", purchase: 10000, renovation: 0 }],
      100000, 2000, 5000,
    );
    expect(r.results[0].pct).toBe(80);
    expect(r.results[0].profit).toBeCloseTo(34400);
    expect(r.results[1].profit).toBeCloseTo(8600);
  });
});

describe("phaseFromStatus", () => {
  it("mapeia status para etapa", () => {
    expect(phaseFromStatus("auctioned")).toBe("purchase");
    expect(phaseFromStatus("renovation_in_progress")).toBe("renovation");
    expect(phaseFromStatus("for_sale")).toBe("sale");
  });
});
