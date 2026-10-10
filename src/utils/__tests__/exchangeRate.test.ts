import { describe, expect, it } from "vitest";
import { documentExchangeRate } from "../exchangeRate";

describe("documentExchangeRate", () => {
  it("devuelve el T.C. más repetido entre las líneas", () => {
    expect(
      documentExchangeRate([
        { tc_compra: "9.89000" },
        { tc_compra: 9.89 },
        { tc_compra: 10 },
      ]),
    ).toBe(9.89);
  });

  it("ignora líneas sin T.C. o con T.C. 0", () => {
    expect(
      documentExchangeRate([{ tc_compra: null }, { tc_compra: 0 }, { tc_compra: "6.96" }]),
    ).toBe(6.96);
  });

  it("devuelve undefined si ninguna línea tiene T.C.", () => {
    expect(documentExchangeRate([{ tc_compra: null }, {}])).toBeUndefined();
    expect(documentExchangeRate([])).toBeUndefined();
  });
});
