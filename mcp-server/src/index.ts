#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";

interface ComplianceDocument {
  title: string;
  url: string;
  description?: string;
  lastUpdated?: string;
  category: string;
}

interface TrainingRequirement {
  title: string;
  description: string;
  requirements: string[];
  url?: string;
}

interface Guideline {
  title: string;
  content: string;
  section: string;
  url: string;
}

interface RiskAssessmentQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "yes_no" | "text" | "scale";
  options?: string[];
  category: string;
  riskLevel: "low" | "medium" | "high";
  guidance: string;
  complianceReference?: string;
}

interface RiskAssessmentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: RiskAssessmentQuestion[];
  scoringCriteria: {
    low: { min: number; max: number; description: string };
    medium: { min: number; max: number; description: string };
    high: { min: number; max: number; description: string };
  };
}

interface RiskAssessmentResult {
  templateId: string;
  responses: Record<string, any>;
  score: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  complianceGaps: string[];
  nextSteps: string[];
}

const BASE_URL = "https://www.gamblingcommission.gov.uk";
const ARCADE_SECTOR_URL = `${BASE_URL}/licensees-and-businesses/sectors/sector/arcades`;

class GamblingComplianceServer {
  private server: Server;
  private axiosInstance;
  private riskAssessmentTemplates: RiskAssessmentTemplate[] = [];

  constructor() {
    this.server = new Server(
      {
        name: "gambling-compliance-server",
        version: "0.2.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    this.initializeRiskAssessmentTemplates();
    this.setupResourceHandlers();
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private initializeRiskAssessmentTemplates() {
    this.riskAssessmentTemplates = [
      {
        id: "arcade-licensing-assessment",
        title: "Arcade Licensing Risk Assessment",
        description:
          "Comprehensive risk assessment for arcade licensing compliance",
        category: "licensing",
        questions: [
          {
            id: "license-validity",
            question:
              "Do you have a valid arcade operating licence from the Gambling Commission?",
            type: "yes_no",
            category: "licensing",
            riskLevel: "high",
            guidance:
              "Operating without a valid licence is illegal and carries severe penalties.",
            complianceReference: "Gambling Act 2005",
          },
          {
            id: "license-conditions",
            question:
              "Are you compliant with all conditions attached to your licence?",
            type: "multiple_choice",
            options: [
              "Fully compliant",
              "Mostly compliant",
              "Some non-compliance",
              "Significant non-compliance",
            ],
            category: "licensing",
            riskLevel: "high",
            guidance:
              "Licence conditions must be strictly adhered to avoid regulatory action.",
          },
          {
            id: "age-verification",
            question:
              "Do you have robust age verification procedures in place?",
            type: "scale",
            category: "responsible-gambling",
            riskLevel: "high",
            guidance:
              "Age verification is critical to prevent underage gambling.",
          },
          {
            id: "staff-training-frequency",
            question: "How often do you conduct compliance training for staff?",
            type: "multiple_choice",
            options: ["Monthly", "Quarterly", "Annually", "Ad-hoc", "Never"],
            category: "training",
            riskLevel: "medium",
            guidance:
              "Regular training ensures staff understand their compliance obligations.",
          },
          {
            id: "record-keeping",
            question:
              "Do you maintain comprehensive records of all gambling activities?",
            type: "yes_no",
            category: "compliance",
            riskLevel: "medium",
            guidance:
              "Proper record-keeping is essential for regulatory compliance and audits.",
          },
        ],
        scoringCriteria: {
          low: {
            min: 0,
            max: 30,
            description: "Low risk - Good compliance practices in place",
          },
          medium: {
            min: 31,
            max: 60,
            description: "Medium risk - Some areas need attention",
          },
          high: {
            min: 61,
            max: 100,
            description: "High risk - Immediate action required",
          },
        },
      },
      {
        id: "responsible-gambling-assessment",
        title: "Responsible Gambling Risk Assessment",
        description:
          "Assessment of responsible gambling measures and customer protection",
        category: "responsible-gambling",
        questions: [
          {
            id: "customer-interaction",
            question:
              "Do staff actively monitor customer behavior for signs of problem gambling?",
            type: "scale",
            category: "responsible-gambling",
            riskLevel: "high",
            guidance:
              "Active monitoring helps identify and support customers at risk.",
          },
          {
            id: "self-exclusion",
            question: "Do you have effective self-exclusion procedures?",
            type: "yes_no",
            category: "responsible-gambling",
            riskLevel: "high",
            guidance: "Self-exclusion is a key customer protection measure.",
          },
          {
            id: "spending-limits",
            question:
              "Are there mechanisms to help customers control their spending?",
            type: "multiple_choice",
            options: [
              "Comprehensive controls",
              "Basic controls",
              "Limited controls",
              "No controls",
            ],
            category: "responsible-gambling",
            riskLevel: "medium",
            guidance: "Spending controls help prevent excessive gambling.",
          },
        ],
        scoringCriteria: {
          low: {
            min: 0,
            max: 25,
            description: "Low risk - Strong responsible gambling measures",
          },
          medium: {
            min: 26,
            max: 50,
            description:
              "Medium risk - Adequate measures with room for improvement",
          },
          high: {
            min: 51,
            max: 100,
            description:
              "High risk - Insufficient customer protection measures",
          },
        },
      },
    ];
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "gambling://arcades/overview",
          name: "Arcade Sector Overview",
          mimeType: "application/json",
          description: "Overview of arcade sector regulations and requirements",
        },
        {
          uri: "gambling://arcades/documents",
          name: "Compliance Documents",
          mimeType: "application/json",
          description: "List of all compliance documents for arcade operators",
        },
        {
          uri: "gambling://arcades/training",
          name: "Training Requirements",
          mimeType: "application/json",
          description: "Staff training requirements for arcade operations",
        },
        {
          uri: "gambling://arcades/risk-templates",
          name: "Risk Assessment Templates",
          mimeType: "application/json",
          description:
            "Available risk assessment templates for arcade operators",
        },
      ],
    }));

    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => ({
        resourceTemplates: [
          {
            uriTemplate: "gambling://arcades/guidelines/{category}",
            name: "Guidelines by Category",
            mimeType: "application/json",
            description:
              "Specific guidelines for different arcade compliance categories",
          },
        ],
      })
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const uri = request.params.uri;

        try {
          if (uri === "gambling://arcades/overview") {
            const overview = await this.scrapeArcadeOverview();
            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(overview, null, 2),
                },
              ],
            };
          }

          if (uri === "gambling://arcades/documents") {
            const documents = await this.scrapeComplianceDocuments();
            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(documents, null, 2),
                },
              ],
            };
          }

          if (uri === "gambling://arcades/training") {
            const training = await this.scrapeTrainingRequirements();
            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(training, null, 2),
                },
              ],
            };
          }

          if (uri === "gambling://arcades/risk-templates") {
            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(this.riskAssessmentTemplates, null, 2),
                },
              ],
            };
          }

          // Handle template URIs
          const categoryMatch = uri.match(
            /^gambling:\/\/arcades\/guidelines\/(.+)$/
          );
          if (categoryMatch) {
            const category = decodeURIComponent(categoryMatch[1]);
            const guidelines = await this.scrapeGuidelinesByCategory(category);
            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: "application/json",
                  text: JSON.stringify(guidelines, null, 2),
                },
              ],
            };
          }

          throw new McpError(
            ErrorCode.InvalidRequest,
            `Unknown resource URI: ${uri}`
          );
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to fetch resource: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    );
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_compliance_documents",
          description: "Get all compliance documents for arcade operators",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Filter by document category (optional)",
              },
            },
            required: [],
          },
        },
        {
          name: "get_training_requirements",
          description: "Get staff training requirements for arcade operations",
          inputSchema: {
            type: "object",
            properties: {
              detailed: {
                type: "boolean",
                description:
                  "Include detailed requirements and testing information",
                default: false,
              },
            },
            required: [],
          },
        },
        {
          name: "get_guidelines",
          description: "Get specific guidelines for arcade compliance",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description:
                  'Category of guidelines (e.g., "licensing", "operations", "responsible-gambling")',
              },
              search: {
                type: "string",
                description: "Search term to filter guidelines",
              },
            },
            required: [],
          },
        },
        {
          name: "search_compliance_info",
          description:
            "Search for specific compliance information across all arcade sector content",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for compliance information",
              },
              include_documents: {
                type: "boolean",
                description: "Include document links in results",
                default: true,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_risk_assessment_templates",
          description:
            "Get available risk assessment templates for arcade operators",
          inputSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Filter templates by category (optional)",
              },
            },
            required: [],
          },
        },
        {
          name: "start_risk_assessment",
          description: "Start a new risk assessment session with questions",
          inputSchema: {
            type: "object",
            properties: {
              template_id: {
                type: "string",
                description: "ID of the risk assessment template to use",
              },
            },
            required: ["template_id"],
          },
        },
        {
          name: "submit_risk_assessment",
          description:
            "Submit completed risk assessment responses and get results",
          inputSchema: {
            type: "object",
            properties: {
              template_id: {
                type: "string",
                description: "ID of the risk assessment template",
              },
              responses: {
                type: "object",
                description: "Question responses as key-value pairs",
              },
            },
            required: ["template_id", "responses"],
          },
        },
        {
          name: "generate_compliance_action_plan",
          description:
            "Generate an action plan based on risk assessment results",
          inputSchema: {
            type: "object",
            properties: {
              assessment_result: {
                type: "object",
                description: "Risk assessment result object",
              },
            },
            required: ["assessment_result"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "get_compliance_documents":
            return await this.handleGetComplianceDocuments(
              request.params.arguments
            );

          case "get_training_requirements":
            return await this.handleGetTrainingRequirements(
              request.params.arguments
            );

          case "get_guidelines":
            return await this.handleGetGuidelines(request.params.arguments);

          case "search_compliance_info":
            return await this.handleSearchComplianceInfo(
              request.params.arguments
            );

          case "get_risk_assessment_templates":
            return await this.handleGetRiskAssessmentTemplates(
              request.params.arguments
            );

          case "start_risk_assessment":
            return await this.handleStartRiskAssessment(
              request.params.arguments
            );

          case "submit_risk_assessment":
            return await this.handleSubmitRiskAssessment(
              request.params.arguments
            );

          case "generate_compliance_action_plan":
            return await this.handleGenerateComplianceActionPlan(
              request.params.arguments
            );

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async scrapeArcadeOverview() {
    const response = await this.axiosInstance.get(ARCADE_SECTOR_URL);
    const $ = cheerio.load(response.data);

    const overview = {
      title: $("h1").first().text().trim(),
      description: $(".page-intro, .lead").first().text().trim(),
      lastUpdated: new Date().toISOString(),
      sections: [] as Array<{ title: string; content: string }>,
      keyPoints: [] as string[],
    };

    // Extract main sections
    $("h2, h3").each((_, element) => {
      const $el = $(element);
      const title = $el.text().trim();
      const content = $el.nextUntil("h2, h3").text().trim();
      if (title && content) {
        overview.sections.push({ title, content });
      }
    });

    // Extract key points from lists
    $("ul li, ol li").each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 20) {
        overview.keyPoints.push(text);
      }
    });

    return overview;
  }

  private async scrapeComplianceDocuments(): Promise<ComplianceDocument[]> {
    const response = await this.axiosInstance.get(ARCADE_SECTOR_URL);
    const $ = cheerio.load(response.data);
    const documents: ComplianceDocument[] = [];

    // Look for document links
    $('a[href*=".pdf"], a[href*="/guidance"], a[href*="/document"]').each(
      (_, element) => {
        const $link = $(element);
        const title = $link.text().trim();
        const href = $link.attr("href");

        if (title && href) {
          const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          const description = $link
            .closest("li, p, div")
            .text()
            .replace(title, "")
            .trim();

          documents.push({
            title,
            url,
            description: description || undefined,
            category: this.categorizeDocument(title),
          });
        }
      }
    );

    return documents;
  }

  private async scrapeTrainingRequirements(): Promise<TrainingRequirement[]> {
    const response = await this.axiosInstance.get(ARCADE_SECTOR_URL);
    const $ = cheerio.load(response.data);
    const requirements: TrainingRequirement[] = [];

    // Look for training-related sections
    $("h2, h3").each((_, element) => {
      const $heading = $(element);
      const headingText = $heading.text().toLowerCase();

      if (
        headingText.includes("training") ||
        headingText.includes("staff") ||
        headingText.includes("competency")
      ) {
        const title = $heading.text().trim();
        const $content = $heading.nextUntil("h2, h3");
        const description = $content.find("p").first().text().trim();
        const requirementsList: string[] = [];

        $content.find("li").each((_, li) => {
          const requirement = $(li).text().trim();
          if (requirement) {
            requirementsList.push(requirement);
          }
        });

        if (title && (description || requirementsList.length > 0)) {
          requirements.push({
            title,
            description: description || "Training requirement details",
            requirements: requirementsList,
          });
        }
      }
    });

    return requirements;
  }

  private async scrapeGuidelinesByCategory(
    category: string
  ): Promise<Guideline[]> {
    const response = await this.axiosInstance.get(ARCADE_SECTOR_URL);
    const $ = cheerio.load(response.data);
    const guidelines: Guideline[] = [];

    $("h2, h3, h4").each((_, element) => {
      const $heading = $(element);
      const title = $heading.text().trim();
      const headingText = title.toLowerCase();

      if (
        headingText.includes(category.toLowerCase()) ||
        category.toLowerCase() === "all"
      ) {
        const content = $heading.nextUntil("h2, h3, h4").text().trim();

        if (content) {
          guidelines.push({
            title,
            content,
            section: category,
            url: ARCADE_SECTOR_URL,
          });
        }
      }
    });

    return guidelines;
  }

  private categorizeDocument(title: string): string {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("licence") || titleLower.includes("license"))
      return "licensing";
    if (titleLower.includes("training") || titleLower.includes("staff"))
      return "training";
    if (titleLower.includes("responsible") || titleLower.includes("protection"))
      return "responsible-gambling";
    if (titleLower.includes("compliance") || titleLower.includes("requirement"))
      return "compliance";
    if (titleLower.includes("guidance") || titleLower.includes("guideline"))
      return "guidance";

    return "general";
  }

  private async handleGetComplianceDocuments(args: any) {
    const documents = await this.scrapeComplianceDocuments();
    const filtered = args?.category
      ? documents.filter((doc) => doc.category === args.category)
      : documents;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  }

  private async handleGetTrainingRequirements(args: any) {
    const requirements = await this.scrapeTrainingRequirements();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(requirements, null, 2),
        },
      ],
    };
  }

  private async handleGetGuidelines(args: any) {
    const category = args?.category || "all";
    const guidelines = await this.scrapeGuidelinesByCategory(category);

    let filtered = guidelines;
    if (args?.search) {
      const searchTerm = args.search.toLowerCase();
      filtered = guidelines.filter(
        (g) =>
          g.title.toLowerCase().includes(searchTerm) ||
          g.content.toLowerCase().includes(searchTerm)
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  }

  private async handleSearchComplianceInfo(args: any) {
    const query = args.query.toLowerCase();
    const overview = await this.scrapeArcadeOverview();
    const documents = args.include_documents
      ? await this.scrapeComplianceDocuments()
      : [];

    const results = {
      query: args.query,
      overview_matches: overview.sections.filter(
        (section) =>
          section.title.toLowerCase().includes(query) ||
          section.content.toLowerCase().includes(query)
      ),
      key_points: overview.keyPoints.filter((point) =>
        point.toLowerCase().includes(query)
      ),
      documents: documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          (doc.description && doc.description.toLowerCase().includes(query))
      ),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleGetRiskAssessmentTemplates(args: any) {
    let templates = this.riskAssessmentTemplates;

    if (args?.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(templates, null, 2),
        },
      ],
    };
  }

  private async handleStartRiskAssessment(args: any) {
    const template = this.riskAssessmentTemplates.find(
      (t) => t.id === args.template_id
    );

    if (!template) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Risk assessment template not found: ${args.template_id}`
      );
    }

    const session = {
      templateId: template.id,
      title: template.title,
      description: template.description,
      questions: template.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        guidance: q.guidance,
        complianceReference: q.complianceReference,
      })),
      instructions:
        "Please answer each question honestly and thoroughly. Your responses will be used to assess compliance risks and generate recommendations.",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(session, null, 2),
        },
      ],
    };
  }

  private async handleSubmitRiskAssessment(args: any) {
    const template = this.riskAssessmentTemplates.find(
      (t) => t.id === args.template_id
    );

    if (!template) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Risk assessment template not found: ${args.template_id}`
      );
    }

    const responses = args.responses;
    let totalScore = 0;
    const recommendations: string[] = [];
    const complianceGaps: string[] = [];

    // Calculate risk score based on responses
    template.questions.forEach((question) => {
      const response = responses[question.id];
      let questionScore = 0;

      if (question.type === "yes_no") {
        questionScore = response === "no" ? 20 : 0;
      } else if (question.type === "multiple_choice") {
        const optionIndex = question.options?.indexOf(response) || 0;
        questionScore = optionIndex * 5;
      } else if (question.type === "scale") {
        questionScore = (10 - (response || 10)) * 2;
      }

      // Apply risk level multiplier
      if (question.riskLevel === "high") questionScore *= 2;
      else if (question.riskLevel === "medium") questionScore *= 1.5;

      totalScore += questionScore;

      // Generate recommendations based on responses
      if (questionScore > 10) {
        recommendations.push(`${question.category}: ${question.guidance}`);
        complianceGaps.push(question.question);
      }
    });

    // Determine overall risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (totalScore >= template.scoringCriteria.high.min) {
      riskLevel = "high";
    } else if (totalScore >= template.scoringCriteria.medium.min) {
      riskLevel = "medium";
    }

    const result: RiskAssessmentResult = {
      templateId: template.id,
      responses,
      score: totalScore,
      riskLevel,
      recommendations: [...new Set(recommendations)],
      complianceGaps: [...new Set(complianceGaps)],
      nextSteps: this.generateNextSteps(riskLevel, complianceGaps),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGenerateComplianceActionPlan(args: any) {
    const assessmentResult = args.assessment_result;

    const actionPlan = {
      assessmentSummary: {
        riskLevel: assessmentResult.riskLevel,
        score: assessmentResult.score,
        totalGaps: assessmentResult.complianceGaps.length,
      },
      immediateActions: this.getImmediateActions(assessmentResult.riskLevel),
      shortTermActions: assessmentResult.recommendations.slice(0, 5),
      longTermActions: this.getLongTermActions(assessmentResult.complianceGaps),
      trainingNeeds: this.identifyTrainingNeeds(
        assessmentResult.complianceGaps
      ),
      reviewSchedule: this.getReviewSchedule(assessmentResult.riskLevel),
      resources: this.getRelevantResources(assessmentResult.complianceGaps),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(actionPlan, null, 2),
        },
      ],
    };
  }

  private generateNextSteps(riskLevel: string, gaps: string[]): string[] {
    const steps: string[] = [];

    if (riskLevel === "high") {
      steps.push("Immediate review of all compliance procedures required");
      steps.push("Consider engaging compliance consultant");
      steps.push("Schedule urgent staff training");
    } else if (riskLevel === "medium") {
      steps.push("Review and update compliance procedures");
      steps.push("Schedule additional staff training");
      steps.push("Implement enhanced monitoring");
    } else {
      steps.push("Continue current good practices");
      steps.push("Regular review of procedures");
      steps.push("Stay updated with regulatory changes");
    }

    if (gaps.length > 0) {
      steps.push("Address identified compliance gaps");
      steps.push("Document corrective actions taken");
    }

    return steps;
  }

  private getImmediateActions(riskLevel: string): string[] {
    if (riskLevel === "high") {
      return [
        "Stop any non-compliant activities immediately",
        "Review all current procedures",
        "Contact legal/compliance advisor",
        "Document all current practices",
      ];
    } else if (riskLevel === "medium") {
      return [
        "Review identified risk areas",
        "Update relevant procedures",
        "Brief all staff on compliance requirements",
      ];
    }
    return ["Continue monitoring compliance", "Regular procedure reviews"];
  }

  private getLongTermActions(gaps: string[]): string[] {
    const actions: string[] = [];

    if (gaps.some((gap) => gap.toLowerCase().includes("training"))) {
      actions.push("Develop comprehensive training program");
    }
    if (gaps.some((gap) => gap.toLowerCase().includes("record"))) {
      actions.push("Implement robust record-keeping system");
    }
    if (gaps.some((gap) => gap.toLowerCase().includes("age"))) {
      actions.push("Enhance age verification procedures");
    }

    actions.push("Regular compliance audits");
    actions.push("Stay updated with regulatory changes");

    return actions;
  }

  private identifyTrainingNeeds(gaps: string[]): string[] {
    const needs: string[] = [];

    if (gaps.some((gap) => gap.toLowerCase().includes("licence"))) {
      needs.push("Licensing requirements and conditions");
    }
    if (gaps.some((gap) => gap.toLowerCase().includes("age"))) {
      needs.push("Age verification procedures");
    }
    if (gaps.some((gap) => gap.toLowerCase().includes("responsible"))) {
      needs.push("Responsible gambling procedures");
    }
    if (gaps.some((gap) => gap.toLowerCase().includes("record"))) {
      needs.push("Record keeping and documentation");
    }

    needs.push("General compliance awareness");
    needs.push("Regulatory updates and changes");

    return needs;
  }

  private getReviewSchedule(riskLevel: string): {
    frequency: string;
    nextReview: string;
    description: string;
  } {
    const now = new Date();
    let frequency: string;
    let monthsToAdd: number;

    if (riskLevel === "high") {
      frequency = "Monthly";
      monthsToAdd = 1;
    } else if (riskLevel === "medium") {
      frequency = "Quarterly";
      monthsToAdd = 3;
    } else {
      frequency = "Annually";
      monthsToAdd = 12;
    }

    const nextReview = new Date(
      now.getFullYear(),
      now.getMonth() + monthsToAdd,
      now.getDate()
    );

    return {
      frequency,
      nextReview: nextReview.toISOString().split("T")[0],
      description: `${frequency} compliance reviews recommended for ${riskLevel} risk level`,
    };
  }

  private getRelevantResources(
    gaps: string[]
  ): Array<{ title: string; url: string; description: string }> {
    const resources: Array<{
      title: string;
      url: string;
      description: string;
    }> = [];

    if (gaps.some((gap) => gap.toLowerCase().includes("licence"))) {
      resources.push({
        title: "Gambling Commission Licensing Guide",
        url: "https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide",
        description: "Comprehensive guide to gambling licensing requirements",
      });
    }

    if (gaps.some((gap) => gap.toLowerCase().includes("age"))) {
      resources.push({
        title: "Age Verification Guidance",
        url: "https://www.gamblingcommission.gov.uk/guidance/age-verification",
        description: "Best practices for age verification procedures",
      });
    }

    if (gaps.some((gap) => gap.toLowerCase().includes("responsible"))) {
      resources.push({
        title: "Responsible Gambling Code of Practice",
        url: "https://www.gamblingcommission.gov.uk/guidance/responsible-gambling",
        description: "Code of practice for responsible gambling measures",
      });
    }

    resources.push({
      title: "Arcade Sector Guidance",
      url: ARCADE_SECTOR_URL,
      description: "Specific guidance for arcade operators",
    });

    return resources;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Gambling Compliance MCP server running on stdio");
  }
}

const server = new GamblingComplianceServer();
server.run().catch(console.error);
