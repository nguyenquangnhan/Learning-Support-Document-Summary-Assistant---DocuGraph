/**
 * DocuGraph AI – Heuristic Regex Post-Processor for On-Device OCR
 * Course Alignment: Week 11 Slide 40, 45, 46, 55
 * Extracts structured academic metadata (Title, Formulas, Dates, VND/Numbers, Keywords)
 * from raw ML Kit OCR text blocks.
 */

export interface ParsedAcademicDocument {
  cleanedText: string;
  detectedTitle: string;
  detectedFormulas: string[];
  detectedDates: string[];
  detectedKeywords: string[];
  confidence: number;
}

export class HeuristicRegexParser {
  // Matches dates: DD/MM/YYYY, YYYY-MM-DD (Week 11 Slide 45)
  private static readonly DATE_REGEX = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b|\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/g;

  // Matches VND / numeric metrics (Week 11 Slide 45)
  private static readonly VND_REGEX = /(\d{1,3}(?:[.,]\d{3})+|\d{4,9})\s*(?:đ|vnd|vnđ)/gi;

  // Matches academic chapter / section headings
  private static readonly HEADING_REGEX = /^(?:Chương|Bài|Phần|Mục|Định lý|Chapter|Section|Lecture)\s+[^\n]{3,80}/im;

  // Matches mathematical formulas, equations, Big-O complexity, or LaTeX expressions
  private static readonly FORMULA_REGEX =
    /(\$[^$\n]+\$|\b[a-zA-Z]\([a-zA-Z0-9,\s]+\)\s*=\s*[^\n.;,]+|\bO\([^)]+\)|[A-Za-z0-9_]+\s*=\s*[A-Za-z0-9_+\-*/^()\s]{3,35})/g;

  // Matches capitalized technical concepts / acronyms
  private static readonly KEYWORD_REGEX = /\b([A-ZÀ-Ỹ][a-zà-ỹA-Z0-9_-]{2,}(?:\s+[A-ZÀ-Ỹ][a-zà-ỹA-Z0-9_-]{2,}){0,2})\b/g;

  public static parse(rawText: string): ParsedAcademicDocument {
    const normalized = (rawText || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!normalized) {
      return {
        cleanedText: "",
        detectedTitle: "Bản quét tài liệu mới",
        detectedFormulas: [],
        detectedDates: [],
        detectedKeywords: [],
        confidence: 0,
      };
    }

    // 1. Extract Title (Heading regex or first non-empty line)
    const headingMatch = normalized.match(HeuristicRegexParser.HEADING_REGEX);
    const firstLine = normalized
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 4);
    const detectedTitle = (headingMatch ? headingMatch[0] : firstLine || "Bản quét OCR ML Kit").slice(0, 75);

    // 2. Extract Dates
    const dateMatches = normalized.match(HeuristicRegexParser.DATE_REGEX) || [];
    const detectedDates = Array.from(new Set(dateMatches)).slice(0, 5);

    // 3. Extract Formulas & Equations
    const formulaMatches = normalized.match(HeuristicRegexParser.FORMULA_REGEX) || [];
    const detectedFormulas = Array.from(new Set(formulaMatches.map((f) => f.trim()))).slice(0, 6);

    // 4. Extract Academic Keywords (filtering common Vietnamese stop words)
    const stopWords = new Set([
      "Trong",
      "Theo",
      "Nhưng",
      "Hoặc",
      "Nếu",
      "Khi",
      "Một",
      "Các",
      "Những",
      "Được",
      "Trên",
      "Dưới",
      "Trang",
    ]);
    const kwMatches = normalized.match(HeuristicRegexParser.KEYWORD_REGEX) || [];
    const detectedKeywords = Array.from(
      new Set(kwMatches.map((k) => k.trim()).filter((k) => !stopWords.has(k) && k.length >= 4))
    ).slice(0, 8);

    // 5. Calculate heuristic confidence indicator (0.82 -> 0.98) based on text density & structure
    const wordCount = normalized.split(/\s+/).length;
    const baseConf = wordCount >= 20 ? 0.92 : wordCount >= 5 ? 0.86 : 0.78;
    const structureBonus = (detectedFormulas.length > 0 ? 0.03 : 0) + (detectedKeywords.length >= 3 ? 0.03 : 0);
    const confidence = Math.min(0.99, Number((baseConf + structureBonus).toFixed(2)));

    return {
      cleanedText: normalized,
      detectedTitle,
      detectedFormulas,
      detectedDates,
      detectedKeywords,
      confidence,
    };
  }
}

