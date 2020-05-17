const fs = require("fs");
const slugify = require("slugify");
const { Remarkable } = require("remarkable");
const breakdance = require("breakdance");

const getDirectories = (source) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

exports.create = async (req, res) => {
  const { title, indexPageType } = req.body;
  const pageTypeRegex = /^(html|md)$/;
  if (!pageTypeRegex.test(indexPageType))
    throw "Index page type must be html or md.";

  if (!title) throw "Book title is required.";
  const slug = slugify(title, { lower: true });

  const bookPath = "./docs/" + slug;

  if (fs.existsSync(bookPath))
    throw "A book with the title provided already exists.";

  fs.mkdirSync(bookPath);

  const indexFile = "index." + indexPageType;

  const bookJSON = {
    title,
    slug,
    pages: [
      {
        title,
        slug: "index",
        fileName: indexFile,
        pages: null,
      },
    ],
  };

  const indexMarkdown = "# " + title;

  const md = new Remarkable();

  const indexPageContent =
    indexPageType === "html" ? md.render(indexMarkdown) : indexMarkdown;

  fs.writeFileSync(bookPath + "/" + indexFile, indexPageContent);
  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `Book [${title}] was created.`,
  });
};

exports.getAllBooks = async (req, res) => {
  const dirs = getDirectories("./docs");

  const titles = dirs.map((dir) => {
    const bookJSON = JSON.parse(
      fs.readFileSync("./docs/" + dir + "/index.json")
    );
    return { slug: dir, title: bookJSON.title };
  });
  res.json(titles);
};

exports.getBookJSON = async (req, res) => {
  const bookJSON = JSON.parse(
    fs.readFileSync("./docs/" + req.params.bookSlug + "/index.json")
  );
  res.json(bookJSON);
};

exports.getPageContent = async (req, res) => {
  const bookJSON = JSON.parse(
    fs.readFileSync("./docs/" + req.params.bookSlug + "/index.json")
  );

  if (!bookJSON.pages) {
    bookJSON.pages = [];
  }

  const [page] = bookJSON.pages.filter(
    (page) => page.slug === req.params.pageSlug
  );

  if (!page) throw "Page not found.";

  const pageContent = fs
    .readFileSync("./docs/" + req.params.bookSlug + "/" + page.fileName)
    .toString();

  res.send(pageContent);
};

exports.getSubPageContent = async (req, res) => {
  const bookJSON = JSON.parse(
    fs.readFileSync("./docs/" + req.params.bookSlug + "/index.json")
  );

  const [page] = bookJSON.pages.filter(
    (page) => page.slug === req.params.pageSlug
  );

  if (!page) throw "Page not found.";

  if (!page.pages) {
    page.pages = [];
  }

  const [subPage] = page.pages.filter(
    (subPage) => subPage.slug === req.params.subPageSlug
  );

  if (!subPage) throw "Sub page not found.";

  const pageContent = fs
    .readFileSync("./docs/" + req.params.bookSlug + "/" + subPage.fileName)
    .toString();

  res.send(pageContent);
};

exports.createPage = async (req, res) => {
  const { title, pageType } = req.body;
  const slug = slugify(title, { lower: true });

  const pageTypeRegex = /^(html|md)$/;
  if (!pageTypeRegex.test(pageType)) throw "Page type must be html or md.";

  if (!title) throw "Page title is required.";

  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  const samePages = bookJSON.pages.filter((page) => page.slug === slug);
  if (samePages.length > 0) throw "Page with that title already exists.";

  const newPage = {
    title,
    slug,
    fileName: slug + "." + pageType,
    pages: null,
  };

  bookJSON.pages.push(newPage);

  const pageMarkdown = "# " + title;

  const md = new Remarkable();

  const pageContent =
    pageType === "html" ? md.render(pageMarkdown) : pageMarkdown;

  fs.writeFileSync(bookPath + "/" + newPage.fileName, pageContent);
  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `New Page [${title}] was created on Book [${bookJSON.title}]`,
  });
};

exports.createSubPage = async (req, res) => {
  const { title, pageType } = req.body;
  const slug = slugify(title, { lower: true });

  const pageTypeRegex = /^(html|md)$/;
  if (!pageTypeRegex.test(pageType)) throw "Page type must be html or md.";

  if (!title) throw "Page title is required.";

  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  const newPage = {
    title,
    slug: targetPage.slug + "-" + slug,
    fileName: targetPage.slug + "-" + slug + "." + pageType,
    pages: null,
  };

  if (!bookJSON.pages[pageIndex].pages) {
    bookJSON.pages[pageIndex].pages = [];
  }

  bookJSON.pages[pageIndex].pages.push(newPage);

  const pageMarkdown = "# " + title;

  const md = new Remarkable();

  const pageContent =
    pageType === "html" ? md.render(pageMarkdown) : pageMarkdown;

  fs.writeFileSync(bookPath + "/" + newPage.fileName, pageContent);
  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `A Sub Page [${title}] was created on Page [${targetPage.title}] inside Book [${bookJSON.title}]`,
  });
};

exports.editPage = async (req, res) => {
  const { content } = req.body;

  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  const pagePath = bookPath + "/" + targetPage.fileName;

  fs.writeFileSync(pagePath, content);

  res.json({
    message: `Page [${targetPage.title}] inside Book [${bookJSON.title}] was edited.`,
  });
};

exports.editSubPage = async (req, res) => {
  const { content } = req.body;

  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  let subPageIndex = -1;
  targetPage.pages.forEach((subPage, i) => {
    if (subPage.slug === req.params.subPageSlug) {
      subPageIndex = i;
    }
  });

  if (subPageIndex === -1) throw "Sub Page not found.";

  const subPage = targetPage.pages[subPageIndex];

  const subPagePath = bookPath + "/" + subPage.fileName;

  fs.writeFileSync(subPagePath, content);

  res.json({
    message: `Sub Page [${subPage.title}] of Page [${targetPage.title}] inside Book [${bookJSON.title}] was edited.`,
  });
};

exports.deletePage = async (req, res) => {
  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  bookJSON.pages = bookJSON.pages.filter(
    (page) => page.slug !== req.params.pageSlug
  );

  targetPage.pages.forEach((page) => {
    const subPagePath = bookPath + "/" + page.fileName;
    fs.unlinkSync(subPagePath);
  });

  const pagePath = bookPath + "/" + targetPage.fileName;
  fs.unlinkSync(pagePath);

  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `Page [${targetPage.title}] inside Book [${bookJSON.title}] was deleted.`,
  });
};

exports.deleteSubPage = async (req, res) => {
  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  let subPageIndex = -1;
  targetPage.pages.forEach((subPage, i) => {
    if (subPage.slug === req.params.subPageSlug) {
      subPageIndex = i;
    }
  });

  if (subPageIndex === -1) throw "Sub Page not found.";

  const subPage = targetPage.pages[subPageIndex];

  bookJSON.pages[pageIndex].pages = bookJSON.pages[pageIndex].pages.filter(
    (page) => page.slug !== req.params.subPageSlug
  );

  if (bookJSON.pages[pageIndex].pages.length == 0) {
    bookJSON.pages[pageIndex].pages = null;
  }

  const subPagePath = bookPath + "/" + subPage.fileName;
  fs.unlinkSync(subPagePath);
  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `Sub Page [${subPage.title}] of Page [${targetPage.title}] inside Book [${bookJSON.title}] was deleted.`,
  });
};

exports.switchSubPageMakdownHTML = async (req, res) => {
  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  let subPageIndex = -1;
  targetPage.pages.forEach((subPage, i) => {
    if (subPage.slug === req.params.subPageSlug) {
      subPageIndex = i;
    }
  });

  if (subPageIndex === -1) throw "Sub Page not found.";

  const subPage = targetPage.pages[subPageIndex];

  const subPagePath = bookPath + "/" + subPage.fileName;

  let pageContent = fs.readFileSync(subPagePath).toString();

  let convertedFrom = "";

  if (/html$/.test(subPagePath)) {
    bookJSON.pages[pageIndex].pages[subPageIndex].fileName = bookJSON.pages[
      pageIndex
    ].pages[subPageIndex].fileName.replace(/html$/, "md");
    convertedFrom = "HTML to Markdown";
    pageContent = breakdance(pageContent);
  } else {
    bookJSON.pages[pageIndex].pages[subPageIndex].fileName = bookJSON.pages[
      pageIndex
    ].pages[subPageIndex].fileName.replace(/md$/, "html");
    convertedFrom = "Markdown to HTML";
    const md = new Remarkable();
    pageContent = md.render(pageContent);
  }

  const renameSubPagePath =
    bookPath + "/" + bookJSON.pages[pageIndex].pages[subPageIndex].fileName;

  fs.writeFileSync(subPagePath, pageContent);
  fs.renameSync(subPagePath, renameSubPagePath);
  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `Sub Page [${subPage.title}] of Page [${targetPage.title}] inside Book [${bookJSON.title}] was converted from ${convertedFrom}.`,
  });
};

exports.switchPageMakdownHTML = async (req, res) => {
  const bookPath = "./docs/" + req.params.bookSlug;

  const bookJSON = JSON.parse(fs.readFileSync(bookPath + "/index.json"));

  let pageIndex = -1;
  bookJSON.pages.forEach((page, i) => {
    if (page.slug === req.params.pageSlug) {
      pageIndex = i;
    }
  });

  if (pageIndex === -1) throw "Page not found.";

  const targetPage = bookJSON.pages[pageIndex];

  const pagePath = bookPath + "/" + targetPage.fileName;

  let pageContent = fs.readFileSync(pagePath).toString();

  let convertedFrom = "";

  if (/html$/.test(pagePath)) {
    bookJSON.pages[pageIndex].fileName = bookJSON.pages[
      pageIndex
    ].fileName.replace(/html$/, "md");
    convertedFrom = "HTML to Markdown";
    pageContent = breakdance(pageContent);
  } else {
    bookJSON.pages[pageIndex].fileName = bookJSON.pages[
      pageIndex
    ].fileName.replace(/md$/, "html");
    convertedFrom = "Markdown to HTML";
    const md = new Remarkable();
    pageContent = md.render(pageContent);
  }

  const renamePagePath = bookPath + "/" + bookJSON.pages[pageIndex].fileName;

  fs.writeFileSync(pagePath, pageContent);
  fs.renameSync(pagePath, renamePagePath);
  fs.writeFileSync(bookPath + "/index.json", JSON.stringify(bookJSON, null, 2));

  res.json({
    message: `Page [${targetPage.title}] inside Book [${bookJSON.title}] was converted from ${convertedFrom}.`,
  });
};
