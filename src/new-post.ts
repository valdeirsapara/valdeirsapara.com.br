import path from "node:path";

const title = process.argv[2];

if (!title) {
  console.error('Uso: bun new-post "Título do post"');
  process.exit(1);
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const now = new Date();
const year = now.getUTCFullYear().toString();
const month = String(now.getUTCMonth() + 1).padStart(2, "0");
const day = String(now.getUTCDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

const slug = slugify(title);

const filePath = path.join("content", year, month, `${slug}.md`);

if (await Bun.file(filePath).exists()) {
  console.error(`✗ Arquivo já existe: ${filePath}`);
  process.exit(1);
}

const content = `---
title: ${title}
description:
date: ${date}
tags: []
series:
---

`;

await Bun.write(filePath, content);

console.log(`✓ ${filePath}`);
