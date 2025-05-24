import { NextRequest, NextResponse } from "next/server";
import { ArcadeService } from "@/lib/arcade-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get compliance overview for the organization
    const overview =
      await ArcadeService.getOrganizationComplianceOverview(organizationId);

    return NextResponse.json({
      overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching compliance overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance overview" },
      { status: 500 }
    );
  }
}
