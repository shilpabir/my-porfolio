import mongoose from "mongoose";
import seedContent from "../siteConfig.js";
import { connectToDatabase } from "./db.js";

const contentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: "portfolioContents" },
);

const Content =
  mongoose.models.PortfolioContent ||
  mongoose.model("PortfolioContent", contentSchema);

export async function getPortfolioContent() {
  await connectToDatabase();
  let document = await Content.findOne({ key: "main" }).lean();
  if (!document) {
    try {
      document = await Content.create({ key: "main", data: seedContent });
      document = document.toObject();
    } catch (error) {
      if (error?.code !== 11000) throw error;
      document = await Content.findOne({ key: "main" }).lean();
      if (!document) throw error;
    }
  }
  return document.data;
}

export async function savePortfolioContent(data) {
  await connectToDatabase();
  const document = await Content.findOneAndUpdate(
    { key: "main" },
    { $set: { data } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return document.data;
}

export function isValidPortfolio(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    typeof data.name === "string" &&
    typeof data.role === "string" &&
    data.hero &&
    data.work &&
    Array.isArray(data.work.projects) &&
    Array.isArray(data.work.projectCategories) &&
    data.about &&
    data.skills &&
    data.experience &&
    data.contact &&
    data.footer
  );
}

export function hasUnsafeUrl(value, key = "") {
  if (typeof value === "string") {
    return (
      /(url|image|thumbnail|resume)/i.test(key) &&
      /^\s*(?:javascript|data|vbscript):/i.test(value)
    );
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeUrl(item, key));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).some(([childKey, childValue]) =>
      hasUnsafeUrl(childValue, childKey),
    );
  }
  return false;
}
