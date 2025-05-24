import { NextRequest, NextResponse } from "next/server";
import { ArcadeService } from "@/lib/arcade-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: { arcadeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const arcade = await ArcadeService.getArcadeById(params.arcadeId);

    if (!arcade) {
      return NextResponse.json({ error: "Arcade not found" }, { status: 404 });
    }

    // Check if user has access to this arcade
    const hasAccess = arcade.userArcades.some(
      (ua) => ua.user.id === session.user.id && ua.canView
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get compliance check for the arcade
    const complianceCheck = await ArcadeService.checkArcadeCompliance(
      params.arcadeId
    );

    return NextResponse.json({
      machines: arcade.machines,
      compliance: complianceCheck,
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    return NextResponse.json(
      { error: "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { arcadeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      serialNumber,
      manufacturer,
      model,
      category,
      installDate,
      location,
    } = body;

    if (!serialNumber || !category) {
      return NextResponse.json(
        { error: "Serial number and category are required" },
        { status: 400 }
      );
    }

    // Validate category
    if (!["B3", "C", "D"].includes(category)) {
      return NextResponse.json(
        { error: "Category must be B3, C, or D" },
        { status: 400 }
      );
    }

    // Check if user has management access to this arcade
    const arcade = await ArcadeService.getArcadeById(params.arcadeId);

    if (!arcade) {
      return NextResponse.json({ error: "Arcade not found" }, { status: 404 });
    }

    const hasManageAccess = arcade.userArcades.some(
      (ua) => ua.user.id === session.user.id && ua.canManage
    );

    if (!hasManageAccess) {
      return NextResponse.json(
        { error: "Management access required" },
        { status: 403 }
      );
    }

    const result = await ArcadeService.addMachine({
      arcadeId: params.arcadeId,
      serialNumber,
      manufacturer,
      model,
      category,
      installDate: installDate ? new Date(installDate) : undefined,
      location,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error adding machine:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to add machine" },
      { status: 500 }
    );
  }
}
