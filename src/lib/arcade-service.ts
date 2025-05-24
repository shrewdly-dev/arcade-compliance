import { prisma } from "./prisma";
import { MachineCategory } from "@prisma/client";

export interface ArcadeComplianceCheck {
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  machineBreakdown: {
    total: number;
    b3Count: number;
    cCount: number;
    dCount: number;
    b3Percentage: number;
    maxB3Allowed: number;
  };
}

export interface CreateArcadeData {
  name: string;
  organizationId: string;
  address: string;
  city?: string;
  postcode?: string;
  country?: string;
  premisesLicenseNo?: string;
  premisesLicenseIssueDate?: Date;
  premisesLicenseExpiryDate?: Date;
  localAuthority?: string;
  premisesLicenseConditions?: string[];
  openingHours?: string;
  contactPhone?: string;
  contactEmail?: string;
  category_b3_machines?: number;
  category_c_machines?: number;
  category_d_machines?: number;
  other_machines?: number;
}

export interface CreateMachineData {
  arcadeId: string;
  serialNumber: string;
  manufacturer?: string;
  model?: string;
  category: MachineCategory;
  installDate?: Date;
  location?: string;
}

export class ArcadeService {
  /**
   * Create a new arcade
   */
  static async createArcade(data: CreateArcadeData) {
    return await prisma.arcade.create({
      data,
      include: {
        organization: true,
        machines: true,
        userArcades: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Get arcade by ID with full details
   */
  static async getArcadeById(id: string) {
    return await prisma.arcade.findUnique({
      where: { id },
      include: {
        organization: true,
        machines: {
          orderBy: { createdAt: "desc" },
        },
        userArcades: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        incidents: {
          where: { status: { not: "CLOSED" } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Get all arcades for an organization
   */
  static async getArcadesByOrganization(organizationId: string) {
    return await prisma.arcade.findMany({
      where: { organizationId },
      include: {
        machines: true,
        userArcades: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get arcades accessible to a user
   */
  static async getArcadesForUser(userId: string) {
    return await prisma.arcade.findMany({
      where: {
        userArcades: {
          some: {
            userId,
            canView: true,
          },
        },
      },
      include: {
        organization: true,
        machines: true,
        userArcades: {
          where: { userId },
          select: {
            isPrimary: true,
            canManage: true,
            canView: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Assign user to arcade
   */
  static async assignUserToArcade(
    userId: string,
    arcadeId: string,
    options: {
      isPrimary?: boolean;
      canManage?: boolean;
      canView?: boolean;
      assignedBy?: string;
    } = {}
  ) {
    const {
      isPrimary = false,
      canManage = false,
      canView = true,
      assignedBy,
    } = options;

    // If setting as primary, unset other primary arcades for this user
    if (isPrimary) {
      await prisma.userArcade.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return await prisma.userArcade.upsert({
      where: {
        userId_arcadeId: {
          userId,
          arcadeId,
        },
      },
      update: {
        isPrimary,
        canManage,
        canView,
        assignedBy,
      },
      create: {
        userId,
        arcadeId,
        isPrimary,
        canManage,
        canView,
        assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        arcade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Add machine to arcade
   */
  static async addMachine(data: CreateMachineData) {
    // Check if serial number already exists
    const existingMachine = await prisma.machine.findUnique({
      where: { serialNumber: data.serialNumber },
    });

    if (existingMachine) {
      throw new Error(
        `Machine with serial number ${data.serialNumber} already exists`
      );
    }

    const machine = await prisma.machine.create({
      data,
      include: {
        arcade: true,
      },
    });

    // Check compliance after adding machine
    const complianceCheck = await this.checkArcadeCompliance(data.arcadeId);

    return {
      machine,
      complianceCheck,
    };
  }

  /**
   * Remove machine from arcade
   */
  static async removeMachine(machineId: string) {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      select: { arcadeId: true },
    });

    if (!machine) {
      throw new Error("Machine not found");
    }

    await prisma.machine.delete({
      where: { id: machineId },
    });

    // Check compliance after removing machine
    const complianceCheck = await this.checkArcadeCompliance(machine.arcadeId);

    return complianceCheck;
  }

  /**
   * Check arcade compliance with B3 machine limits
   * Rule: B3 machines cannot exceed 20% of total machines
   */
  static async checkArcadeCompliance(
    arcadeId: string
  ): Promise<ArcadeComplianceCheck> {
    const machines = await prisma.machine.findMany({
      where: {
        arcadeId,
        isActive: true,
      },
      select: { category: true },
    });

    const total = machines.length;
    const b3Count = machines.filter((m) => m.category === "B3").length;
    const cCount = machines.filter((m) => m.category === "C").length;
    const dCount = machines.filter((m) => m.category === "D").length;

    const b3Percentage = total > 0 ? (b3Count / total) * 100 : 0;
    const maxB3Allowed = Math.floor(total * 0.2); // 20% of total, rounded down

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check B3 limit compliance (20% rule)
    if (b3Count > maxB3Allowed) {
      issues.push(
        `B3 machine limit exceeded: ${b3Count} B3 machines (${b3Percentage.toFixed(1)}%) exceeds the maximum allowed of ${maxB3Allowed} (20% of ${total} total machines)`
      );
    }

    // Warnings for approaching limits
    if (b3Count === maxB3Allowed && total > 0) {
      warnings.push(
        `B3 machine limit reached: ${b3Count} B3 machines (${b3Percentage.toFixed(1)}%) is at the maximum allowed limit`
      );
    } else if (b3Count >= maxB3Allowed * 0.8 && total > 0) {
      warnings.push(
        `Approaching B3 machine limit: ${b3Count} B3 machines (${b3Percentage.toFixed(1)}%) is close to the maximum allowed of ${maxB3Allowed}`
      );
    }

    // Check for minimum machine requirements (if any)
    if (total === 0) {
      warnings.push("No machines registered in this arcade");
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      warnings,
      machineBreakdown: {
        total,
        b3Count,
        cCount,
        dCount,
        b3Percentage: Math.round(b3Percentage * 10) / 10, // Round to 1 decimal
        maxB3Allowed,
      },
    };
  }

  /**
   * Get compliance status for all arcades in an organization
   */
  static async getOrganizationComplianceOverview(organizationId: string) {
    const arcades = await prisma.arcade.findMany({
      where: { organizationId },
      include: {
        machines: {
          where: { isActive: true },
          select: { category: true },
        },
      },
    });

    const complianceResults = await Promise.all(
      arcades.map(async (arcade) => ({
        arcade: {
          id: arcade.id,
          name: arcade.name,
        },
        compliance: await this.checkArcadeCompliance(arcade.id),
      }))
    );

    const totalArcades = arcades.length;
    const compliantArcades = complianceResults.filter(
      (r) => r.compliance.isCompliant
    ).length;
    const arcadesWithIssues = complianceResults.filter(
      (r) => r.compliance.issues.length > 0
    ).length;
    const arcadesWithWarnings = complianceResults.filter(
      (r) => r.compliance.warnings.length > 0
    ).length;

    return {
      summary: {
        totalArcades,
        compliantArcades,
        arcadesWithIssues,
        arcadesWithWarnings,
        compliancePercentage:
          totalArcades > 0
            ? Math.round((compliantArcades / totalArcades) * 100)
            : 0,
      },
      arcadeDetails: complianceResults,
    };
  }

  /**
   * Update machine details
   */
  static async updateMachine(
    machineId: string,
    data: Partial<CreateMachineData>
  ) {
    const machine = await prisma.machine.update({
      where: { id: machineId },
      data,
      include: {
        arcade: true,
      },
    });

    // Check compliance after updating machine
    const complianceCheck = await this.checkArcadeCompliance(machine.arcadeId);

    return {
      machine,
      complianceCheck,
    };
  }

  /**
   * Get user's primary arcade
   */
  static async getUserPrimaryArcade(userId: string) {
    const userArcade = await prisma.userArcade.findFirst({
      where: {
        userId,
        isPrimary: true,
      },
      include: {
        arcade: {
          include: {
            organization: true,
            machines: true,
          },
        },
      },
    });

    return userArcade?.arcade || null;
  }
}
