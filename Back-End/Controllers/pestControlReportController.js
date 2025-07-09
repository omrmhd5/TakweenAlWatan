const PestControlReport = require("../Models/PestControlReport");

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
