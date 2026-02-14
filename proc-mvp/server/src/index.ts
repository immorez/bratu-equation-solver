import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { vendorRouter } from "./routes/vendor.routes.js";
import { rfqRouter } from "./routes/rfq.routes.js";
import { quoteRouter } from "./routes/quote.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { discoveryRouter } from "./routes/discovery.routes.js";
import { outreachRouter } from "./routes/outreach.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/vendors", vendorRouter);
app.use("/api/rfqs", rfqRouter);
app.use("/api/quotes", quoteRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/discovery", discoveryRouter);
app.use("/api/outreach", outreachRouter);

// ─── Error handling ──────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
