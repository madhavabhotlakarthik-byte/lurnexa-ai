import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Normalise common AI math notations into standard LaTeX delimiters so KaTeX renders them.
// Handles: \( ... \), \[ ... \], and bare `[ ... ]` / `( ... )` blocks that contain LaTeX commands.
function normaliseMath(input: string): string {
  let s = input;
  // \[ ... \]  ->  $$ ... $$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => `\n$$${body}$$\n`);
  // \( ... \)  ->  $ ... $
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => `$${body}$`);
  // Bare [ ... ] on its own line that contains a backslash-command -> $$ ... $$
  s = s.replace(/(^|\n)\s*\[\s*([^\[\]]*?\\[a-zA-Z]+[^\[\]]*?)\s*\](?=\n|$)/g,
    (_m, pre, body) => `${pre}\n$$${body}$$\n`);
  return s;
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normaliseMath(children ?? "")}
      </ReactMarkdown>
    </div>
  );
}
