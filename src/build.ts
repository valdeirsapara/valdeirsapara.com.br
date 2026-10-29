import { marked } from "marked";
import matter from "gray-matter";
import nunjucks from "nunjucks";
import { rm } from "node:fs/promises";
import path from "node:path";
import { cases, contact, differentials, homeHiddenPosts, maker, packages, segments, stats, steps, whatsappLink } from "./site-data";

const SITE_NAME = "Valdeir Sapará";
const SITE_URL = "https://www.valdeirsapara.com.br";
const SITE_DESCRIPTION = "Notas sobre programação, experimentos e coisas que estou aprendendo.";

type Post = {
  title: string;
  description: string;
  date: Date;
  dateString: string;
  dateDisplay: string;
  dateLong: string;
  day: string;
  monthKey: string;
  monthLabel: string;
  tags: string[];
  series: string;
  slug: string;
  url: string;
  outputPath: string;
  renderedContent: string;
  readingMinutes: number;
};

type MonthGroup = {
  id: string;
  month: string;
  posts: Post[];
};

type Frontmatter = {
  title: string;
  description: string;
  date: Date;
  dateString: string;
  tags: string[];
  series: string;
};

const templates = nunjucks.configure("templates", {
  autoescape: true,
  noCache: true,
  trimBlocks: true,
  lstripBlocks: true,
});

/** Placeholder de conteúdo pendente: "FILL:CNPJ" vira <mark>[[PREENCHER: CNPJ]]</mark>. */
templates.addFilter("fill", (value: unknown) => {
  const text = String(value ?? "");
  if (text.startsWith("FILL:")) {
    return `<mark class="fill">[[PREENCHER: ${escapeHtml(text.slice(5))}]]</mark>`;
  }
  return escapeHtml(text);
});

/** Quebra um texto em <span class="w"> por palavra, para as animações. */
templates.addFilter("words", (value: unknown, offset = 0) =>
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .map((word, index) => `<span class="w" style="--i:${index + offset}">${escapeHtml(word)}</span>`)
    .join(" "),
);

/** Valor ainda não preenchido: vazio ou com [[...]]. Esses itens não aparecem no site. */
function isPending(value: unknown): boolean {
  const text = String(value ?? "").trim();
  return text === "" || text.startsWith("FILL:") || text.includes("[[");
}
templates.addFilter("pending", isPending);

templates.addFilter("pad", (value: unknown) => String(value).padStart(2, "0"));
templates.addGlobal("waLinkFor", (message: string) => whatsappLink(message));

const TERMINAL_LANGUAGES = new Set(["console", "shell", "sh", "bash", "zsh", "terminal"]);

const LANGUAGE_LABELS: Record<string, string> = {
  ts: "TS",
  typescript: "TS",
  tsx: "TSX",
  js: "JS",
  javascript: "JS",
  jsx: "JSX",
  json: "JSON",
  html: "HTML",
  css: "CSS",
  md: "MD",
  markdown: "MD",
  py: "PY",
  python: "PY",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Blocos de código ganham o "chrome" de janela do design: três bolinhas, o nome
 * do arquivo (```ts:src/build.ts) e a etiqueta da linguagem. Linguagens de shell
 * viram uma sessão de terminal, sem barra de título.
 */
marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }): string {
      const info = (lang ?? "").trim();
      const [languagePart = "", filenamePart = ""] = info.split(/[:\s]/, 2);
      const language = languagePart.toLowerCase();
      const body = escapeHtml(text);

      if (TERMINAL_LANGUAGES.has(language)) {
        return `<div class="terminal"><pre><code>${body}</code></pre></div>\n`;
      }

      const label = LANGUAGE_LABELS[language] ?? language.toUpperCase();
      const filename = filenamePart
        ? `<span class="code-block__name">${escapeHtml(filenamePart)}</span>`
        : "";
      const badge = label ? `<span class="code-block__lang">${escapeHtml(label)}</span>` : "";

      return `<div class="code-block">
  <div class="code-block__bar">
    <span class="code-block__dots" aria-hidden="true"><span></span><span></span><span></span></span>
    ${filename}${badge}
  </div>
  <pre><code>${body}</code></pre>
</div>\n`;
    },
  },
});

function validateFrontmatter(
  filename: string,
  data: Record<string, unknown>,
  rawFrontmatter: string,
): Frontmatter {
  const errors: string[] = [];
  const title = typeof data.title === "string" ? data.title.trim() : "";

  if (!title) {
    errors.push('"title" é obrigatório e precisa ser um texto não vazio');
  }

  let description = "";
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description === "string") {
      description = data.description.trim();
    } else {
      errors.push('"description" precisa ser um texto quando informado');
    }
  }

  let tags: string[] = [];
  if (data.tags !== undefined && data.tags !== null) {
    if (Array.isArray(data.tags) && data.tags.every((tag) => typeof tag === "string")) {
      tags = (data.tags as string[]).map((tag) => tag.trim()).filter(Boolean);
    } else {
      errors.push('"tags" precisa ser uma lista de textos quando informada');
    }
  }

  let series = "";
  if (data.series !== undefined && data.series !== null) {
    if (typeof data.series === "string") {
      series = data.series.trim();
    } else {
      errors.push('"series" precisa ser um texto quando informada');
    }
  }

  const dateString = rawFrontmatter.match(
    /^\s*date\s*:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*(?:#.*)?$/m,
  )?.[1];

  let date: Date | undefined;
  if (typeof dateString !== "string") {
    errors.push('"date" é obrigatória e deve usar o formato AAAA-MM-DD');
  } else {
    const [year, month, day] = dateString.split("-").map(Number);
    const parsedDate = new Date(`${dateString}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime())
      || parsedDate.getUTCFullYear() !== year
      || parsedDate.getUTCMonth() + 1 !== month
      || parsedDate.getUTCDate() !== day
    ) {
      errors.push('"date" não representa uma data válida');
    } else {
      date = parsedDate;
    }
  }

  if (errors.length > 0 || !date || !dateString) {
    throw new Error(
      `Frontmatter inválido em content/${filename}:\n${errors
        .map((error) => `  - ${error}`)
        .join("\n")}`,
    );
  }

  return { title, description, date, dateString, tags, series };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(" de ", " ")
    .replace(" de ", " ")
    .replace(".", "");
}

function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function estimateReadingTime(markdown: string): number {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~-]/g, " ");

  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function parseMarkdownFile(filename: string): Promise<Post> {
  const inputPath = path.join("content", filename);
  const raw = await Bun.file(inputPath).text();
  const parsed = matter(raw);
  const { title, description, date, dateString, tags, series } = validateFrontmatter(
    filename,
    parsed.data,
    parsed.matter,
  );

  const year = date.getUTCFullYear().toString();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const slug = path.basename(filename, ".md");
  const url = `/${year}/${month}/${slug}/`;

  return {
    title,
    description,
    date,
    dateString,
    dateDisplay: formatDate(date),
    dateLong: formatDateLong(date),
    day: String(date.getUTCDate()).padStart(2, "0"),
    monthKey: `${year}-${month}`,
    monthLabel: formatMonth(date),
    tags,
    series,
    slug,
    url,
    outputPath: path.join("dist", year, month, slug, "index.html"),
    renderedContent: await marked.parse(parsed.content),
    readingMinutes: estimateReadingTime(parsed.content),
  };
}

function groupByMonth(posts: Post[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  for (const post of posts) {
    let group = groups.find((candidate) => candidate.id === post.monthKey);

    if (!group) {
      group = { id: post.monthKey, month: post.monthLabel, posts: [] };
      groups.push(group);
    }

    group.posts.push(post);
  }

  return groups;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeCdata(value: string): string {
  return value.replaceAll("]]>", "]]]]><![CDATA[>");
}

function createFeed(posts: Post[]): string {
  const lastBuildDate = posts[0]?.date.toUTCString() ?? new Date().toUTCString();
  const items = posts
    .map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}${post.url}</link>
      <guid isPermaLink="true">${SITE_URL}${post.url}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>${post.tags
        .map((tag) => `\n      <category>${escapeXml(tag)}</category>`)
        .join("")}
      <content:encoded><![CDATA[${escapeCdata(post.renderedContent)}]]></content:encoded>
    </item>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Bun</generator>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;
}

function createSitemap(posts: Post[]): string {
  const latest = posts[0]?.dateString ?? new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: `${SITE_URL}/`, lastmod: latest },
    { loc: `${SITE_URL}/blog/`, lastmod: latest },
    { loc: `${SITE_URL}/sobre/`, lastmod: latest },
    ...posts.map((post) => ({ loc: `${SITE_URL}${post.url}`, lastmod: post.dateString })),
  ];

  const urls = entries
    .map((entry) => `
  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

const glob = new Bun.Glob("**/*.md");
const posts: Post[] = [];

for await (const filename of glob.scan("content")) {
  posts.push(await parseMarkdownFile(filename));
}

posts.sort((a, b) => b.date.getTime() - a.date.getTime());

await rm(path.resolve("dist"), {
  recursive: true,
  force: true,
});

console.log("✓ dist limpa");

const buildYear = new Date().getUTCFullYear();

const siteContext = {
  siteName: SITE_NAME,
  siteDescription: SITE_DESCRIPTION,
  siteUrl: SITE_URL,
  buildYear,
};

for (const [index, post] of posts.entries()) {
  const newerPost = index > 0 ? posts[index - 1] : undefined;
  const olderPost = index < posts.length - 1 ? posts[index + 1] : undefined;
  const html = templates.render("post.njk", {
    ...siteContext,
    pageTitle: `${post.title} — ${SITE_NAME}`,
    canonicalUrl: `${SITE_URL}${post.url}`,
    bodyClass: "post-page",
    navActive: "posts",
    post,
    newerPost,
    olderPost,
  });

  await Bun.write(post.outputPath, html);
  console.log(`✓ ${post.title}`);
  console.log(`  → ${post.url}`);
}

const assetVersion = Date.now().toString(36);

const schemaJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Sapará Dev",
  url: `${SITE_URL}/`,
  email: contact.email,
  telephone: `+${contact.whatsapp}`,
  founder: { "@type": "Person", name: "Valdeir Sapará" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Boa Vista",
    addressRegion: "RR",
    addressCountry: "BR",
  },
  areaServed: { "@type": "City", name: "Boa Vista" },
}).replaceAll("<", "\\u003c");

const commercialContext = {
  ...siteContext,
  assetVersion,
  schemaJson,
  contact,
  waLink: whatsappLink(),
};

const homeHtml = templates.render("site/home.njk", {
  ...commercialContext,
  pageTitle: "Sapará Dev — Atendimento no WhatsApp, sites e sistemas em Boa Vista - RR",
  ogTitle: "Sapará Dev — sua empresa atendendo no WhatsApp de dia e de noite",
  pageDescription:
    "Atendimento automático no WhatsApp, sites e sistemas sob medida para clínicas, laboratórios, veterinárias e pequenas empresas de Boa Vista - RR. Preço fechado e prazo definido.",
  canonicalUrl: `${SITE_URL}/`,
  bodyClass: "home",
  navActive: "home",
  differentials,
  packages,
  steps,
  cases,
  segments,
  stats,
  maker,
  recentPosts: posts.filter((post) => !homeHiddenPosts.includes(post.slug)).slice(0, 2),
});

const blogHtml = templates.render("home.njk", {
  ...siteContext,
  pageTitle: `Blog — ${SITE_NAME}`,
  canonicalUrl: `${SITE_URL}/blog/`,
  bodyClass: "home-page",
  navActive: "posts",
  posts,
  groups: groupByMonth(posts),
  oldestYear: posts.at(-1)?.date.getUTCFullYear() ?? buildYear,
});

const sobreHtml = templates.render("sobre.njk", {
  ...siteContext,
  pageTitle: `Sobre — ${SITE_NAME}`,
  pageDescription: `Sobre ${SITE_NAME}: quem escreve aqui e como este site é feito.`,
  canonicalUrl: `${SITE_URL}/sobre/`,
  bodyClass: "sobre-page",
  navActive: "sobre",
});

await Promise.all([
  Bun.write(path.join("dist", "index.html"), homeHtml),
  Bun.write(path.join("dist", "blog", "index.html"), blogHtml),
  Bun.write(path.join("dist", "site.css"), Bun.file(path.join("static", "site.css"))),
  Bun.write(path.join("dist", "site.js"), Bun.file(path.join("static", "site.js"))),
  Bun.write(path.join("dist", "motion.js"), Bun.file(path.join("static", "motion.js"))),
  Bun.write(path.join("dist", "sobre", "index.html"), sobreHtml),
  Bun.write(path.join("dist", "styles.css"), Bun.file(path.join("static", "styles.css"))),
  Bun.write(path.join("dist", "favicon.svg"), Bun.file(path.join("static", "favicon.svg"))),
  Bun.write(path.join("dist", "favicon.ico"), Bun.file(path.join("static", "favicon.ico"))),
  Bun.write(path.join("dist", "apple-touch-icon.png"), Bun.file(path.join("static", "apple-touch-icon.png"))),
  Bun.write(path.join("dist", "icon-512.png"), Bun.file(path.join("static", "icon-512.png"))),
  Bun.write(path.join("dist", "feed.xml"), createFeed(posts)),
  Bun.write(path.join("dist", "sitemap.xml"), createSitemap(posts)),
  Bun.write(
    path.join("dist", "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  ),
]);

// Imagens do site (ex.: foto da seção "Quem faz"): static/img/** → dist/img/**
for await (const file of new Bun.Glob("**/*").scan("static/img")) {
  await Bun.write(path.join("dist", "img", file), Bun.file(path.join("static", "img", file)));
}

console.log("✓ / (home comercial)");
console.log("✓ /blog/");
console.log("✓ /sobre/");

// Pendências de conteúdo: itens ocultos no site até serem preenchidos
const pending: string[] = [];
if (isPending(contact.cnpj)) pending.push("CNPJ (rodapé)");
if (isPending(contact.instagram)) pending.push("Instagram (rodapé)");
if (isPending(maker.photo)) pending.push("foto da seção Quem faz (static/img/ + maker.photo)");
for (const item of cases) {
  if (isPending(item.metric)) pending.push(`case ${item.name}: número do resultado (card aparece sem ele)`);
}
for (const item of stats) {
  if (isPending(item.value)) pending.push(`número oculto na linha do hero: "${item.value}${item.suffix} ${item.label}"`);
}
if (pending.length > 0) {
  console.log(`\n⚠ ${pending.length} ${pending.length === 1 ? "item oculto" : "itens ocultos"} até preencher (src/site-data.ts):`);
  for (const item of pending) console.log(`  - ${item}`);
}
console.log("✓ /sitemap.xml");
console.log(`\n${posts.length} texto${posts.length === 1 ? "" : "s"} publicado${posts.length === 1 ? "" : "s"}.`);
