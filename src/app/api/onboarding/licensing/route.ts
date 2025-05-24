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

    // Validate required fields - only operating license is required now
    if (!data.operatingLicense?.licenseNumber) {
      return NextResponse.json(
        { error: "Operating license number is required" },
        { status: 400 }
      );
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

    // Update organization with operating license data only
    const updatedOrganization = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        // Operating License fields
        operatingLicenseNo: data.operatingLicense.licenseNumber,
        operatingLicenseIssueDate: data.operatingLicense.issueDate
          ? new Date(data.operatingLicense.issueDate)
          : null,
        operatingLicenseExpiryDate: data.operatingLicense.expiryDate
          ? new Date(data.operatingLicense.expiryDate)
          : null,
        operatingLicenseAuthority: data.operatingLicense.licensingAuthority,
        operatingLicenseConditions: data.operatingLicense.conditions.filter(
          (c: string) => c.trim() !== ""
        ),

        // Update onboarding progress
        onboardingStep: Math.max(organization.onboardingStep, 2),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "ORGANIZATION_LICENSING_UPDATED",
        entityType: "Organization",
        entityId: organization.id,
        newValues: {
          operatingLicense: data.operatingLicense,
          additionalPermits: data.additionalPermits || [],
          complianceHistory: data.complianceHistory,
        },
        userId: user.id,
        organizationId: organization.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Operating license information saved successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error("Licensing onboarding error:", error);
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

    // Get the latest licensing data from audit logs for additional data
    const latestLicensingLog = await prisma.auditLog.findFirst({
      where: {
        organizationId: organization.id,
        action: "ORGANIZATION_LICENSING_UPDATED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Construct licensing data from organization fields and audit log
    const licensingData = {
      operatingLicense: {
        licenseNumber: organization.operatingLicenseNo || "",
        issueDate: organization.operatingLicenseIssueDate
          ? organization.operatingLicenseIssueDate.toISOString().split("T")[0]
          : "",
        expiryDate: organization.operatingLicenseExpiryDate
          ? organization.operatingLicenseExpiryDate.toISOString().split("T")[0]
          : "",
        licensingAuthority:
          organization.operatingLicenseAuthority || "Gambling Commission",
        conditions: organization.operatingLicenseConditions || [""],
      },
      additionalPermits: [],
      complianceHistory: {
        previousViolations: false,
        violationDetails: "",
        correctiveActions: "",
      },
    };

    // Merge with audit log data if available
    if (latestLicensingLog?.newValues) {
      const auditData = latestLicensingLog.newValues as any;
      if (auditData.additionalPermits) {
        licensingData.additionalPermits = auditData.additionalPermits;
      }
      if (auditData.complianceHistory) {
        licensingData.complianceHistory = auditData.complianceHistory;
      }
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        licensingData: licensingData,
        currentStep: organization.onboardingStep,
      },
    });
  } catch (error) {
    console.error("Get licensing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
