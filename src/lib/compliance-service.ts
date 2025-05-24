// Service to integrate with the gambling compliance MCP server
// This would typically connect to the MCP server, but for now we'll simulate the data

export interface ComplianceDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  url?: string;
  lastUpdated: string;
}

export interface TrainingRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  isRequired: boolean;
  duration?: number;
  frequency?: string;
}

export interface ComplianceGuideline {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

export class ComplianceService {
  // In a real implementation, this would connect to the MCP server
  // For now, we'll return mock data that matches the MCP server structure

  static async getComplianceDocuments(
    category?: string
  ): Promise<ComplianceDocument[]> {
    // This would use the MCP server's get_compliance_documents tool
    const mockDocuments: ComplianceDocument[] = [
      {
        id: "1",
        title: "Arcade Operator License Application",
        category: "licensing",
        description: "Application form for arcade operator license",
        url: "/documents/license-application.pdf",
        lastUpdated: "2024-01-15",
      },
      {
        id: "2",
        title: "Age Verification Procedures",
        category: "operations",
        description: "Standard procedures for age verification in arcades",
        url: "/documents/age-verification.pdf",
        lastUpdated: "2024-02-01",
      },
      {
        id: "3",
        title: "Responsible Gambling Policy Template",
        category: "responsible-gambling",
        description: "Template for responsible gambling policies",
        url: "/documents/responsible-gambling-policy.pdf",
        lastUpdated: "2024-01-20",
      },
    ];

    if (category) {
      return mockDocuments.filter((doc) => doc.category === category);
    }
    return mockDocuments;
  }

  static async getTrainingRequirements(
    detailed = false
  ): Promise<TrainingRequirement[]> {
    // This would use the MCP server's get_training_requirements tool
    const mockTraining: TrainingRequirement[] = [
      {
        id: "1",
        title: "Responsible Gambling Awareness",
        description:
          "Training on identifying and supporting customers with gambling problems",
        category: "responsible-gambling",
        isRequired: true,
        duration: 120,
        frequency: "Annual",
      },
      {
        id: "2",
        title: "Age Verification Training",
        description: "Training on proper age verification procedures",
        category: "age-verification",
        isRequired: true,
        duration: 60,
        frequency: "Annual",
      },
      {
        id: "3",
        title: "Customer Service Excellence",
        description: "Training on providing excellent customer service",
        category: "customer-service",
        isRequired: false,
        duration: 90,
        frequency: "Bi-annual",
      },
    ];

    return mockTraining;
  }

  static async getGuidelines(
    category?: string,
    search?: string
  ): Promise<ComplianceGuideline[]> {
    // This would use the MCP server's get_guidelines tool
    const mockGuidelines: ComplianceGuideline[] = [
      {
        id: "1",
        title: "Licensing Requirements for Arcade Operators",
        category: "licensing",
        content: "Detailed guidelines on licensing requirements...",
        lastUpdated: "2024-01-10",
      },
      {
        id: "2",
        title: "Daily Operations Checklist",
        category: "operations",
        content: "Daily checklist for arcade operations...",
        lastUpdated: "2024-01-15",
      },
      {
        id: "3",
        title: "Responsible Gambling Best Practices",
        category: "responsible-gambling",
        content: "Best practices for responsible gambling...",
        lastUpdated: "2024-02-01",
      },
    ];

    let filtered = mockGuidelines;

    if (category) {
      filtered = filtered.filter(
        (guideline) => guideline.category === category
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (guideline) =>
          guideline.title.toLowerCase().includes(searchLower) ||
          guideline.content.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  static async searchComplianceInfo(
    query: string,
    includeDocuments = true
  ): Promise<any> {
    // This would use the MCP server's search_compliance_info tool
    const documents = includeDocuments
      ? await this.getComplianceDocuments()
      : [];
    const guidelines = await this.getGuidelines();
    const training = await this.getTrainingRequirements();

    const queryLower = query.toLowerCase();

    const results = {
      documents: documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(queryLower) ||
          doc.description.toLowerCase().includes(queryLower)
      ),
      guidelines: guidelines.filter(
        (guideline) =>
          guideline.title.toLowerCase().includes(queryLower) ||
          guideline.content.toLowerCase().includes(queryLower)
      ),
      training: training.filter(
        (t) =>
          t.title.toLowerCase().includes(queryLower) ||
          t.description.toLowerCase().includes(queryLower)
      ),
    };

    return results;
  }
}
