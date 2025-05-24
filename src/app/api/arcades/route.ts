import { NextRequest, NextResponse } from "next/server";
import { ArcadeService } from "@/lib/arcade-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (organizationId) {
      // Get arcades for a specific organization
      const arcades =
        await ArcadeService.getArcadesByOrganization(organizationId);
      return NextResponse.json({ arcades });
    } else {
      // Get arcades accessible to the current user
      const arcades = await ArcadeService.getArcadesForUser(session.user.id);
      return NextResponse.json({ arcades });
    }
  } catch (error) {
    console.error("Error fetching arcades:", error);
    return NextResponse.json(
      { error: "Failed to fetch arcades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      organizationId,
      address,
      city,
      postcode,
      country,
      premisesLicenseNo,
      premisesLicenseIssueDate,
      premisesLicenseExpiryDate,
      localAuthority,
      premisesLicenseConditions,
      openingHours,
      contactPhone,
      contactEmail,
      category_b3_machines,
      category_c_machines,
      category_d_machines,
      other_machines,
    } = body;

    if (!name || !organizationId || !address) {
      return NextResponse.json(
        { error: "Name, organization ID, and address are required" },
        { status: 400 }
      );
    }

    const arcade = await ArcadeService.createArcade({
      name,
      organizationId,
      address,
      city,
      postcode,
      country,
      premisesLicenseNo,
      premisesLicenseIssueDate: premisesLicenseIssueDate
        ? new Date(premisesLicenseIssueDate)
        : undefined,
      premisesLicenseExpiryDate: premisesLicenseExpiryDate
        ? new Date(premisesLicenseExpiryDate)
        : undefined,
      localAuthority,
      premisesLicenseConditions,
      openingHours,
      contactPhone,
      contactEmail,
      category_b3_machines: parseInt(category_b3_machines) || 0,
      category_c_machines: parseInt(category_c_machines) || 0,
      category_d_machines: parseInt(category_d_machines) || 0,
      other_machines: parseInt(other_machines) || 0,
    });

    // Assign the creating user to the arcade as primary with management permissions
    await ArcadeService.assignUserToArcade(session.user.id, arcade.id, {
      isPrimary: true,
      canManage: true,
      canView: true,
      assignedBy: session.user.id,
    });

    return NextResponse.json({ arcade }, { status: 201 });
  } catch (error) {
    console.error("Error creating arcade:", error);
    return NextResponse.json(
      { error: "Failed to create arcade" },
      { status: 500 }
    );
  }
}
