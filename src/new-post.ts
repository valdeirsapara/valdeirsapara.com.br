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

// Data local, não UTC: à noite no Brasil o UTC já está no dia seguinte.
const now = new Date();
const year = now.getFullYear().toString();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

const slug = slugify(title);

const filePath = path.join("content", year, month, `${slug}.md`);

if (await Bun.file(filePath).exists()) {
  console.error(`✗ Arquivo já existe: ${filePath}`);
  process.exit(1);
}

// JSON.stringify gera uma string YAML válida mesmo com ":" ou aspas no título.
const content = `---
title: ${JSON.stringify(title)}
description:
date: ${date}
tags: []
series:
---

`;

await Bun.write(filePath, content);

console.log(`✓ ${filePath}`);
