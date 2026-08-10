import { marked } from "marked";
import matter from "gray-matter";
import path from "node:path";


type Post = {
  title: string;
  description: string;
  date: Date;
  dateString: string;
  slug: string;
  url: string;
};

type Frontmatter = {
  title: string;
  description: string;
  date: Date;
  dateString: string;
};


function validateFrontmatter(
  filename: string,
  data: Record<string, unknown>,
  rawFrontmatter: string
): Frontmatter {
  const errors: string[] = [];

  const title = typeof data.title === "string"
    ? data.title.trim()
    : "";

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

  const dateString = rawFrontmatter.match(
    /^\s*date\s*:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*(?:#.*)?$/m
  )?.[1];

  let date: Date | undefined;
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    errors.push('"date" é obrigatório e deve usar o formato AAAA-MM-DD');
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

  if (errors.length > 0 || !date || typeof dateString !== "string") {
    throw new Error(
      `Frontmatter inválido em content/${filename}:\n${errors
        .map((error) => `  - ${error}`)
        .join("\n")}`
    );
  }

  return { title, description, date, dateString };
}


async function parseMarkdownFile(filename: string): Promise<Post> {
  const inputPath = path.join("content", filename);

  const raw = await Bun.file(inputPath).text();

  const parsed = matter(raw);
  const { data, content: markdown } = parsed;

  const { title, description, date, dateString } = validateFrontmatter(
    filename,
    data,
    parsed.matter
  );

  const year = date.getUTCFullYear().toString();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  const slug = path.basename(filename, ".md");

  const url = `/${year}/${month}/${slug}/`;

  const outputDir = path.join(
    "dist",
    year,
    month,
    slug
  );

  const outputPath = path.join(
    outputDir,
    "index.html"
  );

  const renderedContent = await marked.parse(markdown);

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${title}</title>
  <meta name="description" content="${description}">
</head>

<body>
  <main>
    <article>
      <h1>${title}</h1>

      <time datetime="${dateString}">
        ${dateString}
      </time>

      ${renderedContent}
    </article>
  </main>
</body>
</html>
`;

  await Bun.write(outputPath, html);

  console.log(`✓ ${filename}`);
  console.log(`  → ${url}`);

  return {
    title,
    description,
    date,
    dateString,
    slug,
    url,
  };
}


const glob = new Bun.Glob("**/*.md");
const posts: Post[] = [];
for await (const filename of glob.scan("content")) {
  const post = await parseMarkdownFile(filename);

  posts.push(post);
}

function grupypPostsByMonth(posts: Post[]): Record<string, Post[]> {
    const groupedPosts: Record<string, Post[]> = {};
    for (const post of posts) {
        const monthYear = post.date.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        });
        const key = monthYear;
        if (!groupedPosts[key]) {
            groupedPosts[key] = [];
        }
        groupedPosts[key].push(post);
    }
    return groupedPosts;
}

posts.sort(
  (a, b) => b.date.getTime() - a.date.getTime()
);

const groupedPosts = grupypPostsByMonth(posts);

const grupedPostsHtml = Object.entries(groupedPosts)
  .map(([month, posts]) => {
    return `
      <section>
        <h2>${month}</h2>
        ${posts.map((post) => `
          <article>
            <h3><a href="${post.url}">${post.title}</a></h3>
            <p>${post.description}</p>
          </article>
        `).join("")}
      </section>
    `;
  })
  .join("");

const homeHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Valdeir Sapará</title>

  <meta
    name="description"
    content="Notas, experimentos e coisas que estou aprendendo."
  >
</head>

<body>
  <header>
    <h1>Valdeir Sapará</h1>

    <p>
      Notas, experimentos e coisas que estou aprendendo.
    </p>
  </header>

  <main>
    ${grupedPostsHtml}
  </main>
</body>
</html>
`;

await Bun.write(
  path.join("dist", "index.html"),
  homeHtml
);
