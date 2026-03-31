import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

async function getUserId(req: NextRequest): Promise<string | null> {
  return req.cookies.get("auth_token")?.value || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ myList: [] });
    }

    await connectDB();
    const user = await UserModel.findById(userId).select("myList");
    
    if (!user) {
      return NextResponse.json({ myList: [] });
    }

    return NextResponse.json({ myList: user.myList || [] });
  } catch (error) {
    console.error("Get my list error:", error);
    return NextResponse.json({ myList: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { contentId, action } = await req.json();
    
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "add") {
      if (!user.myList.includes(contentId)) {
        user.myList.push(contentId);
        await user.save();
      }
    } else if (action === "remove") {
      user.myList = user.myList.filter((id: string) => id !== contentId);
      await user.save();
    }

    return NextResponse.json({ success: true, myList: user.myList });
  } catch (error) {
    console.error("My list error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
