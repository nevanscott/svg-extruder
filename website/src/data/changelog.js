import fs from "fs/promises";
import path from "path";
import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";

marked.use(markedSmartypants());

export default async function () {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const filePath = path.join(__dirname, "../../../CHANGELOG.md");
  const markdown = await fs.readFile(filePath, "utf-8");
  const html = marked(markdown);

  const titleMatch = markdown.match(/^#\s+(.+)/);
  const title = titleMatch ? titleMatch[1] : "Changelog";

  const log = html.replace(/<h1>.*<\/h1>/, "");

  return { title, log };
}
