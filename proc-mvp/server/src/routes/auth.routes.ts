import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { authenticate } from "../middleware/auth.js";
import type { AuthPayload } from "../middleware/auth.js";

export const authRouter = Router();

// ─── Register ────────────────────────────────────────────────
authRouter.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "Email already registered");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.status(201).json({ user, token });
});

// ─── Login ───────────────────────────────────────────────────
authRouter.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new AppError(401, "Invalid credentials");

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

// ─── Me ──────────────────────────────────────────────────────
authRouter.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) throw new AppError(404, "User not found");
  res.json(user);
});

// ─── Helpers ─────────────────────────────────────────────────
function signToken(payload: AuthPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}
