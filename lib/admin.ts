import { NextRequest } from "next/server";

export function validateAdminKey(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  return Boolean(key && process.env.ADMIN_KEY && key === process.env.ADMIN_KEY);
}