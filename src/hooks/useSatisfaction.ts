import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "@/integrations/supabase/publicClient";

export interface SatisfactionResult {
  percent: number; // 0-100
  averageTotal: number; // average total score (sum across 7 questions), e.g., 21.4
  averagePerQuestion: number; // average per question (1-5 scale)
  count: number; // number of responses considered
}

/**
 * Computes satisfaction from survey_responses where each response has 7 choice questions
 * with options: '매우만족' (5), '만족' (4), '보통' (3), '불만' (2), '매우불만' (1)
 * For each row we map those choices to scores 1..5, sum them (max 35), then compute
 * the average total and average per-question across all rows. Return percent normalized 0-100.
 */
export const useSatisfaction = () => {
  return useQuery<SatisfactionResult | null>({
    queryKey: ["satisfaction", "7q"],
    queryFn: async () => {
      const { data, error } = await supabasePublic
        .from("survey_responses")
        .select("responses");

      if (error) {
        console.error("useSatisfaction fetch error:", error);
        return null;
      }

      const rows = data || [];

      // helper to map Korean choice text to numeric score (be forgiving with spaces/casing)
      const mapChoiceToScore = (v: any): number | null => {
        if (v === null || v === undefined) return null;
        if (typeof v === "number") return Number(v);
        const s = String(v).trim().replace(/\s+/g, "").toLowerCase();
        // normalize common Korean labels without spaces
        if (s === "매우만족" || s === "매우만족") return 5;
        if (s === "만족") return 4;
        if (s === "보통") return 3;
        if (s === "불만") return 2;
        if (s === "매우불만" || s === "매우불만족" || s === "매우불만") return 1;
        // numeric strings ("5", "4", etc.)
        const n = Number(s);
        if (!Number.isNaN(n) && n >= 1 && n <= 5) return n;
        return null;
      };

      const totals: number[] = [];

      // helper to recursively extract values (handles arrays/objects)
      const extractValues = (input: any, out: any[]) => {
        if (input === null || input === undefined) return;
        if (Array.isArray(input)) {
          for (const it of input) extractValues(it, out);
          return;
        }
        if (typeof input === "object") {
          for (const v of Object.values(input)) extractValues(v, out);
          return;
        }
        out.push(input);
      };

      for (const rowIndex in rows) {
        const row = rows[rowIndex];
        const responses = row.responses || {};
        if (!responses) continue;

        const rawValues: any[] = [];
        extractValues(responses, rawValues);

        const scores: number[] = rawValues.map(mapChoiceToScore).filter((s) => s !== null) as number[];

        // Require at least 7 answered items to consider this row reliable
        if (scores.length < 7) continue;

        // If there are more than 7 (e.g., metadata included), take first 7 numeric answers in their original order
        const useScores = scores.slice(0, 7);
        const sum = useScores.reduce((s, x) => s + x, 0);
        totals.push(sum);
        // DEBUG: log first few rows to console for diagnosis (remove after debugging)
        if (process.env.NODE_ENV !== "production" && Number(rowIndex) < 3) {
          // eslint-disable-next-line no-console
          console.debug("useSatisfaction: row", Number(rowIndex), "rawValues:", rawValues.slice(0, 10), "scores:", scores.slice(0, 10));
        }
      }

  if (totals.length === 0) return null;

      // average total (scale 7..35), average per question (1..5)
      const averageTotal = totals.reduce((s, x) => s + x, 0) / totals.length;
      const averagePerQuestion = averageTotal / 7;

      // percent: map 1..5 per-question average to 0..100, where 1 -> 0, 5 -> 100
      const percent = Math.round(((averagePerQuestion - 1) / (5 - 1)) * 100);

      return {
        percent: Math.max(0, Math.min(100, percent)),
        averageTotal: Math.round(averageTotal * 10) / 10,
        averagePerQuestion: Math.round(averagePerQuestion * 10) / 10,
        count: totals.length,
      };
    }
  });
};

export default useSatisfaction;
