const PestControlReport = require("../Models/PestControlReport");
const ExcelJS = require("exceljs");

// Submit a new pest control report
exports.submitPestControlReport = async (req, res) => {
  try {
    const data = req.body;
    // Calculate totalSites
    const totalSites = Object.values(data.siteCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    const report = new PestControlReport({ ...data, totalSites });
    await report.save();
    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pest control reports with optional filters
exports.getPestControlReports = async (req, res) => {
  try {
    const { startDate, endDate, districts } = req.query;
    let filter = {};
    if (startDate) filter.date = { $gte: startDate };
    if (endDate) filter.date = { ...(filter.date || {}), $lte: endDate };
    if (districts)
      filter.municipality = {
        $in: Array.isArray(districts) ? districts : [districts],
      };
    const reports = await PestControlReport.find(filter);

    // Helper functions
    const groupBy = (arr, keyFn) => {
      return arr.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    };
    const getDate = (report) => report.date;
    const getWeek = (report) => {
      const d = new Date(report.date);
      const year = d.getFullYear();
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((d - onejan) / 86400000 + onejan.getDay() + 1) / 7
      );
      return `${year}-W${week}`;
    };
    const getMonth = (report) => {
      const d = new Date(report.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    // Group reports
    const dailyGroups = groupBy(reports, getDate);
    const weeklyGroups = groupBy(reports, getWeek);
    const monthlyGroups = groupBy(reports, getMonth);

    // Helper to calculate stats for a group
    const calcStats = (group, dateRange) => {
      if (!group || group.length === 0)
        return {
          totalRecords: 0,
          highestSite: { type: "", count: 0 },
          mostActiveDistrict: "",
          totalSites: 0,
          dateRange: dateRange || "",
        };
      // Highest site type
      const siteTypeCounts = {};
      let totalSites = 0;
      const districtCounts = {};
      group.forEach((r) => {
        Object.entries(r.siteCounts || {}).forEach(([type, count]) => {
          siteTypeCounts[type] = (siteTypeCounts[type] || 0) + count;
          totalSites += count;
        });
        districtCounts[r.district] = (districtCounts[r.district] || 0) + 1;
      });
      const highestSiteType = Object.entries(siteTypeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0] || ["", 0];
      const mostActiveDistrict =
        Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "";
      return {
        totalRecords: group.length,
        highestSite: { type: highestSiteType[0], count: highestSiteType[1] },
        mostActiveDistrict,
        totalSites,
        dateRange: dateRange || "",
      };
    };
    // Get most recent day/week/month for stats
    const getMostRecentKey = (obj) => Object.keys(obj).sort().reverse()[0];
    // Date range helpers
    const formatDate = (d) => new Date(d).toLocaleDateString("en-GB");
    const getDateRange = (group) => {
      if (!group || group.length === 0) return "";
      const dates = group.map((r) => r.date).sort();
      return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
    };
    // Prepare response
    const dailyReports = Object.values(dailyGroups).map((group) => ({
      date: group[0].date,
      reports: group,
    }));
    const weeklyReports = Object.entries(weeklyGroups).map(([week, group]) => ({
      week,
      reports: group,
    }));
    const monthlyReports = Object.entries(monthlyGroups).map(
      ([month, group]) => ({
        month,
        reports: group,
      })
    );
    // Statistics for most recent group
    const mostRecentDay = getMostRecentKey(dailyGroups);
    const mostRecentWeek = getMostRecentKey(weeklyGroups);
    const mostRecentMonth = getMostRecentKey(monthlyGroups);
    const statistics = {
      daily: calcStats(
        dailyGroups[mostRecentDay],
        mostRecentDay ? getDateRange(dailyGroups[mostRecentDay]) : ""
      ),
      weekly: calcStats(weeklyGroups[mostRecentWeek], mostRecentWeek),
      monthly: calcStats(monthlyGroups[mostRecentMonth], mostRecentMonth),
    };
    res.json({
      dailyReports,
      weeklyReports,
      monthlyReports,
      detailedReports: reports,
      statistics,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export pest control reports as Excel
exports.exportPestControlReportsExcel = async (req, res) => {
  try {
    const { startDate, endDate, districts, type = "detailed" } = req.query;
    let filter = {};
    if (startDate) filter.date = { $gte: startDate };
    if (endDate) filter.date = { ...(filter.date || {}), $lte: endDate };
    if (districts)
      filter.municipality = {
        $in: Array.isArray(districts) ? districts : [districts],
      };
    const reports = await PestControlReport.find(filter);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reports");

    // Define all possible site types and municipalities (static for now, can be dynamic)
    const allSiteTypes = [
      "المواقع المستكشفة",
      "المواقع السلبية",
      "المواقع الايجابية",
      "المواقع الدائمة",
      "تجمعات مياه",
      "سقيا الطيور",
      "مناهل مكشوفة",
      "الاحواش المهجورة",
      "مباني تحت الانشاء",
      "الحدائق العامة",
      "المساجد",
      "مجاري تصريف",
      "الاحواض الاسمنتية",
      "إطارات سيارات",
      "مزهريات",
      "الحالات المباشرة",
      "بلاغات 940",
    ];
    const allMunicipalities = [
      "العزيزية",
      "المعابدة",
      "الشرائع",
      "العتيبة",
      "الزيمة",
      "المشاعر المقدسة",
    ];

    if (type !== "detailed") {
      // Grouping helpers
      const groupBy = (arr, keyFn) => {
        return arr.reduce((acc, item) => {
          const key = keyFn(item);
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});
      };
      const getDate = (report) => report.date;
      const getWeek = (report) => {
        const d = new Date(report.date);
        const day = d.getDay();
        const sunday = new Date(d);
        sunday.setDate(d.getDate() - day);
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        const format = (dt) => dt.toISOString().split("T")[0];
        return `${format(sunday)} إلى ${format(saturday)}`;
      };
      const getMonth = (report) => {
        const d = new Date(report.date);
        return `${d.getFullYear()}/${d.getMonth() + 1}`;
      };
      let groups = {};
      let reportTitle = "";
      if (type === "daily") {
        groups = groupBy(reports, getDate);
      } else if (type === "weekly") {
        groups = groupBy(reports, getWeek);
      } else if (type === "monthly") {
        groups = groupBy(reports, getMonth);
      }
      // For each group (usually one for filtered export)
      let startRow = 6; // Start from row 6
      let startCol = 2; // Start from column B
      for (const [groupKey, groupReports] of Object.entries(groups)) {
        if (type === "daily") {
          reportTitle = `تقرير يومي - ${groupKey}`;
        } else if (type === "weekly") {
          reportTitle = `تقرير أسبوعي - الأسبوع من ${groupKey}`;
        } else if (type === "monthly") {
          reportTitle = `تقرير شهري - ${groupKey}`;
        }
        // Calculate metadata
        let totalSites = 0;
        let siteTypeCounts = {};
        let districtCounts = {};
        groupReports.forEach((r) => {
          Object.entries(r.siteCounts || {}).forEach(([type, count]) => {
            siteTypeCounts[type] = (siteTypeCounts[type] || 0) + count;
            totalSites += count;
          });
          districtCounts[r.municipality] =
            (districtCounts[r.municipality] || 0) + 1;
        });
        const highestSiteType = Object.entries(siteTypeCounts).sort(
          (a, b) => b[1] - a[1]
        )[0] || ["", 0];
        const mostActiveMunicipality =
          Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "";
        // Write metadata
        worksheet.getCell(startRow, startCol).value = reportTitle;
        worksheet.getCell(startRow, startCol).font = {
          bold: true,
          size: 16,
          color: { argb: "#1F4E78" },
        };
        worksheet.getCell(startRow + 1, startCol).value = "";
        worksheet.getCell(
          startRow + 2,
          startCol
        ).value = `إجمالي المواقع: ${totalSites}`;
        worksheet.getCell(
          startRow + 3,
          startCol
        ).value = `أعلى نوع موقع: ${highestSiteType[0]} (${highestSiteType[1]})`;
        worksheet.getCell(
          startRow + 4,
          startCol
        ).value = `البلدية الأكثر نشاطاً: ${mostActiveMunicipality}`;
        worksheet.getCell(startRow + 5, startCol).value = "";
        let rowPtr = startRow + 6;
        // --- Table ---
        // Header row
        const headerVals = [
          "المواقع المستهدفة",
          ...allMunicipalities,
          "الاجمال",
        ];
        headerVals.forEach((val, idx) => {
          const cell = worksheet.getCell(rowPtr, startCol + idx);
          cell.value = val;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "#F79646" }, // Orange
          };
          cell.font = { bold: true, color: { argb: "#FFFFFF" } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        rowPtr++;
        // Data rows
        let isAlt = false;
        for (const siteType of allSiteTypes) {
          const rowData = allMunicipalities.map((municipality) => {
            return groupReports
              .filter((r) => r.municipality === municipality)
              .reduce((sum, r) => sum + (r.siteCounts?.[siteType] || 0), 0);
          });
          const rowTotal = rowData.reduce((a, b) => a + b, 0);
          [siteType, ...rowData, rowTotal].forEach((val, idx) => {
            const cell = worksheet.getCell(rowPtr, startCol + idx);
            cell.value = val;
            cell.font = { color: { argb: "#222222" }, size: 12 };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: idx === 0 ? "#F79646" : isAlt ? "#F2F2F2" : "#FFFFFF",
              },
            };
            if (idx === 0)
              cell.font = { bold: true, color: { argb: "#FFFFFF" } };
          });
          isAlt = !isAlt;
          rowPtr++;
        }
        // Totals row
        const totals = allMunicipalities.map((municipality) => {
          return allSiteTypes.reduce((sum, siteType) => {
            return (
              sum +
              groupReports
                .filter((r) => r.municipality === municipality)
                .reduce((s, r) => s + (r.siteCounts?.[siteType] || 0), 0)
            );
          }, 0);
        });
        const grandTotal = totals.reduce((a, b) => a + b, 0);
        ["الاجمال", ...totals, grandTotal].forEach((val, idx) => {
          const cell = worksheet.getCell(rowPtr, startCol + idx);
          cell.value = val;
          cell.font = { bold: true, color: { argb: "#FFFFFF" }, size: 13 };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "#F79646" },
          };
          cell.border = {
            top: { style: "medium" },
            left: { style: "medium" },
            bottom: { style: "medium" },
            right: { style: "medium" },
          };
        });
        rowPtr++;
        // Add some spacing after the table
        rowPtr += 2;
      }
      // Set column widths for better appearance
      for (let c = 0; c < allMunicipalities.length + 2; c++) {
        worksheet.getColumn(startCol + c).width = 18;
      }
      // Set file name
      let fileName = reportTitle
        ? `${reportTitle}.xlsx`
        : `report_${type}_${Date.now()}.xlsx`;
      const encodedFileName = encodeURIComponent(fileName);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodedFileName}`
      );
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // Detailed: One row per report, columns as in frontend
    worksheet.columns = [
      { header: "اسم الأخصائي", key: "workerName", width: 20 },
      { header: "التاريخ", key: "date", width: 15 },
      { header: "البلدية", key: "municipality", width: 15 },
      { header: "الحي", key: "district", width: 15 },
      { header: "نوع المكافحة", key: "controlType", width: 15 },
      { header: "إجمالي المواقع", key: "totalSites", width: 15 },
      { header: "الإحداثيات", key: "coordinates", width: 25 },
    ];
    reports.forEach((r) => {
      worksheet.addRow({
        workerName: r.workerName,
        date: r.date,
        municipality: r.municipality,
        district: r.district,
        controlType: r.controlType,
        totalSites: r.totalSites,
        coordinates: r.coordinates
          ? `${r.coordinates.latitude}, ${r.coordinates.longitude}`
          : "",
      });
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reports_detailed_${Date.now()}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: error.message });
  }
};
