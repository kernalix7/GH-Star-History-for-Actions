import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_VALUES = [
  "RELEASE_TAG",
  "RELEASE_SHA",
  "REPOSITORY",
  "CHANGES",
];

export function renderReleaseNotes(template, values) {
  let output = template;

  for (const name of REQUIRED_VALUES) {
    const value = values[name];
    if (!value) throw new Error(`${name} is required to render release notes.`);

    const placeholder = `{{${name}}}`;
    if (!output.includes(placeholder)) {
      throw new Error(`Release notes template is missing ${placeholder}.`);
    }
    output = output.replaceAll(placeholder, String(value));
  }

  const unresolved = output.match(/\{\{[A-Z][A-Z_]*\}\}/);
  if (unresolved) {
    throw new Error(`Unresolved release notes placeholder: ${unresolved[0]}`);
  }

  return output.endsWith("\n") ? output : `${output}\n`;
}

async function main() {
  const templatePath = process.argv[2];
  if (!templatePath) {
    throw new Error("Pass the release notes template path.");
  }

  const template = await readFile(templatePath, "utf8");
  process.stdout.write(renderReleaseNotes(template, process.env));
}

const entryPoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";

if (import.meta.url === entryPoint) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
