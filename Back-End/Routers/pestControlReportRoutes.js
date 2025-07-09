const express = require("express");
const router = express.Router();
const pestControlReportController = require("../Controllers/pestControlReportController");

// Submit a new report
router.post("/", pestControlReportController.submitPestControlReport);

// Get reports (with filters via query)
router.get("/", pestControlReportController.getPestControlReports);

// Export reports as Excel
router.get(
  "/export",
  pestControlReportController.exportPestControlReportsExcel
);

module.exports = router;
