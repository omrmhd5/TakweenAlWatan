const PestControlReport = require("../Models/PestControlReport");
const ExcelJS = require("exceljs");
const { t } = require("../lib/i18n");

// Site type mapping to handle data migration from old names to new names
const siteTypeMapping = {
  // Old names -> New names
  "المواقع الايجابية": "المواقع الإيجابية",
  "مناهل مكشوفة": "مناهل مكشوفه",
  "الاحواش المهجورة": "احواش مهجورة",
  "الحدائق العامة": "حدائق عامة",
  "الاحواض الاسمنتية": "حوض اسمنتي",
  "إطارات سيارات": "الإطارات",
  // Keep the extra types that weren't in the image
  "الحالات المباشرة": "الحالات المباشرة",
  "بلاغات 940": "بلاغات 940",
};

// Function to transform site counts from old format to new format
const transformSiteCounts = (siteCounts) => {
  const transformed = {};

  Object.entries(siteCounts || {}).forEach(([oldKey, value]) => {
    const newKey = siteTypeMapping[oldKey] || oldKey;
    transformed[newKey] = value;
  });

  return transformed;
};

// Submit a new pest control report
exports.submitPestControlReport = async (req, res) => {
  try {
    const data = req.body;
    // Transform site counts to new format before saving
    data.siteCounts = transformSiteCounts(data.siteCounts);
    // Calculate totalSites
    const totalSites = Object.values(data.siteCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    const report = new PestControlReport({ ...data, totalSites });
    await report.save();
    res.status(201).json({ message: t(req, "success.reportSubmitted"), report });
  } catch (error) {
    res.status(500).json({ error: t(req, "errors.submitFailed") });
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

    // Transform site counts for all reports to handle old data format
    const transformedReports = reports.map((report) => ({
      ...report.toObject(),
      siteCounts: transformSiteCounts(report.siteCounts),
    }));

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
    const dailyGroups = groupBy(transformedReports, getDate);
    const weeklyGroups = groupBy(transformedReports, getWeek);
    const monthlyGroups = groupBy(transformedReports, getMonth);

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
    // Use today's date for daily stats
    const todayISO = new Date().toISOString().split("T")[0];
    const todayGroup = dailyGroups[todayISO];
    const mostRecentWeek = getMostRecentKey(weeklyGroups);
    const mostRecentMonth = getMostRecentKey(monthlyGroups);
    const statistics = {
      daily: calcStats(todayGroup, todayGroup ? getDateRange(todayGroup) : ""),
      weekly: calcStats(weeklyGroups[mostRecentWeek], mostRecentWeek),
      monthly: calcStats(monthlyGroups[mostRecentMonth], mostRecentMonth),
    };
    res.json({
      dailyReports,
      weeklyReports,
      monthlyReports,
      detailedReports: transformedReports,
      statistics,
    });
  } catch (error) {
    res.status(500).json({ error: t(req, "errors.fetchFailed") });
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

    // Transform site counts for all reports to handle old data format
    const transformedReports = reports.map((report) => ({
      ...report.toObject(),
      siteCounts: transformSiteCounts(report.siteCounts),
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("تقرير مكافحة الآفات");

    // Define all possible site types and municipalities
    const siteTypes = [
      "المواقع المستكشفة",
      "المواقع السلبية",
      "المواقع الإيجابية",
      "المواقع الدائمة",
      "تجمعات مياه",
      "سقيا الطيور",
      "مناهل مكشوفه",
      "احواش مهجورة",
      "مباني تحت الانشاء",
      "حدائق عامة",
      "مرافق عامة",
      "الاستراحات",
      "المساجد",
      "حوض اسمنتي",
      "الإطارات",
      "مزهريات",
      "تسريبات مياه",
      "البرادات",
      "مجاري تصريف",
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

      const getDate = (report) => {
        const d = new Date(report.date);
        return d.toISOString().split("T")[0];
      };

      const getWeek = (report) => {
        const d = new Date(report.date);
        const day = d.getDay();
        const sunday = new Date(d);
        sunday.setDate(d.getDate() - day);
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        const format = (dt) => dt.toISOString().split("T")[0];
        return `${format(sunday)}_${format(saturday)}`;
      };

      const getMonth = (report) => {
        const d = new Date(report.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      };

      let groups = {};
      let reportTitle = "";
      let fileNameDate = "";

      if (type === "daily") {
        groups = groupBy(transformedReports, getDate);
      } else if (type === "weekly") {
        groups = groupBy(transformedReports, getWeek);
      } else if (type === "monthly") {
        groups = groupBy(transformedReports, getMonth);
      }

      // Add company header and logo area
      worksheet.mergeCells("A1:J3");
      const headerCell = worksheet.getCell("A1");
      headerCell.value = "تقرير مكافحة الآفات - شركة تكوين الوطن";
      headerCell.font = {
        bold: true,
        size: 20,
        color: { argb: "FFFFFFFF" },
        name: "Arial",
      };
      headerCell.alignment = { horizontal: "center", vertical: "middle" };
      headerCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E5090" }, // Dark blue
      };
      headerCell.border = {
        top: { style: "thick", color: { argb: "FF2E5090" } },
        left: { style: "thick", color: { argb: "FF2E5090" } },
        bottom: { style: "thick", color: { argb: "FF2E5090" } },
        right: { style: "thick", color: { argb: "FF2E5090" } },
      };

      // Add generation date and time
      worksheet.mergeCells("A4:J4");
      const dateCell = worksheet.getCell("A4");
      dateCell.value = `تاريخ الإنشاء: ${new Date().toLocaleString("ar-SA")}`;
      dateCell.font = { size: 11, italic: true, color: { argb: "FF666666" } };
      dateCell.alignment = { horizontal: "center" };
      dateCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };

      let startRow = 6;
      let startCol = 1;

      // Determine the selected group key based on query
      let selectedGroupKey;
      if (type === "daily" && startDate) {
        // Normalize to ISO format for matching
        selectedGroupKey = new Date(startDate).toISOString().split("T")[0];
      } else if (type === "weekly" && startDate && endDate) {
        const format = (dt) => new Date(dt).toISOString().split("T")[0];
        selectedGroupKey = `${format(startDate)}_${format(endDate)}`;
      } else if (type === "monthly" && startDate) {
        const d = new Date(startDate);
        selectedGroupKey = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
      }

      // Only export the selected group if specified, otherwise export all (fallback)
      const selectedGroups =
        selectedGroupKey && groups[selectedGroupKey]
          ? { [selectedGroupKey]: groups[selectedGroupKey] }
          : groups;

      for (const [groupKey, groupReports] of Object.entries(selectedGroups)) {
        if (type === "daily") {
          // Display the date as the original Gregorian date (YYYY-MM-DD)
          reportTitle = `تقرير يومي - ${groupKey}`;
          fileNameDate = groupKey;
        } else if (type === "weekly") {
          const [start, end] = groupKey.split("_");
          const startDate = new Date(start).toLocaleDateString("ar-SA");
          const endDate = new Date(end).toLocaleDateString("ar-SA");
          reportTitle = `تقرير أسبوعي - من ${startDate} إلى ${endDate}`;
          fileNameDate = groupKey;
        } else if (type === "monthly") {
          const [year, month] = groupKey.split("-");
          const monthNames = {
            "01": "يناير",
            "02": "فبراير",
            "03": "مارس",
            "04": "أبريل",
            "05": "مايو",
            "06": "يونيو",
            "07": "يوليو",
            "08": "أغسطس",
            "09": "سبتمبر",
            10: "أكتوبر",
            11: "نوفمبر",
            12: "ديسمبر",
          };
          reportTitle = `تقرير شهري - ${monthNames[month]} ${year}`;
          fileNameDate = groupKey;
        }

        // Calculate metadata
        let totalSites = 0;
        let siteTypeCounts = {};
        let municipalityCounts = {};
        groupReports.forEach((r) => {
          Object.entries(r.siteCounts || {}).forEach(([type, count]) => {
            siteTypeCounts[type] = (siteTypeCounts[type] || 0) + count;
            totalSites += count;
          });
          // Sum all site counts for this report
          const siteSum = Object.values(r.siteCounts || {}).reduce(
            (a, b) => a + b,
            0
          );
          municipalityCounts[r.municipality] =
            (municipalityCounts[r.municipality] || 0) + siteSum;
        });

        const highestSiteType = Object.entries(siteTypeCounts).sort(
          (a, b) => b[1] - a[1]
        )[0] || ["", 0];
        const mostActiveMunicipality =
          Object.entries(municipalityCounts).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0] || "";

        // Report title with enhanced styling
        worksheet.mergeCells(`A${startRow}:J${startRow}`);
        const titleCell = worksheet.getCell(startRow, startCol);
        titleCell.value = reportTitle;
        titleCell.font = {
          bold: true,
          size: 18,
          color: { argb: "FF2E5090" },
          name: "Arial",
        };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8F1FF" },
        };
        titleCell.border = {
          top: { style: "medium", color: { argb: "FF2E5090" } },
          left: { style: "medium", color: { argb: "FF2E5090" } },
          bottom: { style: "medium", color: { argb: "FF2E5090" } },
          right: { style: "medium", color: { argb: "FF2E5090" } },
        };

        // Statistics section with enhanced styling
        const statsStartRow = startRow + 2;

        // Create statistics cards
        const statsData = [
          { label: "إجمالي المواقع", value: totalSites, icon: "📊" },
          {
            label: "أعلى نوع موقع",
            value: `${highestSiteType[0]} (${highestSiteType[1]})`,
            icon: "🎯",
          },
          {
            label: "البلدية الأكثر نشاطاً",
            value: mostActiveMunicipality,
            icon: "🏢",
          },
          { label: "عدد التقارير", value: groupReports.length, icon: "📋" },
        ];

        statsData.forEach((stat, index) => {
          const row = statsStartRow + Math.floor(index / 2);
          const col = (index % 2) * 5 + 1;

          // Merge cells for each stat card
          worksheet.mergeCells(row, col, row, col + 4);
          const statCell = worksheet.getCell(row, col);
          statCell.value = `${stat.icon} ${stat.label}: ${stat.value}`;
          statCell.font = {
            bold: true,
            size: 12,
            color: { argb: "FF2E5090" },
          };
          statCell.alignment = { horizontal: "center", vertical: "middle" };
          statCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F8FF" },
          };
          statCell.border = {
            top: { style: "thin", color: { argb: "FFCCCCCC" } },
            left: { style: "thin", color: { argb: "FFCCCCCC" } },
            bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
            right: { style: "thin", color: { argb: "FFCCCCCC" } },
          };
        });

        let tableStartRow = statsStartRow + 3;

        // Table header with gradient effect
        const headerVals = [
          "المواقع المستهدفة",
          ...allMunicipalities,
          "الإجمالي",
        ];
        headerVals.forEach((val, idx) => {
          const cell = worksheet.getCell(tableStartRow, idx + 1);
          cell.value = val;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4A90E2" },
          };
          cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 12,
            name: "Arial",
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "medium", color: { argb: "FF2E5090" } },
            left: { style: "thin", color: { argb: "FF2E5090" } },
            bottom: { style: "medium", color: { argb: "FF2E5090" } },
            right: { style: "thin", color: { argb: "FF2E5090" } },
          };
        });

        let rowPtr = tableStartRow + 1;

        // Data rows with enhanced styling
        let isAlt = false;
        for (const siteType of siteTypes) {
          const rowData = allMunicipalities.map((municipality) => {
            return groupReports
              .filter((r) => r.municipality === municipality)
              .reduce((sum, r) => sum + (r.siteCounts?.[siteType] || 0), 0);
          });
          const rowTotal = rowData.reduce((a, b) => a + b, 0);

          [siteType, ...rowData, rowTotal].forEach((val, idx) => {
            const cell = worksheet.getCell(rowPtr, idx + 1);
            cell.value = val;
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin", color: { argb: "FFDDDDDD" } },
              left: { style: "thin", color: { argb: "FFDDDDDD" } },
              bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
              right: { style: "thin", color: { argb: "FFDDDDDD" } },
            };

            if (idx === 0) {
              // Site type column
              cell.font = {
                bold: true,
                color: { argb: "FFFFFFFF" },
                size: 11,
              };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF6AB7FF" },
              };
            } else if (idx === headerVals.length - 1) {
              // Total column
              cell.font = {
                bold: true,
                color: { argb: "FF2E5090" },
                size: 11,
              };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8F4FD" },
              };
            } else {
              // Data columns
              cell.font = {
                color: { argb: "FF333333" },
                size: 11,
              };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: isAlt ? "FFF8F9FA" : "FFFFFFFF" },
              };

              // Highlight non-zero values
              if (val > 0) {
                cell.font = {
                  bold: true,
                  color: { argb: "FF2E5090" },
                  size: 11,
                };
              }
            }
          });
          isAlt = !isAlt;
          rowPtr++;
        }

        // Enhanced totals row
        const totals = allMunicipalities.map((municipality) => {
          return siteTypes.reduce((sum, siteType) => {
            return (
              sum +
              groupReports
                .filter((r) => r.municipality === municipality)
                .reduce((s, r) => s + (r.siteCounts?.[siteType] || 0), 0)
            );
          }, 0);
        });
        const grandTotal = totals.reduce((a, b) => a + b, 0);

        ["الإجمالي", ...totals, grandTotal].forEach((val, idx) => {
          const cell = worksheet.getCell(rowPtr, idx + 1);
          cell.value = val;
          cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 12,
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E5090" },
          };
          cell.border = {
            top: { style: "thick", color: { argb: "FF2E5090" } },
            left: { style: "medium", color: { argb: "FF2E5090" } },
            bottom: { style: "thick", color: { argb: "FF2E5090" } },
            right: { style: "medium", color: { argb: "FF2E5090" } },
          };
        });

        // Add footer
        const footerRow = rowPtr + 3;
        worksheet.mergeCells(`A${footerRow}:J${footerRow}`);
        const footerCell = worksheet.getCell(footerRow, 1);
        footerCell.value = "© شركة تكوين الوطن - قسم مكافحة الآفات";
        footerCell.font = {
          italic: true,
          size: 10,
          color: { argb: "FF666666" },
        };
        footerCell.alignment = { horizontal: "center" };
        footerCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" },
        };

        // Increment startRow to avoid overlapping merges in the next group
        startRow = footerRow + 3; // 3-row gap for spacing
      }

      // Set column widths
      worksheet.columns = [
        { width: 25 }, // Site types
        { width: 15 }, // Municipality 1
        { width: 15 }, // Municipality 2
        { width: 15 }, // Municipality 3
        { width: 15 }, // Municipality 4
        { width: 15 }, // Municipality 5
        { width: 15 }, // Municipality 6
        { width: 15 }, // Total
        { width: 15 }, // Extra
        { width: 15 }, // Extra
      ];

      // Set row heights
      worksheet.getRow(1).height = 45; // Header
      worksheet.getRow(startRow).height = 30; // Title

      // Create proper filename
      const dateStr = fileNameDate || new Date().toISOString().split("T")[0];
      const typeStr =
        type === "daily" ? "يومي" : type === "weekly" ? "أسبوعي" : "شهري";
      const fileName = `تقرير_${typeStr}_${dateStr}.xlsx`;

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

    // Enhanced detailed report section (replace the existing detailed report code)

    // Enhanced detailed report section (replace the existing detailed report code)

    // Enhanced detailed report
    // Only export the selected report (by id if provided, else by startDate)
    let selectedReport = transformedReports[0];
    if (req.query.id) {
      selectedReport =
        transformedReports.find((r) => r._id.toString() === req.query.id) ||
        transformedReports[0];
    } else if (req.query.startDate) {
      selectedReport =
        transformedReports.find((r) => r.date === req.query.startDate) ||
        transformedReports[0];
    }

    // Calculate totalSites if missing
    let totalSites = selectedReport.totalSites;
    if (typeof totalSites !== "number") {
      totalSites = Object.values(selectedReport.siteCounts || {}).reduce(
        (sum, count) => sum + count,
        0
      );
    }

    // Add company header and logo area (matching other reports)
    worksheet.mergeCells("A1:J3");
    const headerCell = worksheet.getCell("A1");
    headerCell.value = "تقرير مفصل - مكافحة الآفات - شركة تكوين الوطن";
    headerCell.font = {
      bold: true,
      size: 20,
      color: { argb: "FFFFFFFF" },
      name: "Arial",
    };
    headerCell.alignment = { horizontal: "center", vertical: "middle" };
    headerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E5090" }, // Dark blue
    };
    headerCell.border = {
      top: { style: "thick", color: { argb: "FF2E5090" } },
      left: { style: "thick", color: { argb: "FF2E5090" } },
      bottom: { style: "thick", color: { argb: "FF2E5090" } },
      right: { style: "thick", color: { argb: "FF2E5090" } },
    };

    // Add generation date and time
    worksheet.mergeCells("A4:J4");
    const dateCell = worksheet.getCell("A4");
    dateCell.value = `تاريخ الإنشاء: ${new Date().toLocaleString("ar-SA")}`;
    dateCell.font = { size: 11, italic: true, color: { argb: "FF666666" } };
    dateCell.alignment = { horizontal: "center" };
    dateCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8F9FA" },
    };

    // Display the date as the original Gregorian date (YYYY-MM-DD)
    worksheet.mergeCells("A6:J6");
    const titleCell = worksheet.getCell("A6");
    titleCell.value = `تقرير تفصيلي - ${selectedReport.date}`;
    titleCell.font = {
      bold: true,
      size: 18,
      color: { argb: "FF2E5090" },
      name: "Arial",
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F1FF" },
    };
    titleCell.border = {
      top: { style: "medium", color: { argb: "FF2E5090" } },
      left: { style: "medium", color: { argb: "FF2E5090" } },
      bottom: { style: "medium", color: { argb: "FF2E5090" } },
      right: { style: "medium", color: { argb: "FF2E5090" } },
    };

    // Enhanced metadata section with card-style layout
    const metaStartRow = 8;
    const metaData = [
      { label: "التاريخ (ميلادي)", value: selectedReport.date, icon: "📅" },
      { label: "اسم الأخصائي", value: selectedReport.workerName, icon: "👨‍💼" },
      { label: "البلدية", value: selectedReport.municipality, icon: "🏢" },
      { label: "الحي", value: selectedReport.district, icon: "🏘️" },
      { label: "نوع المكافحة", value: selectedReport.controlType, icon: "🔧" },
      { label: "إجمالي المواقع", value: totalSites, icon: "📊" },
      {
        label: "الإحداثيات",
        value: selectedReport.coordinates
          ? `${selectedReport.coordinates.latitude}, ${selectedReport.coordinates.longitude}`
          : "غير محدد",
        icon: "📍",
      },
    ];

    // Create metadata cards (2 per row)
    metaData.forEach((meta, index) => {
      const row = metaStartRow + Math.floor(index / 2);
      const col = (index % 2) * 5 + 1;

      // Merge cells for each metadata card
      worksheet.mergeCells(row, col, row, col + 4);
      const metaCell = worksheet.getCell(row, col);
      metaCell.value = `${meta.icon} ${meta.label}: ${meta.value}`;
      metaCell.font = {
        bold: true,
        size: 12,
        color: { argb: "FF2E5090" },
      };
      metaCell.alignment = { horizontal: "center", vertical: "middle" };
      metaCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F8FF" },
      };
      metaCell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    // Enhanced traps section
    const trapsStartRow = metaStartRow + 4;

    // Traps section title
    worksheet.mergeCells(`A${trapsStartRow}:J${trapsStartRow}`);
    const trapsTitleCell = worksheet.getCell(trapsStartRow, 1);
    trapsTitleCell.value = "🪤 معلومات المصائد";
    trapsTitleCell.font = {
      bold: true,
      size: 16,
      color: { argb: "FF2E5090" },
      name: "Arial",
    };
    trapsTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    trapsTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F1FF" },
    };
    trapsTitleCell.border = {
      top: { style: "medium", color: { argb: "FF2E5090" } },
      left: { style: "medium", color: { argb: "FF2E5090" } },
      bottom: { style: "medium", color: { argb: "FF2E5090" } },
      right: { style: "medium", color: { argb: "FF2E5090" } },
    };

    // BG Traps info
    const bgTrapsRow = trapsStartRow + 2;
    worksheet.mergeCells(`A${bgTrapsRow}:C${bgTrapsRow}`);
    const bgTrapsCell = worksheet.getCell(bgTrapsRow, 1);
    bgTrapsCell.value = "🎯 مصائد BG brow";
    bgTrapsCell.font = { bold: true, size: 12, color: { argb: "FF2E5090" } };
    bgTrapsCell.alignment = { horizontal: "center", vertical: "middle" };
    bgTrapsCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" },
    };
    bgTrapsCell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };

    worksheet.mergeCells(`D${bgTrapsRow}:E${bgTrapsRow}`);
    const bgCountCell = worksheet.getCell(bgTrapsRow, 4);
    bgCountCell.value = `العدد: ${selectedReport.bgTraps?.count || 0}`;
    bgCountCell.font = { bold: true, size: 11, color: { argb: "FF2E5090" } };
    bgCountCell.alignment = { horizontal: "center", vertical: "middle" };
    bgCountCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" },
    };
    bgCountCell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };

    worksheet.mergeCells(`F${bgTrapsRow}:J${bgTrapsRow}`);
    const bgStatusCell = worksheet.getCell(bgTrapsRow, 6);
    const bgStatus = selectedReport.bgTraps?.isPositive
      ? "إيجابي ✅"
      : "سلبي ❌";
    bgStatusCell.value = `الحالة: ${bgStatus}`;
    bgStatusCell.font = {
      bold: true,
      size: 12,
      color: {
        argb: selectedReport.bgTraps?.isPositive ? "FF008000" : "FFFF0000",
      },
    };
    bgStatusCell.alignment = { horizontal: "center", vertical: "middle" };
    bgStatusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: selectedReport.bgTraps?.isPositive ? "FFE8F5E8" : "FFFFEAEA",
      },
    };
    bgStatusCell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };

    // Smart Traps info
    const smartTrapsRow = bgTrapsRow + 1;
    worksheet.mergeCells(`A${smartTrapsRow}:C${smartTrapsRow}`);
    const smartTrapsCell = worksheet.getCell(smartTrapsRow, 1);
    smartTrapsCell.value = "🤖 مصائد ذكية";
    smartTrapsCell.font = { bold: true, size: 12, color: { argb: "FF2E5090" } };
    smartTrapsCell.alignment = { horizontal: "center", vertical: "middle" };
    smartTrapsCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" },
    };
    smartTrapsCell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };

    worksheet.mergeCells(`D${smartTrapsRow}:E${smartTrapsRow}`);
    const smartCountCell = worksheet.getCell(smartTrapsRow, 4);
    smartCountCell.value = `العدد: ${selectedReport.smartTraps?.count || 0}`;
    smartCountCell.font = { bold: true, size: 11, color: { argb: "FF2E5090" } };
    smartCountCell.alignment = { horizontal: "center", vertical: "middle" };
    smartCountCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F8FF" },
    };
    smartCountCell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };

    worksheet.mergeCells(`F${smartTrapsRow}:J${smartTrapsRow}`);
    const smartStatusCell = worksheet.getCell(smartTrapsRow, 6);
    const smartStatus = selectedReport.smartTraps?.isPositive
      ? "إيجابي ✅"
      : "سلبي ❌";
    smartStatusCell.value = `الحالة: ${smartStatus}`;
    smartStatusCell.font = {
      bold: true,
      size: 12,
      color: {
        argb: selectedReport.smartTraps?.isPositive ? "FF008000" : "FFFF0000",
      },
    };
    smartStatusCell.alignment = { horizontal: "center", vertical: "middle" };
    smartStatusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: selectedReport.smartTraps?.isPositive ? "FFE8F5E8" : "FFFFEAEA",
      },
    };
    smartStatusCell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };

    // Comments section (only if there's a comment)
    let commentsStartRow = smartTrapsRow + 2;
    if (selectedReport.comment && selectedReport.comment.trim()) {
      // Comments section title
      worksheet.mergeCells(`A${commentsStartRow}:J${commentsStartRow}`);
      const commentsTitleCell = worksheet.getCell(commentsStartRow, 1);
      commentsTitleCell.value = "💬 الملاحظات والتعليقات";
      commentsTitleCell.font = {
        bold: true,
        size: 16,
        color: { argb: "FF2E5090" },
        name: "Arial",
      };
      commentsTitleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      commentsTitleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F1FF" },
      };
      commentsTitleCell.border = {
        top: { style: "medium", color: { argb: "FF2E5090" } },
        left: { style: "medium", color: { argb: "FF2E5090" } },
        bottom: { style: "medium", color: { argb: "FF2E5090" } },
        right: { style: "medium", color: { argb: "FF2E5090" } },
      };

      // Comment content
      const commentContentRow = commentsStartRow + 2;
      worksheet.mergeCells(`A${commentContentRow}:J${commentContentRow}`);
      const commentContentCell = worksheet.getCell(commentContentRow, 1);
      commentContentCell.value = selectedReport.comment;
      commentContentCell.font = {
        size: 12,
        color: { argb: "FF333333" },
        italic: true,
      };
      commentContentCell.alignment = {
        horizontal: "right",
        vertical: "middle",
        wrapText: true,
      };
      commentContentCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };
      commentContentCell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      commentsStartRow = commentContentRow + 2;
    }

    // Enhanced site counts table
    const tableStartRow = commentsStartRow + 1;

    // Table title
    worksheet.mergeCells(`A${tableStartRow}:J${tableStartRow}`);
    const tableTitleCell = worksheet.getCell(tableStartRow, 1);
    tableTitleCell.value = "📋 تفاصيل المواقع المستهدفة";
    tableTitleCell.font = {
      bold: true,
      size: 16,
      color: { argb: "FF2E5090" },
      name: "Arial",
    };
    tableTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    tableTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8F1FF" },
    };
    tableTitleCell.border = {
      top: { style: "medium", color: { argb: "FF2E5090" } },
      left: { style: "medium", color: { argb: "FF2E5090" } },
      bottom: { style: "medium", color: { argb: "FF2E5090" } },
      right: { style: "medium", color: { argb: "FF2E5090" } },
    };

    // Table headers
    const headerRow = tableStartRow + 2;
    const headers = ["نوع الموقع", "العدد"];

    headers.forEach((header, index) => {
      let colSpan, startCol;
      if (index === 0) {
        colSpan = 6;
        startCol = 1;
      } else {
        // index === 1 (العدد)
        colSpan = 4;
        startCol = 7;
      }

      worksheet.mergeCells(
        headerRow,
        startCol,
        headerRow,
        startCol + colSpan - 1
      );
      const headerCell = worksheet.getCell(headerRow, startCol);
      headerCell.value = header;
      headerCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4A90E2" },
      };
      headerCell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 12,
        name: "Arial",
      };
      headerCell.alignment = { horizontal: "center", vertical: "middle" };
      headerCell.border = {
        top: { style: "medium", color: { argb: "FF2E5090" } },
        left: { style: "thin", color: { argb: "FF2E5090" } },
        bottom: { style: "medium", color: { argb: "FF2E5090" } },
        right: { style: "thin", color: { argb: "FF2E5090" } },
      };
    });

    // Site counts data with enhanced styling
    let dataRow = headerRow + 1;
    let isAlt = false;

    for (const siteType of siteTypes) {
      const count = selectedReport.siteCounts?.[siteType] || 0;

      // Site type column
      worksheet.mergeCells(dataRow, 1, dataRow, 6);
      const siteTypeCell = worksheet.getCell(dataRow, 1);
      siteTypeCell.value = siteType;
      siteTypeCell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
        size: 11,
      };
      siteTypeCell.alignment = { horizontal: "center", vertical: "middle" };
      siteTypeCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF6AB7FF" },
      };
      siteTypeCell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      // Count column
      worksheet.mergeCells(dataRow, 7, dataRow, 10);
      const countCell = worksheet.getCell(dataRow, 7);
      countCell.value = count;
      countCell.font = {
        bold: count > 0,
        color: { argb: count > 0 ? "FF2E5090" : "FF333333" },
        size: 11,
      };
      countCell.alignment = { horizontal: "center", vertical: "middle" };
      countCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isAlt ? "FFF8F9FA" : "FFFFFFFF" },
      };
      countCell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };

      isAlt = !isAlt;
      dataRow++;
    }

    // Enhanced total row
    worksheet.mergeCells(dataRow, 1, dataRow, 6);
    const totalLabelCell = worksheet.getCell(dataRow, 1);
    totalLabelCell.value = "الإجمالي";
    totalLabelCell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 12,
    };
    totalLabelCell.alignment = { horizontal: "center", vertical: "middle" };
    totalLabelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E5090" },
    };
    totalLabelCell.border = {
      top: { style: "thick", color: { argb: "FF2E5090" } },
      left: { style: "medium", color: { argb: "FF2E5090" } },
      bottom: { style: "thick", color: { argb: "FF2E5090" } },
      right: { style: "medium", color: { argb: "FF2E5090" } },
    };

    worksheet.mergeCells(dataRow, 7, dataRow, 10);
    const totalValueCell = worksheet.getCell(dataRow, 7);
    totalValueCell.value = totalSites;
    totalValueCell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 12,
    };
    totalValueCell.alignment = { horizontal: "center", vertical: "middle" };
    totalValueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E5090" },
    };
    totalValueCell.border = {
      top: { style: "thick", color: { argb: "FF2E5090" } },
      left: { style: "medium", color: { argb: "FF2E5090" } },
      bottom: { style: "thick", color: { argb: "FF2E5090" } },
      right: { style: "medium", color: { argb: "FF2E5090" } },
    };

    // Add footer (matching other reports)
    const footerRow = dataRow + 3;
    worksheet.mergeCells(`A${footerRow}:J${footerRow}`);
    const footerCell = worksheet.getCell(footerRow, 1);
    footerCell.value = "© شركة تكوين الوطن - قسم مكافحة الآفات";
    footerCell.font = {
      italic: true,
      size: 10,
      color: { argb: "FF666666" },
    };
    footerCell.alignment = { horizontal: "center" };
    footerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8F9FA" },
    };

    // Set column widths (matching other reports)
    worksheet.columns = [
      { width: 15 }, // A
      { width: 15 }, // B
      { width: 15 }, // C
      { width: 15 }, // D
      { width: 15 }, // E
      { width: 15 }, // F
      { width: 15 }, // G
      { width: 15 }, // H
      { width: 15 }, // I
      { width: 15 }, // J
    ];

    // Set row heights
    worksheet.getRow(1).height = 45; // Header
    worksheet.getRow(6).height = 30; // Title
    worksheet.getRow(tableStartRow).height = 30; // Table title

    // Generate filename
    const reportDateStr = new Date(selectedReport.date)
      .toISOString()
      .split("T")[0];
    const fileName = `تقرير_مفصل_${reportDateStr}.xlsx`;
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
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({ error: t(req, "errors.exportFailed") });
  }
};
