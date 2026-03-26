// backend\src\middlewares\authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET =
  process.env.JWT_SECRET || "teamca-dev-secret-change-in-production";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { user_id: string };
    const userId = payload.user_id; // ✅ match your login JWT

    // fetch full user from DB
    const user = await User.findById(userId)
      .select(
        "email first_name last_name global_role department_role departments is_active",
      )
      .lean();

    if (!user || !user.is_active)
      return res.status(403).json({ message: "Account inactive or not found" });

    req.user = user; // attach full user object
    next();
  } catch (err) {
    console.error("[authMiddleware] JWT error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
