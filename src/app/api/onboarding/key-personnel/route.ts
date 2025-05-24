import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organization = user.organizations[0].organization;

    return NextResponse.json({
      success: true,
      organization: {
        designatedSupervisor: organization.designatedSupervisor,
        keyPersonnel: organization.keyPersonnel,
      },
    });
  } catch (error) {
    console.error("Error fetching key personnel data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { designatedSupervisor, keyPersonnel } = body;

    // Validate required fields
    if (!designatedSupervisor?.trim()) {
      return NextResponse.json(
        { error: "Designated supervisor is required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 }
      );
    }

    const organizationId = user.organizations[0].organization.id;

    // Update organization with key personnel data
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        designatedSupervisor: designatedSupervisor.trim(),
        keyPersonnel: keyPersonnel || [],
        onboardingStep: Math.max(
          user.organizations[0].organization.onboardingStep,
          3
        ),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Key personnel information saved successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error("Error saving key personnel data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
