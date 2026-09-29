import type { ReactNode } from 'react';

/**
 * Small, dependency-free markdown renderer for agent answers.
 *
 * Everything is built from React elements — no `dangerouslySetInnerHTML`, so
 * agent output can never inject markup. Supported: ATX headings, paragraphs,
 * unordered/ordered lists, fenced code, block quotes, pipe tables, and the
 * inline set `code`, **bold**, *italic* and links (http/https only).
 */

const INLINE_PATTERN =
  /(`[^`]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;

type Block =
  | { type: 'code'; content: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'table'; headers: string[]; rows: string[][]; caption: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'paragraph'; text: string };

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableRule(line: string): boolean {
  return /^\s*\|?[\s:-]*-[\s|:-]*\|?\s*$/.test(line) && line.includes('-');
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let lastHeading = 'Assistant response';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim().length === 0) {
      continue;
    }

    if (line.startsWith('```')) {
      const content: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        content.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: 'code', content: content.join('\n') });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      lastHeading = heading[2].trim();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    if (line.trim().startsWith('>')) {
      blocks.push({ type: 'quote', text: line.trim().replace(/^>\s?/, '') });
      continue;
    }

    if (line.includes('|') && isTableRule(lines[index + 1] ?? '')) {
      const headers = splitRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|')) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push({ type: 'table', headers, rows, caption: lastHeading });
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index];
        const nextBullet = current.match(/^\s*[-*+]\s+(.*)$/);
        const nextNumbered = current.match(/^\s*\d+[.)]\s+(.*)$/);
        if (ordered ? nextNumbered : nextBullet) {
          items.push((ordered ? nextNumbered : nextBullet)?.[1].trim() ?? '');
          index += 1;
          continue;
        }
        break;
      }
      index -= 1;
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    while (index + 1 < lines.length) {
      const next = lines[index + 1];
      if (
        next.trim().length === 0 ||
        next.startsWith('#') ||
        next.startsWith('```') ||
        next.trim().startsWith('>') ||
        next.match(/^\s*[-*+]\s+/) ||
        next.match(/^\s*\d+[.)]\s+/) ||
        (next.includes('|') && isTableRule(lines[index + 2] ?? ''))
      ) {
        break;
      }
      paragraph.push(next.trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  INLINE_PATTERN.lastIndex = 0;
  let match = INLINE_PATTERN.exec(text);
  let counter = 0;

  while (match) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-i${counter}`;
    counter += 1;

    if (token.startsWith('`')) {
      nodes.push(
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          key={key}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(
        <strong className="font-semibold text-foreground" key={key}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            className="text-primary underline underline-offset-2 hover:no-underline"
            href={linkMatch[2]}
            key={key}
            rel="noopener noreferrer"
            target="_blank"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(
        <em className="italic" key={key}>
          {token.slice(1, -1)}
        </em>,
      );
    }

    cursor = match.index + token.length;
    match = INLINE_PATTERN.exec(text);
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function headingTag(level: number): 'h3' | 'h4' | 'h5' {
  if (level <= 2) {
    return 'h3';
  }
  return level === 3 ? 'h4' : 'h5';
}

export interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        if (block.type === 'heading') {
          const Tag = headingTag(block.level);
          return (
            <Tag className="font-heading text-base font-semibold text-foreground" key={key}>
              {renderInline(block.text, key)}
            </Tag>
          );
        }
        if (block.type === 'paragraph') {
          return <p key={key}>{renderInline(block.text, key)}</p>;
        }
        if (block.type === 'quote') {
          return (
            <blockquote
              className="rounded-r-lg border-l-4 border-primary bg-primary/5 px-3 py-2 text-muted-foreground"
              key={key}
            >
              {renderInline(block.text, key)}
            </blockquote>
          );
        }
        if (block.type === 'code') {
          return (
            <pre
              className="overflow-x-auto rounded-lg bg-foreground p-3 font-mono text-xs text-background"
              key={key}
            >
              <code>{block.content}</code>
            </pre>
          );
        }
        if (block.type === 'list') {
          const items = block.items.map((item, itemIndex) => (
            <li className="pl-1" key={`${key}-${itemIndex}`}>
              {renderInline(item, `${key}-${itemIndex}`)}
            </li>
          ));
          return block.ordered ? (
            <ol className="list-decimal space-y-1 pl-5 marker:text-muted-foreground" key={key}>
              {items}
            </ol>
          ) : (
            <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground" key={key}>
              {items}
            </ul>
          );
        }
        return (
          <div className="overflow-x-auto" key={key}>
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{block.caption}</caption>
              <thead>
                <tr className="border-b border-border">
                  {block.headers.map((header, headerIndex) => (
                    <th className="px-2 py-1.5 font-semibold text-foreground" key={headerIndex} scope="col">
                      {renderInline(header, `${key}-h${headerIndex}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr className="border-b border-border/60 last:border-0" key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td className="px-2 py-1.5 text-foreground" key={cellIndex}>
                        {renderInline(cell, `${key}-r${rowIndex}c${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
