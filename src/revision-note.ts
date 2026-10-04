/** A revision note's lead and body. Notes in content begin with their lead — "REV. NOTE △" (up to
 * the triangle) or a capitalised "NOTE:" — which components.md RevisionNote sets in 600 weight. */
export interface NoteParts {
  lead: string;
  body: string;
}

const LEAD = /^(.{1,24}?△|\p{Lu}[\p{Lu} .]*:)\s+/u;

export function splitNote(text: string): NoteParts {
  const match = LEAD.exec(text);
  if (!match) return { lead: '', body: text };
  return { lead: match[1]!, body: text.slice(match[0].length) };
}
