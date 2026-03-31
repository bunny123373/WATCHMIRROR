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
      return NextResponse.json({ history: [] });
    }

    await connectDB();
    const user = await UserModel.findById(userId).select("watchHistory");
    
    if (!user) {
      return NextResponse.json({ history: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history = (user.watchHistory || [])
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 50);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Get watch history error:", error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { contentId, progress, duration } = await req.json();
    
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingIndex = user.watchHistory.findIndex(
      (h: { contentId: string }) => h.contentId === contentId
    );

    const entry = {
      contentId,
      progress: progress || 0,
      duration: duration || 0,
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      user.watchHistory[existingIndex] = entry;
    } else {
      user.watchHistory.push(entry);
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save watch history error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { contentId } = await req.json();
    
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    await connectDB();
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { watchHistory: { contentId } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete watch history error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
