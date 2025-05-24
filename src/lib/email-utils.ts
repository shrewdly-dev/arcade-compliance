import { sendEmail, emailTemplates } from "./email";

// Utility functions for sending specific types of emails
export const emailUtils = {
  // Send welcome email to new users
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    organizationName: string
  ) {
    const template = emailTemplates.welcomeEmail(userName, organizationName);
    return await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });
  },

  // Send training reminder
  async sendTrainingReminder(
    userEmail: string,
    userName: string,
    trainingTitle: string,
    dueDate: string
  ) {
    const template = emailTemplates.trainingReminder(
      userName,
      trainingTitle,
      dueDate
    );
    return await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });
  },

  // Send incident alert to administrators
  async sendIncidentAlert(
    recipients: string[],
    reporterName: string,
    incidentTitle: string,
    severity: string
  ) {
    const template = emailTemplates.incidentAlert(
      reporterName,
      incidentTitle,
      severity
    );
    return await sendEmail({
      to: recipients,
      subject: template.subject,
      html: template.html,
    });
  },

  // Send document expiry notice
  async sendDocumentExpiryNotice(
    userEmail: string,
    userName: string,
    documentTitle: string,
    expiryDate: string
  ) {
    const template = emailTemplates.documentExpiry(
      userName,
      documentTitle,
      expiryDate
    );
    return await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });
  },

  // Send assessment results
  async sendAssessmentResults(
    userEmail: string,
    userName: string,
    assessmentTitle: string,
    score: number,
    passed: boolean
  ) {
    const template = emailTemplates.assessmentResults(
      userName,
      assessmentTitle,
      score,
      passed
    );
    return await sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
    });
  },

  // Send custom email
  async sendCustomEmail(
    recipients: string | string[],
    subject: string,
    htmlContent: string
  ) {
    return await sendEmail({
      to: recipients,
      subject,
      html: htmlContent,
    });
  },
};

// Email notification triggers for different events
export const emailNotifications = {
  // Trigger when user signs up
  async onUserSignup(
    userEmail: string,
    userName: string,
    organizationName: string
  ) {
    try {
      await emailUtils.sendWelcomeEmail(userEmail, userName, organizationName);
      console.log(`Welcome email sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  },

  // Trigger when training is due
  async onTrainingDue(
    userEmail: string,
    userName: string,
    trainingTitle: string,
    dueDate: string
  ) {
    try {
      await emailUtils.sendTrainingReminder(
        userEmail,
        userName,
        trainingTitle,
        dueDate
      );
      console.log(`Training reminder sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send training reminder:", error);
    }
  },

  // Trigger when incident is reported
  async onIncidentReported(
    adminEmails: string[],
    reporterName: string,
    incidentTitle: string,
    severity: string
  ) {
    try {
      await emailUtils.sendIncidentAlert(
        adminEmails,
        reporterName,
        incidentTitle,
        severity
      );
      console.log(
        `Incident alert sent to ${adminEmails.length} administrators`
      );
    } catch (error) {
      console.error("Failed to send incident alert:", error);
    }
  },

  // Trigger when document is expiring
  async onDocumentExpiring(
    userEmail: string,
    userName: string,
    documentTitle: string,
    expiryDate: string
  ) {
    try {
      await emailUtils.sendDocumentExpiryNotice(
        userEmail,
        userName,
        documentTitle,
        expiryDate
      );
      console.log(`Document expiry notice sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send document expiry notice:", error);
    }
  },

  // Trigger when assessment is completed
  async onAssessmentCompleted(
    userEmail: string,
    userName: string,
    assessmentTitle: string,
    score: number,
    passed: boolean
  ) {
    try {
      await emailUtils.sendAssessmentResults(
        userEmail,
        userName,
        assessmentTitle,
        score,
        passed
      );
      console.log(`Assessment results sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send assessment results:", error);
    }
  },
};
