import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { globalRateLimit } from "./middleware/rate-limit";
import authRoutes from "./modules/auth/auth.routes";
import requestRoutes from "./modules/requests/request.routes";
import attachmentRoutes from "./modules/attachments/attachment.routes";
import commentRoutes from "./modules/comments/comment.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import userRoutes from "./modules/users/user.routes";
import aiRoutes from "./modules/ai/ai.routes";

const app = express();

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.info(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`,
    );
  });

  next();
});

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  }),
);
app.use(
  cors({
    origin: "*",
    // Browsers hide non-safelisted response headers from JS by default.
    // Expose the ones the frontend needs to read on cross-origin downloads
    // (filename) and on the auth refresh interceptor.
    exposedHeaders: ["Content-Disposition", "X-Refreshed-Token"],
  }),
);
app.use(express.json({ limit: "1mb" }));
// app.use(globalRateLimit);

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/requests", attachmentRoutes);
app.use("/api/requests", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", aiRoutes);

app.use(errorHandler);

export default app;
