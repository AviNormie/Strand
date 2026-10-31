import type { ReportFacts } from "./facts";

const NUMBER = /\d+(?:[.,]\d+)?/g;

function numbersIn(text: string): number[] {
  return (text.match(NUMBER) ?? []).map((n) => Number(n.replace(",", ".")));
}

function collectNumbers(value: unknown, out: Set<number>) {
  if (typeof value === "number") {
    for (const n of [value, Math.abs(value)]) {
      out.add(n);
      out.add(Math.round(n));
      out.add(Math.round(n * 10) / 10);
    }
  } else if (typeof value === "string") {
    numbersIn(value).forEach((n) => out.add(n));
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectNumbers(v, out));
    out.add(value.length);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectNumbers(v, out));
  }
}

/**
 * Numbers in `text` that appear nowhere in the facts (after rounding).
 * Small integers are allowed so phrasing like "top 3" or "two competitors" passes.
 * ponytail: catches invented metrics, not invented claims; a semantic judge would cover those.
 */
export function findUngroundedNumbers(
  text: string,
  facts: ReportFacts,
  /** Extra trusted text whose numbers are allowed too (e.g. metric definitions). */
  allowedFrom = ""
): number[] {
  const allowed = new Set<number>();
  collectNumbers(facts, allowed);
  numbersIn(allowedFrom).forEach((n) => allowed.add(n));
  for (let i = 0; i <= 10; i++) allowed.add(i);
  return [...new Set(numbersIn(text))].filter((n) => !allowed.has(n));
}

/** Product and competitor names must survive translation verbatim. */
export function mentionsBrand(text: string, facts: ReportFacts): boolean {
  return text.toLowerCase().includes(facts.brand.toLowerCase());
}
