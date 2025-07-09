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
    const worksheet = workbook.addWorksheet("تقرير مكافحة الآفات");

    // Define all possible site types and municipalities
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
        groups = groupBy(reports, getDate);
      } else if (type === "weekly") {
        groups = groupBy(reports, getWeek);
      } else if (type === "monthly") {
        groups = groupBy(reports, getMonth);
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

      for (const [groupKey, groupReports] of Object.entries(groups)) {
        if (type === "daily") {
          const displayDate = new Date(groupKey).toLocaleDateString("ar-SA");
          reportTitle = `تقرير يومي - ${displayDate}`;
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
        for (const siteType of allSiteTypes) {
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

    // Enhanced detailed report
    worksheet.mergeCells("A1:G3");
    const detailedHeaderCell = worksheet.getCell("A1");
    detailedHeaderCell.value = "تقرير مفصل - مكافحة الآفات";
    detailedHeaderCell.font = {
      bold: true,
      size: 18,
      color: { argb: "FFFFFFFF" },
    };
    detailedHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
    detailedHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E5090" },
    };

    // Enhanced column headers
    worksheet.getRow(5).values = [
      "اسم الأخصائي",
      "التاريخ",
      "البلدية",
      "الحي",
      "نوع المكافحة",
      "إجمالي المواقع",
      "الإحداثيات",
    ];

    const headerRow = worksheet.getRow(5);
    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 12,
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4A90E2" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 25;

    // Add data with alternating colors
    let rowIndex = 6;
    reports.forEach((r, index) => {
      const row = worksheet.getRow(rowIndex);
      row.values = [
        r.workerName,
        r.date,
        r.municipality,
        r.district,
        r.controlType,
        r.totalSites,
        r.coordinates
          ? `${r.coordinates.latitude}, ${r.coordinates.longitude}`
          : "",
      ];

      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? "FFFFFFFF" : "FFF8F9FA" },
      };
      row.alignment = { horizontal: "center", vertical: "middle" };
      rowIndex++;
    });

    // Set column widths for detailed report
    worksheet.columns = [
      { width: 20 }, // Worker name
      { width: 15 }, // Date
      { width: 15 }, // Municipality
      { width: 15 }, // District
      { width: 15 }, // Control type
      { width: 15 }, // Total sites
      { width: 25 }, // Coordinates
    ];

    const fileName = `تقرير_مفصل_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
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
    res.status(500).json({ error: error.message });
  }
};
