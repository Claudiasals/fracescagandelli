import { normalizeInlineText, splitParagraphs } from "../utils/pageProse.js";

const PageProseContent = ({
  text,
  className = "",
  singleParagraph = false,
  preserveLineBreaks = false,
}) => {
  if (preserveLineBreaks) {
    const content = text || "\u00a0";
    return <p className={className}>{content}</p>;
  }

  if (singleParagraph) {
    const inline = normalizeInlineText(text);
    return <p className={className}>{inline || "\u00a0"}</p>;
  }

  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return <p className={className}>&nbsp;</p>;
  }

  if (paragraphs.length === 1) {
    return <p className={className}>{paragraphs[0]}</p>;
  }

  return (
    <div className="page-prose-text-stack flex flex-col gap-4">
      {paragraphs.map((para, i) => (
        <p key={i} className={className}>
          {para}
        </p>
      ))}
    </div>
  );
};

export default PageProseContent;
