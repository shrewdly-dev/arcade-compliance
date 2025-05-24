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

    // Get user with onboarding status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingCompleted: true,
        onboardingStep: true,
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only ADMIN users need to complete onboarding
    // MANAGER and STAFF users should skip onboarding
    const needsOnboarding = user.role === "ADMIN" && !user.onboardingCompleted;

    return NextResponse.json({
      hasCompletedOnboarding: !needsOnboarding,
      currentStep: user.onboardingStep,
      userRole: user.role,
      needsOnboarding,
      organizations: user.organizations.map((om) => om.organization),
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
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

    const { completed, step } = await request.json();

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow ADMIN users to update onboarding status
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin users can complete onboarding" },
        { status: 403 }
      );
    }

    // Update user's onboarding status
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        onboardingCompleted: completed,
        onboardingStep: step,
      },
    });

    return NextResponse.json({
      hasCompletedOnboarding: updatedUser.onboardingCompleted,
      currentStep: updatedUser.onboardingStep,
      userRole: user.role,
    });
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
