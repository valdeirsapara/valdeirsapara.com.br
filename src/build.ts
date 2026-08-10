import { marked } from "marked";
import matter from "gray-matter";
import path from "node:path";


type Post = {
  title: string;
  description: string;
  date: Date;
  slug: string;
  url: string;
};


async function parseMarkdownFile(filename: string): Promise<Post> {
  const inputPath = path.join("content", filename);

  const raw = await Bun.file(inputPath).text();

  const { data, content: markdown } = matter(raw);

  const title = data.title;
  const description = data.description ?? "";
  const date = new Date(data.date);

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

      <time datetime="${data.date}">
        ${data.date}
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