/**
 * The fidelity check: did the script keep the note's facts, and add none?
 *
 * It does not call an AI model. It looks for the things a rewrite most often
 * gets wrong: dropped key terms, dropped numbers, and numbers that were never
 * in the note. It is a review aid, not a proof, so it reports what to look at.
 */

export type FidelityReport = {
  /** Terms and numbers from the note that the script never says. */
  missing: string[];
  /** Numbers the script says that the note never mentions. */
  added: string[];
  /** How many terms and numbers from the note were checked. */
  checked: number;
  noteWords: number;
  scriptWords: number;
  /** The script is much shorter than the note, so points may be dropped. */
  tooShort: boolean;
};

const MAX_LISTED = 40;
// A spoken script is normally longer than the bullets it came from.
const MIN_LENGTH_RATIO = 0.8;
const MIN_NOTE_WORDS_FOR_LENGTH_CHECK = 50;

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
  "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
  "18": "eighteen", "19": "nineteen", "20": "twenty", "30": "thirty",
  "40": "forty", "50": "fifty", "60": "sixty", "70": "seventy",
  "80": "eighty", "90": "ninety", "100": "hundred",
};

/** The note with front matter and fenced code blocks removed. */
function stripNote(note: string): string {
  return note
    .replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, "")
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, "")
    // List and heading numbering ("1.", "## 2)") is layout, not a fact.
    .replace(/^[ \t]*(?:#+[ \t]*)?\d+[.)][ \t]+/gm, "");
}

/** Lowercase words only. `dots` decides what a "." becomes: " dot " or " ". */
function normalize(text: string, dots: "spoken" | "plain"): string {
  return text
    .toLowerCase()
    .replace(/\./g, dots === "spoken" ? " dot " : " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word)).length;
}

/** Plain text for counting words: no markdown symbols. */
function plainText(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[#*_>|~-]+/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

type Terms = { code: string[]; concepts: string[]; numbers: string[] };

function extractTerms(note: string): Terms {
  const text = stripNote(note);
  const unique = (items: string[]) => [
    ...new Map(items.map((item) => [item.toLowerCase(), item])).values(),
  ];

  const code = [...text.matchAll(/`([^`\n]+)`/g)]
    .map((m) => m[1].trim())
    .filter((term) => term.length <= 60 && /[a-z0-9]/i.test(term));

  const concepts = [...text.matchAll(/\*\*([^*\n]+)\*\*|__([^_\n]+)__/g)]
    .map((m) => (m[1] ?? m[2]).trim())
    .filter((term) => /[a-z0-9]/i.test(term));

  // Numbers in prose. Code spans are checked as terms, so skip them here.
  const prose = text.replace(/`[^`\n]*`/g, " ");
  const numbers = [...prose.matchAll(/(?<![\w.])\d+(?:[.,]\d+)*(?![\w])/g)].map(
    (m) => m[0].replace(/,/g, ""),
  );

  return {
    code: unique(code),
    concepts: unique(concepts),
    numbers: [...new Set(numbers)],
  };
}

/** True when `phrase` appears in `text`, allowing plural endings. */
function hasPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase}`);
}

export function checkFidelity(note: string, script: string): FidelityReport {
  const terms = extractTerms(note);
  const spoken = normalize(script, "plain");
  const scriptTokens = new Set(spoken.split(" "));
  const scriptNumbers = new Set(
    [...script.matchAll(/(?<![\w.])\d+(?:[.,]\d+)*(?![\w])/g)].map((m) =>
      m[0].replace(/,/g, ""),
    ),
  );

  const missing: string[] = [];

  // Commands and identifiers should appear as written, though "." may be
  // spoken as "dot" and "_" or "-" as a space.
  for (const term of terms.code) {
    const forms = [normalize(term, "spoken"), normalize(term, "plain")];
    if (forms[0] && !forms.some((form) => hasPhrase(spoken, form))) {
      missing.push(term);
    }
  }

  // Named concepts may be reworded, so look for each of their words.
  for (const term of terms.concepts) {
    const words = normalize(term, "plain").split(" ").filter(Boolean);
    const found = words.every((word) =>
      [...scriptTokens].some((token) => token.startsWith(word)),
    );
    if (words.length > 0 && !found) missing.push(term);
  }

  // A number may be said as digits or as a word ("2" or "two"). One already
  // inside a missing term, like "6" in "6 hours", is not listed twice.
  const missingTokens = new Set(
    missing.flatMap((term) => normalize(term, "plain").split(" ")),
  );
  for (const number of terms.numbers) {
    const word = NUMBER_WORDS[number];
    const said = scriptNumbers.has(number) || (word && scriptTokens.has(word));
    if (!said && !missingTokens.has(number)) missing.push(number);
  }

  const noteNumbers = new Set(terms.numbers);
  const added = [...scriptNumbers].filter((number) => !noteNumbers.has(number));

  const noteWords = countWords(plainText(stripNote(note)));
  const scriptWords = countWords(script);

  return {
    missing: missing.slice(0, MAX_LISTED),
    added: added.slice(0, MAX_LISTED),
    checked: terms.code.length + terms.concepts.length + terms.numbers.length,
    noteWords,
    scriptWords,
    tooShort:
      noteWords >= MIN_NOTE_WORDS_FOR_LENGTH_CHECK &&
      scriptWords < noteWords * MIN_LENGTH_RATIO,
  };
}

/** True when a person should look at this script before trusting it. */
export function needsReview(report: FidelityReport): boolean {
  return (
    report.missing.length > 0 || report.added.length > 0 || report.tooShort
  );
}
