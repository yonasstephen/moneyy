import { parse } from "date-fns";
import { Expense } from "@/types";

export function parseRows(rows: string[][], sourceFile: string): Expense[] {
  const expenses: Expense[] = [];

  for (const row of rows) {
    if (row.length < 7) continue;

    const [idStr, dateStr, category, amountStr, currency, wallet, note, withPerson, event, members] = row;

    const id = parseInt(idStr, 10);
    if (isNaN(id)) continue;

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    let date: Date;
    try {
      date = parse(dateStr, "dd/MM/yyyy", new Date());
      if (isNaN(date.getTime())) continue;
    } catch {
      continue;
    }

    const tags = extractTags(note ?? "");

    expenses.push({
      id,
      date,
      dateString: dateStr,
      category: category?.trim() ?? "",
      amount,
      currency: currency?.trim().toUpperCase() ?? "GBP",
      wallet: wallet?.trim() ?? "",
      note: note?.trim() ?? "",
      tags,
      with: withPerson?.trim() || undefined,
      event: event?.trim() || undefined,
      members: members?.trim() || undefined,
      sourceFile,
    });
  }

  return expenses;
}

function extractTags(note: string): string[] {
  const matches = note.match(/#[^\s#]+/g);
  return matches ? matches.map((t) => t.toLowerCase()) : [];
}
