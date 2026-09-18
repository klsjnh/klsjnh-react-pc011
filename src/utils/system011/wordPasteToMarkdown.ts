/**
 * Word HTML to Markdown utility.
 * Migrated from klsjnh-react-dev011_20260909_011.
 * Converts pasted Word HTML content into Markdown.
 */
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

let turndownService: TurndownService | null = null;

function getTurndownService(): TurndownService {
  if (!turndownService) {
    const service = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
    });
    service.use(gfm);
    turndownService = service;
  }
  return turndownService;
}

const __BULLET_PREFIX = /^[-\u00B7\u25CF\u25CB\u25A0\u2219\u25CF\u25CB\u2219\s]+/;
const DOC_META_LABELS = [
  'File No.', 'Distribution', 'Version', 'Pages', 'Effective', 'Approval', 'Confidential',
  'File Name', 'No.', 'Draft', 'Review', 'Approve', 'Prepare',
];

function compactText(text: string): string {
  return text.replace(/\u00A0/g, ' ').replace(/\s+/g, '').trim();
}

function countMetaLabels(text: string): number {
  const compact = compactText(text);
  return DOC_META_LABELS.filter((label) => compact.includes(label.replace(/\s/g, ''))).length;
}

function stripOfficeNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?o:p[^>]*>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?m:[^>]*>/gi, '')
    .replace(/<\/?v:[^>]*>/gi, '');
}

function unwrapElement(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

function isCoverPageTable(table: HTMLTableElement): boolean {
  const compact = compactText(table.textContent || '');
  return (
    (/File/.test(compact) && /Version/.test(compact)) ||
    (/Approval/.test(compact) && /Draft/.test(compact))
  );
}

function isSectionHeaderTable(table: HTMLTableElement): boolean {
  const compact = compactText(table.textContent || '');
  return /File Name/.test(compact) && /No\./.test(compact) && /Version/.test(compact);
}

function isDocumentHeaderTable(table: HTMLTableElement): boolean {
  if (/MsoTableGrid/i.test(table.className)) return false;
  if (isCoverPageTable(table) || isSectionHeaderTable(table)) return true;
  if (/MsoNormalTable/i.test(table.className) && countMetaLabels(table.textContent || '') >= 2) return true;
  return false;
}

function removeWordHeaderFooterElements(doc: Document): void {
  doc.querySelectorAll('[style*="mso-element"]').forEach((node) => {
    const style = node.getAttribute('style') || '';
    if (/mso-element:\s*(header|footer|footnote|endnote)/i.test(style)) {
      node.remove();
    }
  });
}

function removeDocumentHeaderTables(doc: Document): void {
  Array.from(doc.querySelectorAll('table'))
    .reverse()
    .forEach((table) => {
      if (isDocumentHeaderTable(table)) {
        table.remove();
      }
    });
}

function removeLooseHeaderBlocks(doc: Document): void {
  doc.querySelectorAll('p, div').forEach((node) => {
    if (node.querySelector('table')) return;
    const text = (node.textContent || '').replace(/\u00A0/g, ' ').trim();
    if (/^[Image]$/.test(text)) { node.remove(); return; }
    if (/^Confidential/.test(text) && /Distribution/.test(text) && text.length < 120) { node.remove(); }
  });
}

function collapseNestedFormatting(root: ParentNode): void {
  let changed = true;
  while (changed) {
    changed = false;
    root.querySelectorAll('strong strong, b b, em em, i i').forEach((inner) => {
      unwrapElement(inner);
      changed = true;
    });
  }
}

function removeEmptyFormattingTags(root: ParentNode): void {
  root.querySelectorAll('strong, b, em, i, span').forEach((node) => {
    const text = node.textContent?.replace(/\u00A0/g, '').trim();
    if (!text && !node.querySelector('img, table, br')) node.remove();
  });
}

function promoteTableHeaderRow(doc: Document): void {
  doc.querySelectorAll('table').forEach((table) => {
    const firstRow = table.querySelector(':scope > tr, :scope > tbody > tr');
    if (!firstRow || firstRow.querySelector('th')) return;
    firstRow.querySelectorAll('td').forEach((cell) => {
      const heading = doc.createElement('th');
      heading.textContent = cell.textContent;
      cell.replaceWith(heading);
    });
  });
}

function flattenTableCellText(doc: Document): void {
  doc.querySelectorAll('td, th').forEach((cell) => {
    let text = (cell.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
    if (text === '\\') text = '';
    cell.textContent = text;
  });
}

function simplifyTableCells(doc: Document): void {
  doc.querySelectorAll('td, th').forEach((cell) => {
    cell.querySelectorAll(':scope > p').forEach((p) => {
      while (p.firstChild) cell.insertBefore(p.firstChild, p);
      p.remove();
    });
    cell.removeAttribute('style');
    cell.removeAttribute('width');
    cell.removeAttribute('valign');
  });
  doc.querySelectorAll('table tbody').forEach((tbody) => {
    const table = tbody.parentElement;
    if (!table) return;
    while (tbody.firstChild) table.insertBefore(tbody.firstChild, tbody);
    tbody.remove();
  });
  doc.querySelectorAll('table').forEach((table) => {
    table.removeAttribute('style');
    table.removeAttribute('border');
    table.removeAttribute('cellspacing');
    table.removeAttribute('cellpadding');
    table.removeAttribute('class');
    table.querySelectorAll('tr').forEach((row) => row.removeAttribute('style'));
  });
}

function isLayoutTable(table: HTMLTableElement): boolean {
  const rows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr'));
  if (rows.length === 0) return true;
  const rowCellCounts = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll(':scope > td, :scope > th'));
    const colspanTotal = cells.reduce((sum, cell) => sum + Number.parseInt(cell.getAttribute('colspan') || '1', 10), 0);
    return { cells: cells.length, colspanTotal };
  });
  if (rows.length === 1 && rowCellCounts[0].cells === 1 && rowCellCounts[0].colspanTotal > 1) return true;
  if (rowCellCounts.every(({ cells, colspanTotal }) => cells === 1 && colspanTotal > 1)) return true;
  return false;
}

function flattenLayoutTable(table: HTMLTableElement): void {
  const fragment = table.ownerDocument.createDocumentFragment();
  const cells = table.querySelectorAll('td, th');
  cells.forEach((cell, index) => {
    while (cell.firstChild) fragment.appendChild(cell.firstChild);
    if (index < cells.length - 1) fragment.appendChild(table.ownerDocument.createElement('br'));
  });
  table.replaceWith(fragment);
}

function flattenLayoutTables(root: ParentNode): void {
  Array.from(root.querySelectorAll('table'))
    .reverse()
    .forEach((table) => {
      if (isLayoutTable(table)) flattenLayoutTable(table);
    });
}

function normalizeImages(doc: Document): void {
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || 'image';
    if (src.startsWith('data:')) return;
    if (src.startsWith('file:') || src.startsWith('blob:') || !src.trim()) {
      img.replaceWith(doc.createTextNode(`[${alt}]`));
    }
  });
}

function _promoteHeading_UNUSED(node: Element, level: number): void {
  const headingLevel = Math.min(6, Math.max(1, level));
  const heading = node.ownerDocument.createElement(`h${headingLevel}`);
  heading.innerHTML = node.innerHTML;
  node.replaceWith(heading);
}

function promoteStyledText(doc: Document): void {
  doc.querySelectorAll('[style]').forEach((node) => {
    const style = node.getAttribute('style') || '';
    if (/font-weight:\s*bold/i.test(style) || /mso-bidi-font-weight:\s*bold/i.test(style)) {
      const strong = doc.createElement('strong');
      strong.innerHTML = node.innerHTML;
      node.replaceWith(strong);
      return;
    }
    if (/font-style:\s*italic/i.test(style)) {
      const em = doc.createElement('em');
      em.innerHTML = node.innerHTML;
      node.replaceWith(em);
    }
  });
}

function unwrapFontTags(doc: Document): void {
  doc.querySelectorAll('font').forEach((font) => {
    const span = doc.createElement('span');
    span.innerHTML = font.innerHTML;
    font.replaceWith(span);
  });
}

function unwrapRedundantSpans(root: ParentNode): void {
  let changed = true;
  while (changed) {
    changed = false;
    root.querySelectorAll('span').forEach((span) => {
      const text = span.textContent?.replace(/\u00A0/g, '').trim();
      if (!text && !span.querySelector('img, table, br')) {
        span.remove();
        changed = true;
        return;
      }
      if (span.attributes.length === 0 || (span.attributes.length === 1 && span.hasAttribute('style'))) {
        if (!span.querySelector('strong, em, b, i, u, a, img, table')) {
          unwrapElement(span);
          changed = true;
        }
      }
    });
  }
}

function removeEmptyBlocks(doc: Document): void {
  doc.querySelectorAll('p, div, span').forEach((node) => {
    const text = node.textContent?.replace(/\u00A0/g, '').trim();
    if (!text && !node.querySelector('img, table, hr, br')) node.remove();
  });
}

function cleanupMarkdown(markdown: string): string {
  let result = markdown;
  result = result.replace(/^\s*(\[Image]|!\[\]\([^)]*\))\s*$/gm, '');
  return result
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tableToPlainMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return cleanupPlainSegment(html);
  const rows = Array.from(table.querySelectorAll('tr'));
  const lines = rows
    .map((row) => Array.from(row.querySelectorAll('td, th'))
      .map((cell) => (cell.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' | '))
    .filter(Boolean);
  return lines.join('\n');
}

function convertHtmlBlockToMarkdown(html: string): string {
  try {
    const markdown = convertHtmlToMarkdown(html);
    if (markdown.trim()) return markdown;
  } catch { /* fall through */ }
  return tableToPlainMarkdown(html);
}

function serializeDocBody(doc: Document): string {
  const html = doc.body.innerHTML.trim();
  if (html) return html;
  return Array.from(doc.body.children).map((node) => (node as Element).outerHTML ?? '').join('');
}

function normalizeWordDom(doc: Document): void {
  doc.querySelectorAll('script, style, meta, link, title').forEach((el) => el.remove());
  removeWordHeaderFooterElements(doc);
  removeDocumentHeaderTables(doc);
  removeLooseHeaderBlocks(doc);
  flattenLayoutTables(doc.body);
  normalizeImages(doc);
  unwrapFontTags(doc);
  promoteStyledText(doc);
  collapseNestedFormatting(doc.body);
  simplifyTableCells(doc);
  flattenTableCellText(doc);
  promoteTableHeaderRow(doc);
  removeEmptyFormattingTags(doc.body);
  unwrapRedundantSpans(doc.body);
  removeEmptyBlocks(doc);
}

export function looksLikeWordHtml(text: string): boolean {
  if (!text?.trim()) return false;
  const sample = text.slice(0, 12000);
  return /class="?Mso|mso-|MsoNormalTable|<w:/i.test(sample);
}

function cleanupPlainSegment(segment: string): string {
  const text = segment.trim();
  if (!text) return '';
  if (!/<[^>]+>/.test(text)) return text;
  if (looksLikeWordHtml(text)) {
    try {
      const md = convertHtmlToMarkdown(text);
      if (md) return md;
    } catch { /* fall through */ }
  }
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function convertWordContentToMarkdown(text: string): string {
  const source = text ?? '';
  if (!looksLikeWordHtml(source)) return source;
  const tablePattern = /<table[\s\S]*?<\/table>/gi;
  if (!tablePattern.test(source)) {
    try { return convertHtmlToMarkdown(source); } catch { return source; }
  }
  tablePattern.lastIndex = 0;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tablePattern.exec(source)) !== null) {
    const plain = cleanupPlainSegment(source.slice(lastIndex, match.index));
    if (plain) parts.push(plain);
    const md = convertHtmlBlockToMarkdown(match[0]);
    if (md) parts.push(md);
    lastIndex = tablePattern.lastIndex;
  }
  const tail = cleanupPlainSegment(source.slice(lastIndex));
  if (tail) parts.push(tail);
  return cleanupMarkdown(parts.filter(Boolean).join('\n\n'));
}

export function normalizeWordHtml(html: string): string {
  const cleaned = stripOfficeNoise(html);
  const source = /<body[\s>]/i.test(cleaned) ? cleaned : `<body>${cleaned}</body>`;
  const doc = new DOMParser().parseFromString(source, 'text/html');
  normalizeWordDom(doc);
  return serializeDocBody(doc);
}

export function convertHtmlToMarkdown(html: string): string {
  const normalized = normalizeWordHtml(html);
  const markdown = getTurndownService().turndown(normalized);
  return cleanupMarkdown(markdown);
}

export function readPasteMarkdown(dataTransfer: DataTransfer): string {
  const html = dataTransfer.getData('text/html');
  const plain = dataTransfer.getData('text/plain');
  if (html?.trim()) {
    try { return convertHtmlToMarkdown(html); } catch { /* fall through */ }
  }
  if (looksLikeWordHtml(plain)) return convertWordContentToMarkdown(plain);
  return plain ?? '';
}

export function shouldConvertPaste(dataTransfer: DataTransfer): boolean {
  const html = dataTransfer.getData('text/html');
  if (html?.trim()) {
    return looksLikeWordHtml(html) || /<table[^>]*>/i.test(html) || /<(?:p|span|div)[^>]*style=/i.test(html);
  }
  return looksLikeWordHtml(dataTransfer.getData('text/plain'));
}
