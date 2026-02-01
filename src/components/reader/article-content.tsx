import DOMPurify from "dompurify";

interface ArticleContentProps {
  html: string;
}

/**
 * Renders pre-sanitized HTML content. DOMPurify is applied as a safety net
 * even though core modules already sanitize — defense in depth.
 */
export function ArticleContent({ html }: ArticleContentProps) {
  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target"],
  });

  return (
    <div
      className="leading-relaxed max-w-180 [&_img]:max-w-full [&_img]:h-auto [&_pre]:overflow-x-auto [&_pre]:bg-bg-secondary [&_pre]:p-sm [&_pre]:rounded"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
