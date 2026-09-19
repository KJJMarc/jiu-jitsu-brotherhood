/**
 * Minimal Markdown → HTML for JJB legal drafts.
 * Supports headings, paragraphs, lists, tables, blockquotes, links, emphasis.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(raw: string): string {
  let out = escapeHtml(raw);
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>',
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line.trim());
}

function parseTable(lines: string[], start: number): { html: string; next: number } {
  const rows: string[][] = [];
  let i = start;
  while (i < lines.length && lines[i].trim().includes("|")) {
    const line = lines[i].trim();
    if (isTableSeparator(line)) {
      i += 1;
      continue;
    }
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    rows.push(cells);
    i += 1;
  }
  if (rows.length === 0) {
    return { html: "", next: start + 1 };
  }
  const [header, ...body] = rows;
  const thead = `<thead><tr>${header
    .map((c) => `<th>${inlineFormat(c)}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${body
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td>${inlineFormat(c)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody>`;
  return {
    html: `<table class="jjb-legal-table">${thead}${tbody}</table>`,
    next: i,
  };
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let i = 0;
  let para: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];
  let quote: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    parts.push(`<p>${inlineFormat(para.join(" ").trim())}</p>`);
    para = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) return;
    parts.push(
      `<${listType}>${listItems
        .map((item) => `<li>${inlineFormat(item)}</li>`)
        .join("")}</${listType}>`,
    );
    listType = null;
    listItems = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    parts.push(
      `<blockquote>${quote
        .map((line) => `<p>${inlineFormat(line)}</p>`)
        .join("")}</blockquote>`,
    );
    quote = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      flushList();
      flushQuote();
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      flushPara();
      flushList();
      flushQuote();
      const table = parseTable(lines, i);
      parts.push(table.html);
      i = table.next;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushPara();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ""));
      i += 1;
      continue;
    }
    if (quote.length) flushQuote();

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      parts.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      flushPara();
      flushList();
      parts.push("<hr />");
      i += 1;
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(trimmed);
    if (ul) {
      flushPara();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(ul[1]);
      i += 1;
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ol) {
      flushPara();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(ol[1]);
      i += 1;
      continue;
    }

    if (listType) flushList();
    para.push(trimmed);
    i += 1;
  }

  flushPara();
  flushList();
  flushQuote();
  return parts.join("\n");
}
