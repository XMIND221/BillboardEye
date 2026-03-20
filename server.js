require("dotenv").config();
const app = require("./src/app");
const { startPdfCron } = require("./src/jobs/pdfCron.job");

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`BillboardEye API running on port ${port}`);
  console.log(`Test PDF: GET /api/test-pdf | Debug: GET /api/rapport/projet/:id/debug`);
  startPdfCron();
});
