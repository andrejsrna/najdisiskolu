import { createElement, Fragment, type ReactNode } from "react";

type ElementNode = {
  tag: string;
  href?: string;
  src?: string;
  children: Array<ElementNode | string>;
};

const ALLOWED_TAGS = new Set(["p", "h2", "h3", "blockquote", "ul", "ol", "li", "strong", "b", "em", "i", "s", "code", "a", "img", "br"]);

function decodeText(value: string) {
  return value
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function safeHref(raw: string | undefined) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw, "https://najdisiskolu.trnava-vuc.sk");
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? raw : undefined;
  } catch {
    return undefined;
  }
}

function parseHtml(html: string): ElementNode {
  const root: ElementNode = { tag: "root", children: [] };
  const stack = [root];
  const tokens = html.split(/(<[^>]*>)/g).filter(Boolean);

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      stack.at(-1)?.children.push(decodeText(token));
      continue;
    }
    const closing = token.match(/^<\/\s*([a-z0-9]+)/i)?.[1]?.toLowerCase();
    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === closing) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const tag = token.match(/^<\s*([a-z0-9]+)/i)?.[1]?.toLowerCase();
    if (!tag || !ALLOWED_TAGS.has(tag)) continue;
    const href = tag === "a" ? safeHref(token.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]) : undefined;
    const src = tag === "img" ? token.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] : undefined;
    const node: ElementNode = { tag, href, src, children: [] };
    stack.at(-1)?.children.push(node);
    if (tag !== "br") stack.push(node);
  }
  return root;
}

function renderNode(node: ElementNode | string, key: string): ReactNode {
  if (typeof node === "string") return node;
  const children = node.children.map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.tag === "br") return <br key={key} />;
  if (node.tag === "img") {
    const src = node.src && /^https:\/\/s3\.trnavavuc\.sk\/ttsk-media\//.test(node.src) ? node.src : undefined;
    return src ? <img key={key} src={src} alt="" loading="lazy" /> : null;
  }
  if (node.tag === "a") {
    return node.href ? (
      <a key={key} href={node.href} target={node.href.startsWith("http") ? "_blank" : undefined} rel={node.href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    ) : <Fragment key={key}>{children}</Fragment>;
  }
  return createElement(node.tag, { key }, children);
}

export default function SafeRichText({ html }: { html: string }) {
  return <div className="article-content">{parseHtml(html).children.map((node, index) => renderNode(node, String(index)))}</div>;
}
