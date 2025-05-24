"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import OrganizationDetailsForm from "@/components/onboarding/organization-details-form";
import LicensingForm from "@/components/onboarding/licensing-form";
import KeyPersonnelForm from "@/components/onboarding/key-personnel-form";
import ArcadeSetupForm from "@/components/onboarding/arcade-setup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ClockIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: "completed" | "current" | "upcoming";
  component?: React.ComponentType<any>;
}

interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  userRole: string;
  needsOnboarding: boolean;
  organizations: any[];
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditingStep, setIsEditingStep] = useState(false);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);

  // Check onboarding status when user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      checkOnboardingStatus();
    }
  }, [status, session, router]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status");
      if (response.ok) {
        const data = await response.json();
        setOnboardingStatus(data);

        // If user doesn't need onboarding (non-admin or already completed), show management options
        if (!data.needsOnboarding && data.hasCompletedOnboarding) {
          // Don't redirect, show management interface instead
          return;
        }

        // If user doesn't need onboarding and hasn't completed it, redirect to dashboard
        if (!data.needsOnboarding) {
          router.push("/dashboard");
          return;
        }

        // Set current step and completed steps from database
        if (data.currentStep) {
          setCurrentStep(data.currentStep);
          // Mark all previous steps as completed
          const completed = [];
          for (let i = 1; i < data.currentStep; i++) {
            completed.push(i);
          }
          setCompletedSteps(completed);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Organization Details",
      description: "Basic information about your arcade business",
      icon: BuildingOfficeIcon,
      status:
        currentStep === 1
          ? "current"
          : completedSteps.includes(1)
            ? "completed"
            : "upcoming",
      component: OrganizationDetailsForm,
    },
    {
      id: 2,
      title: "Licensing Information",
      description: "Your gambling licenses and permits",
      icon: DocumentTextIcon,
      status:
        currentStep === 2
          ? "current"
          : completedSteps.includes(2)
            ? "completed"
            : "upcoming",
      component: LicensingForm,
    },
    {
      id: 3,
      title: "Key Personnel",
      description: "Management and key staff information",
      icon: UserGroupIcon,
      status:
        currentStep === 3
          ? "current"
          : completedSteps.includes(3)
            ? "completed"
            : "upcoming",
      component: KeyPersonnelForm,
    },
    {
      id: 4,
      title: "Arcade Setup",
      description: "Register your first arcade location",
      icon: BuildingStorefrontIcon,
      status:
        currentStep === 4
          ? "current"
          : completedSteps.includes(4)
            ? "completed"
            : "upcoming",
      component: ArcadeSetupForm,
    },
    {
      id: 5,
      title: "Compliance Setup",
      description: "Policies and procedures for compliance",
      icon: ShieldCheckIcon,
      status:
        currentStep === 5
          ? "current"
          : completedSteps.includes(5)
            ? "completed"
            : "upcoming",
    },
    {
      id: 6,
      title: "Regulatory Returns",
      description: "Data collection and reporting setup",
      icon: ClockIcon,
      status:
        currentStep === 6
          ? "current"
          : completedSteps.includes(6)
            ? "completed"
            : "upcoming",
    },
  ];

  const handleStepComplete = async (stepData: any) => {
    console.log("Step completed:", currentStep, stepData);

    // Mark step as completed if not already
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setShowForm(false);

    // If editing, find and redirect to the next incomplete step
    if (isEditingStep) {
      setIsEditingStep(false);

      // Refresh the steps status after completing the edit
      const updatedSteps = steps.map((step) => ({
        ...step,
        status:
          completedSteps.includes(step.id) || step.id === currentStep
            ? ("completed" as const)
            : step.id === currentStep + 1
              ? ("current" as const)
              : ("upcoming" as const),
      }));

      // Find the next incomplete step
      const nextIncompleteStep = updatedSteps.find(
        (step) => step.status !== "completed"
      );
      if (nextIncompleteStep && nextIncompleteStep.component) {
        setCurrentStep(nextIncompleteStep.id);
        setIsEditingStep(false);
        setShowForm(true);
        return;
      }

      // If no incomplete steps with components, just return to overview
      return;
    }

    const nextStep = currentStep + 1;

    // Update onboarding progress in database
    try {
      await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: nextStep > steps.length,
          step: nextStep,
        }),
      });
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }

    if (nextStep <= steps.length) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepBack = () => {
    setShowForm(false);
    setIsEditingStep(false);
  };

  const handleStartStep = (stepId: number) => {
    setCurrentStep(stepId);
    setIsEditingStep(false);
    setShowForm(true);
  };

  const handleEditStep = (stepId: number) => {
    setCurrentStep(stepId);
    setIsEditingStep(true);
    setShowForm(true);
  };

  const handleContinueOnboarding = () => {
    // Find the next incomplete step
    const nextStep = steps.find((step) => step.status !== "completed");
    if (nextStep) {
      setCurrentStep(nextStep.id);
      setIsEditingStep(false);
      if (nextStep.component) {
        setShowForm(true);
      }
    }
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);

    try {
      // Mark onboarding as completed
      await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: true,
          step: steps.length,
        }),
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication and onboarding status
  if (
    status === "loading" ||
    (status === "authenticated" && onboardingStatus === null)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  // Show management interface for users who have completed onboarding
  if (
    onboardingStatus &&
    onboardingStatus.hasCompletedOnboarding &&
    !onboardingStatus.needsOnboarding
  ) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative z-10 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Organization Management 🎮
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Your organization setup is complete! You can review and update
              your information, or manage your arcade locations and machines.
            </p>
            {session?.user && (
              <div className="mt-4 text-purple-300">
                Welcome back, {session.user.name || session.user.email}!
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-300/30 backdrop-blur-lg shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-blue-600">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white">
                    Update Organization
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">
                  Modify your organization details, licensing information, and
                  key personnel.
                </p>
                <button
                  onClick={() => handleEditStep(1)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-all duration-200"
                >
                  Edit Details
                </button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-300/30 backdrop-blur-lg shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-green-600">
                    <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white">Manage Arcades</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">
                  Add new arcade locations or update existing arcade
                  information.
                </p>
                <button
                  onClick={() => handleEditStep(4)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-green-700 transition-all duration-200"
                >
                  Manage Arcades
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Link */}
          <div className="text-center">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 max-w-2xl mx-auto">
              <CardContent className="text-center py-8">
                <h3 className="text-white text-xl font-semibold mb-4">
                  Ready to manage your compliance?
                </h3>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 inline-flex items-center"
                >
                  Go to Dashboard
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show message for non-admin users
  if (
    onboardingStatus &&
    !onboardingStatus.needsOnboarding &&
    onboardingStatus.userRole !== "ADMIN"
  ) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">
              Onboarding Not Required
            </CardTitle>
            <CardDescription className="text-blue-200 text-lg">
              As a {onboardingStatus.userRole.toLowerCase()} user, you don't
              need to complete the organization onboarding process. Only admin
              users are required to set up the organization details.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Go to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepData = steps.find((step) => step.id === currentStep);
  const CurrentStepComponent = currentStepData?.component;
  const allStepsCompleted = completedSteps.length === steps.length;
  const hasIncompleteSteps = steps.some((step) => step.status !== "completed");

  // Show form if we're in form mode
  if (showForm && CurrentStepComponent) {
    return (
      <CurrentStepComponent
        onComplete={handleStepComplete}
        onBack={handleStepBack}
      />
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Arcade Compliance! 🎮
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            As an admin user, let's set up your organization for compliance
            success. We'll guide you through collecting all the necessary
            information to ensure your arcades meets regulatory requirements.
          </p>
          {session?.user && (
            <div className="mt-4 text-purple-300">
              Welcome back, {session.user.name || session.user.email}!
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Onboarding Progress
              </h2>
              <span className="text-purple-300 font-medium">
                {completedSteps.length} of {steps.length} completed
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${(completedSteps.length / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";
            // Allow access to completed steps for editing
            const isAccessible = step.id <= currentStep || isCompleted;

            return (
              <Card
                key={step.id}
                className={`relative transition-all duration-300 transform hover:scale-105 ${
                  isCompleted
                    ? "bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-300/30"
                    : isCurrent
                      ? "bg-gradient-to-br from-purple-500/20 to-blue-600/20 border-purple-300/30"
                      : "bg-gradient-to-br from-slate-500/20 to-gray-600/20 border-slate-300/30"
                } backdrop-blur-lg shadow-2xl ${
                  isAccessible
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isCompleted
                            ? "bg-emerald-600"
                            : isCurrent
                              ? "bg-purple-600"
                              : "bg-slate-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        ) : isAccessible ? (
                          <Icon className="h-6 w-6 text-white" />
                        ) : (
                          <LockClosedIcon className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">
                          {step.title}
                        </CardTitle>
                        <div className="text-xs text-gray-400 font-medium">
                          Step {step.id} of {steps.length}
                        </div>
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircleIcon className="h-8 w-8 text-emerald-400" />
                    )}
                  </div>
                  <CardDescription className="text-gray-300 mt-2">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isCurrent && !isCompleted && step.component && (
                    <button
                      onClick={() => handleStartStep(step.id)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                    >
                      Start Step {step.id}
                    </button>
                  )}
                  {isCurrent && !isCompleted && !step.component && (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm mb-2">Coming Soon</p>
                      <button
                        onClick={() => {
                          // Simulate completion for steps without forms
                          if (!completedSteps.includes(step.id)) {
                            setCompletedSteps([...completedSteps, step.id]);
                          }
                          if (step.id < steps.length) {
                            setCurrentStep(step.id + 1);
                          }
                        }}
                        className="w-full bg-slate-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-slate-700 transition-all duration-200"
                      >
                        Skip for Now
                      </button>
                    </div>
                  )}
                  {isCompleted && step.component && (
                    <div className="space-y-2">
                      <div className="flex items-center text-emerald-400 text-sm font-medium">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Completed
                      </div>
                      <button
                        onClick={() => handleEditStep(step.id)}
                        className="w-full bg-slate-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-slate-700 transition-all duration-200 flex items-center justify-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    </div>
                  )}
                  {isCompleted && !step.component && (
                    <div className="flex items-center text-emerald-400 text-sm font-medium">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Completed
                    </div>
                  )}
                  {!isAccessible && (
                    <div className="flex items-center text-slate-400 text-sm font-medium">
                      <LockClosedIcon className="h-4 w-4 mr-2" />
                      Complete previous steps first
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completion Section */}
        {allStepsCompleted && (
          <Card className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-300/30 backdrop-blur-lg shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">
                Onboarding Complete! 🎉
              </CardTitle>
              <CardDescription className="text-emerald-200 text-lg">
                Congratulations! You've successfully set up your organization
                for compliance. You're now ready to access your dashboard and
                manage your arcade compliance requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <button
                onClick={handleFinishOnboarding}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 px-8 rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? "Setting up your dashboard..." : "Go to Dashboard"}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <div className="mt-12">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <h4 className="text-white font-medium mb-2">Documentation</h4>
                  <p className="text-gray-300 text-sm">
                    Access our comprehensive compliance guides and
                    documentation.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <h4 className="text-white font-medium mb-2">Support Chat</h4>
                  <p className="text-gray-300 text-sm">
                    Get instant help from our compliance experts.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📞</div>
                  <h4 className="text-white font-medium mb-2">Phone Support</h4>
                  <p className="text-gray-300 text-sm">
                    Call our dedicated support line for personalized assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
