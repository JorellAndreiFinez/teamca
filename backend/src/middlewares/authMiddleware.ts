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
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { user_id: string };
    const userId = payload.user_id;

    const user = await User.findById(userId)
      .select("email global_role departments is_active")
      .lean();

    if (!user || !user.is_active) {
      return res.status(403).json({ message: "Account inactive or not found" });
    }

    const primaryDepartment = user.departments?.[0];

    req.user = {
      user_id: user._id,
      email: user.email,
      global_role: user.global_role,
      department_role: primaryDepartment?.department_role,
      department_id: primaryDepartment
        ? String(primaryDepartment.department_id)
        : undefined,
      is_active: user.is_active,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
