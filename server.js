require("dotenv").config();
const app = require("./src/app");
const { startPdfCron } = require("./src/jobs/pdfCron.job");

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`BillboardEye API running on port ${port}`);
  console.log(`NODE_ENV=${process.env.NODE_ENV || "development"}`);
  console.log(
    `CORS_ORIGINS=${process.env.CORS_ORIGINS ? "configured" : "auto"} | ADMIN_WEB_URL=${process.env.ADMIN_WEB_URL ? "set" : "unset"} | MOBILE_WEB_URL=${process.env.MOBILE_WEB_URL ? "set" : "unset"}`
  );
  console.log(`Test PDF: GET /api/test-pdf | Debug: GET /api/rapport/projet/:id/debug`);
  startPdfCron();
});
