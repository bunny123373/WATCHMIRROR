import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    await connectDB();
    const user = await UserModel.findById(token).select("-password");
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        profiles: user.profiles,
        myList: user.myList 
      } 
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
