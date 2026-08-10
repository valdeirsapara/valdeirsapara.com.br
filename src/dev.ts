import path from "node:path";

const PORT = 3000;
const DIST_DIR = path.resolve("dist");

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith("/")) {
      pathname += "index.html";
    }

    const filePath = path.join(
      DIST_DIR,
      pathname
    );

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response("404 - Not Found", {
        status: 404,
      });
    }

    return new Response(file);
  },
});

console.log(
  `Dev server: http://localhost:${PORT}`
);