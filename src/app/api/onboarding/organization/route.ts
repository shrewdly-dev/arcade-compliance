import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.businessName || !data.businessAddress || !data.contactInfo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organizations: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Store onboarding data in a JSON format for now
    const onboardingData = {
      businessName: data.businessName,
      tradingNames: data.tradingNames.filter(
        (name: string) => name.trim() !== ""
      ),
      businessType: data.registrationDetails.businessType,
      companyNumber: data.registrationDetails.companyNumber,
      vatNumber: data.registrationDetails.vatNumber,
      incorporationDate: data.registrationDetails.incorporationDate,
      website: data.contactInfo.website,
      streetAddress: data.businessAddress.street,
      city: data.businessAddress.city,
      postcode: data.businessAddress.postcode,
      country: data.businessAddress.country,
      step: 1,
      completedAt: new Date().toISOString(),
    };

    // Check if user already has an organization
    let organization;
    if (user.organizations.length > 0) {
      // Update existing organization
      const orgMember = user.organizations[0];
      organization = await prisma.organization.update({
        where: { id: orgMember.organizationId },
        data: {
          name: data.businessName,
          type: "ARCADE_OPERATOR",
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          address: `${data.businessAddress.street}, ${data.businessAddress.city}, ${data.businessAddress.postcode}`,
        },
      });
    } else {
      // Create new organization
      organization = await prisma.organization.create({
        data: {
          name: data.businessName,
          type: "ARCADE_OPERATOR",
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          address: `${data.businessAddress.street}, ${data.businessAddress.city}, ${data.businessAddress.postcode}`,
        },
      });

      // Create organization membership
      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });
    }

    // Create audit log with onboarding data
    await prisma.auditLog.create({
      data: {
        action: "ORGANIZATION_ONBOARDING_STEP_1",
        entityType: "Organization",
        entityId: organization.id,
        newValues: onboardingData,
        userId: user.id,
        organizationId: organization.id,
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        step: 1,
      },
    });
  } catch (error) {
    console.error("Organization onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user and their organization
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

    // Get the latest onboarding data from audit logs
    const latestOnboardingLog = await prisma.auditLog.findFirst({
      where: {
        organizationId: organization.id,
        action: {
          startsWith: "ORGANIZATION_ONBOARDING_STEP",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        address: organization.address,
        onboardingData: latestOnboardingLog?.newValues || null,
        currentStep: latestOnboardingLog?.newValues
          ? (latestOnboardingLog.newValues as any).step || 1
          : 1,
      },
    });
  } catch (error) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
