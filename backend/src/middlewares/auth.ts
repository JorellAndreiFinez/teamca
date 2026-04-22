// backend\src\middlewares\auth.ts

import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import User from "../models/User";

type TokenPayload = JwtPayload & {
  sub?: string;
  user_id?: string;
  id?: string;
};

const getTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is required." });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret is not configured." });
    }

    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    const userId = decoded.sub || decoded.user_id || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    const user = await User.findById(userId)
      .select("email global_role departments is_active")
      .lean();

    if (!user || !user.is_active) {
      return res
        .status(403)
        .json({ message: "Account is not active or does not exist." });
    }

    if (!user.global_role) {
      return res
        .status(403)
        .json({ message: "Account role is not configured." });
    }

    const primaryDepartment = user.departments?.[0];

    req.user = {
      user_id: user._id,
      email: user.email,
      global_role: user.global_role,
      department_role: primaryDepartment?.department_role,
      department_id: primaryDepartment ? String(primaryDepartment.department_id) : undefined,
      is_active: user.is_active,
    };

    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token.", error });
  }
};

export default authenticateJWT;
