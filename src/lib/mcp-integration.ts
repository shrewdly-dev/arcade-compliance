import { prisma } from "./prisma";

// Types for MCP server data
interface MCPDocument {
  id: string;
  title: string;
  category: string;
  type: string;
  description: string;
}

interface MCPTrainingRequirement {
  category: string;
  title: string;
  duration: number;
  isRequired: boolean;
  description: string;
}

interface MCPGuideline {
  category: string;
  title: string;
  content: string;
}

// Service to integrate MCP server data with Prisma database
export class MCPIntegrationService {
  // Simulate getting data from MCP server (in real scenario, this would call the MCP server)
  static async getMCPComplianceData() {
    // This simulates what we would get from the MCP server
    return {
      documents: [
        {
          id: "mcp-doc-1",
          title: "Age Verification Procedures",
          category: "RESPONSIBLE_GAMBLING",
          type: "PROCEDURE",
          description:
            "Detailed procedures for verifying customer age in arcade operations",
        },
        {
          id: "mcp-doc-2",
          title: "Machine Operation Guidelines",
          category: "OPERATIONS",
          type: "GUIDELINE",
          description:
            "Guidelines for proper operation and maintenance of arcade machines",
        },
      ] as MCPDocument[],
      trainingRequirements: [
        {
          category: "RESPONSIBLE_GAMBLING",
          title: "Responsible Gambling Awareness",
          duration: 120,
          isRequired: true,
          description:
            "Understanding responsible gambling principles and customer protection",
        },
        {
          category: "AGE_VERIFICATION",
          title: "Age Verification Training",
          duration: 60,
          isRequired: true,
          description:
            "Proper procedures for verifying customer age and handling underage situations",
        },
      ] as MCPTrainingRequirement[],
      guidelines: [
        {
          category: "licensing",
          title: "Arcade Operator Licensing",
          content:
            "All arcade operators must obtain proper licensing before commencing operations",
        },
        {
          category: "operations",
          title: "Daily Operations Checklist",
          content:
            "Standard procedures for daily arcade operations and compliance checks",
        },
      ] as MCPGuideline[],
    };
  }

  // Sync MCP documents to Prisma database
  static async syncDocumentsToDatabase(organizationId?: string) {
    const mcpData = await this.getMCPComplianceData();
    const syncedDocuments = [];

    for (const mcpDoc of mcpData.documents) {
      try {
        // First, try to find existing document
        const existingDocument = await prisma.document.findFirst({
          where: {
            title: mcpDoc.title,
            category: mcpDoc.category as any,
          },
        });

        let document;
        if (existingDocument) {
          // Update existing document
          document = await prisma.document.update({
            where: { id: existingDocument.id },
            data: {
              description: mcpDoc.description,
              type: mcpDoc.type as any,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new document
          document = await prisma.document.create({
            data: {
              title: mcpDoc.title,
              description: mcpDoc.description,
              category: mcpDoc.category as any,
              type: mcpDoc.type as any,
              status: "APPROVED",
              version: "1.0",
              organizationId: organizationId || null,
            },
          });
        }
        syncedDocuments.push(document);
      } catch (error) {
        console.error(`Error syncing document ${mcpDoc.title}:`, error);
      }
    }

    return syncedDocuments;
  }

  // Sync MCP training requirements to Prisma database
  static async syncTrainingToDatabase(organizationId?: string) {
    const mcpData = await this.getMCPComplianceData();
    const syncedTraining = [];

    for (const mcpTraining of mcpData.trainingRequirements) {
      try {
        // First, try to find existing training
        const existingTraining = await prisma.training.findFirst({
          where: {
            title: mcpTraining.title,
            category: mcpTraining.category as any,
          },
        });

        let training;
        if (existingTraining) {
          // Update existing training
          training = await prisma.training.update({
            where: { id: existingTraining.id },
            data: {
              description: mcpTraining.description,
              duration: mcpTraining.duration,
              isRequired: mcpTraining.isRequired,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new training
          training = await prisma.training.create({
            data: {
              title: mcpTraining.title,
              description: mcpTraining.description,
              category: mcpTraining.category as any,
              duration: mcpTraining.duration,
              isRequired: mcpTraining.isRequired,
              organizationId: organizationId || null,
            },
          });
        }
        syncedTraining.push(training);
      } catch (error) {
        console.error(`Error syncing training ${mcpTraining.title}:`, error);
      }
    }

    return syncedTraining;
  }

  // Get compliance status for an organization
  static async getComplianceStatus(organizationId: string) {
    const [documents, trainings, organization] = await Promise.all([
      prisma.document.count({
        where: {
          organizationId,
          status: "APPROVED",
        },
      }),
      prisma.training.count({
        where: {
          organizationId,
          isRequired: true,
        },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          type: true,
          status: true,
          licenseNo: true,
        },
      }),
    ]);

    // Get completed training count for the organization
    const completedTrainings = await prisma.userTraining.count({
      where: {
        status: "COMPLETED",
        user: {
          organizations: {
            some: {
              organizationId: organizationId,
            },
          },
        },
      },
    });

    return {
      organization,
      compliance: {
        documentsCount: documents,
        requiredTrainingsCount: trainings,
        completedTrainingsCount: completedTrainings,
        complianceScore:
          trainings > 0
            ? Math.round((completedTrainings / trainings) * 100)
            : 0,
      },
    };
  }

  // Full sync operation
  static async fullSync(organizationId?: string) {
    try {
      const [documents, trainings] = await Promise.all([
        this.syncDocumentsToDatabase(organizationId),
        this.syncTrainingToDatabase(organizationId),
      ]);

      return {
        success: true,
        syncedDocuments: documents.length,
        syncedTrainings: trainings.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Full sync error:", error);
      throw error;
    }
  }
}
