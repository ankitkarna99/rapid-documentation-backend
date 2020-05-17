const router = require("express").Router();
const bookController = require("../controllers/bookController");
const { catchErrors } = require("../handlers/errorHandlers");

router.post("/create", catchErrors(bookController.create));
router.get("/all", catchErrors(bookController.getAllBooks));
router.get("/:bookSlug", catchErrors(bookController.getBookJSON));
router.get("/:bookSlug/:pageSlug", catchErrors(bookController.getPageContent));
router.get(
  "/:bookSlug/:pageSlug/:subPageSlug",
  catchErrors(bookController.getSubPageContent)
);
router.post("/:bookSlug/createPage", catchErrors(bookController.createPage));
router.post(
  "/:bookSlug/:pageSlug/createSubPage",
  catchErrors(bookController.createSubPage)
);

router.patch("/:bookSlug/:pageSlug/edit", catchErrors(bookController.editPage));
router.patch(
  "/:bookSlug/:pageSlug/:subPageSlug/edit",
  catchErrors(bookController.editSubPage)
);
router.patch(
  "/:bookSlug/:pageSlug/switch",
  catchErrors(bookController.switchPageMakdownHTML)
);
router.patch(
  "/:bookSlug/:pageSlug/:subPageSlug/switch",
  catchErrors(bookController.switchSubPageMakdownHTML)
);
router.delete("/:bookSlug/deleteBook", catchErrors(bookController.deleteBook));
router.delete(
  "/:bookSlug/:pageSlug/delete",
  catchErrors(bookController.deletePage)
);
router.delete(
  "/:bookSlug/:pageSlug/:subPageSlug/delete",
  catchErrors(bookController.deleteSubPage)
);

module.exports = router;
