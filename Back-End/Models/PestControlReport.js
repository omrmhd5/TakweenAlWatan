const mongoose = require("mongoose");

const PestControlReportSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    municipality: { type: String, required: true },
    district: { type: String, required: true },
    workerName: { type: String, required: true },
    controlType: { type: String, required: true },
    siteCounts: { type: Object, required: true },
    bgTraps: {
      isPositive: { type: Boolean, required: true },
      count: { type: Number, required: true },
    },
    smartTraps: {
      isPositive: { type: Boolean, required: true },
      count: { type: Number, required: true },
    },
    comment: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PestControlReport", PestControlReportSchema);
