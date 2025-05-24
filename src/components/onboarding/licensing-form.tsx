"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface LicensingFormProps {
  onComplete: (data: LicensingData) => void;
  onBack: () => void;
}

interface LicensingData {
  operatingLicense: {
    licenseNumber: string;
    issueDate: string;
    expiryDate: string;
    licensingAuthority: string;
    conditions: string[];
  };
  additionalPermits: {
    name: string;
    number: string;
    authority: string;
    expiryDate: string;
  }[];
  complianceHistory: {
    previousViolations: boolean;
    violationDetails: string;
    correctiveActions: string;
  };
}

export default function LicensingForm({
  onComplete,
  onBack,
}: LicensingFormProps) {
  const [formData, setFormData] = useState<LicensingData>({
    operatingLicense: {
      licenseNumber: "",
      issueDate: "",
      expiryDate: "",
      licensingAuthority: "Gambling Commission",
      conditions: [""],
    },
    additionalPermits: [],
    complianceHistory: {
      previousViolations: false,
      violationDetails: "",
      correctiveActions: "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load existing licensing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch("/api/onboarding/licensing");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.organization.licensingData) {
            const data = result.organization.licensingData;
            setFormData({
              operatingLicense: {
                licenseNumber: data.operatingLicense?.licenseNumber || "",
                issueDate: data.operatingLicense?.issueDate || "",
                expiryDate: data.operatingLicense?.expiryDate || "",
                licensingAuthority:
                  data.operatingLicense?.licensingAuthority ||
                  "Gambling Commission",
                conditions:
                  data.operatingLicense?.conditions &&
                  data.operatingLicense.conditions.length > 0
                    ? data.operatingLicense.conditions
                    : [""],
              },
              additionalPermits: data.additionalPermits || [],
              complianceHistory: {
                previousViolations:
                  data.complianceHistory?.previousViolations || false,
                violationDetails:
                  data.complianceHistory?.violationDetails || "",
                correctiveActions:
                  data.complianceHistory?.correctiveActions || "",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error loading existing licensing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.operatingLicense.licenseNumber.trim()) {
      newErrors.operatingLicenseNumber = "Operating license number is required";
    }

    if (
      formData.complianceHistory.previousViolations &&
      !formData.complianceHistory.violationDetails.trim()
    ) {
      newErrors.violationDetails =
        "Please provide details of previous violations";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/onboarding/licensing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save licensing information");
      }

      onComplete(formData);
    } catch (error) {
      console.error("Error saving licensing information:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      operatingLicense: {
        ...formData.operatingLicense,
        conditions: [...formData.operatingLicense.conditions, ""],
      },
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = formData.operatingLicense.conditions.filter(
      (_, i) => i !== index
    );
    setFormData({
      ...formData,
      operatingLicense: {
        ...formData.operatingLicense,
        conditions: newConditions.length > 0 ? newConditions : [""],
      },
    });
  };

  const updateCondition = (index: number, value: string) => {
    const newConditions = [...formData.operatingLicense.conditions];
    newConditions[index] = value;
    setFormData({
      ...formData,
      operatingLicense: {
        ...formData.operatingLicense,
        conditions: newConditions,
      },
    });
  };

  const addAdditionalPermit = () => {
    setFormData({
      ...formData,
      additionalPermits: [
        ...formData.additionalPermits,
        { name: "", number: "", authority: "", expiryDate: "" },
      ],
    });
  };

  const removeAdditionalPermit = (index: number) => {
    setFormData({
      ...formData,
      additionalPermits: formData.additionalPermits.filter(
        (_, i) => i !== index
      ),
    });
  };

  const updateAdditionalPermit = (
    index: number,
    field: string,
    value: string
  ) => {
    const newPermits = [...formData.additionalPermits];
    newPermits[index] = { ...newPermits[index], [field]: value };
    setFormData({
      ...formData,
      additionalPermits: newPermits,
    });
  };

  // Show loading state while fetching existing data
  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">
            Loading licensing information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <DocumentTextIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Operating License Information
          </h1>
          <p className="text-purple-200">
            Provide details about your organization's gambling operating license
          </p>
          <div className="mt-4 p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl">
            <p className="text-blue-200 text-sm flex items-center justify-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Premises licenses will be collected for each arcade location in
              the next step
            </p>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              {submitError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Operating License */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Operating License</CardTitle>
              <CardDescription className="text-gray-300">
                Your main gambling operating license from the Gambling
                Commission (covers all your arcade locations)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    value={formData.operatingLicense.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingLicense: {
                          ...formData.operatingLicense,
                          licenseNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 000-000000-R-000000-000"
                  />
                  {errors.operatingLicenseNumber && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.operatingLicenseNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Licensing Authority *
                  </label>
                  <select
                    value={formData.operatingLicense.licensingAuthority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingLicense: {
                          ...formData.operatingLicense,
                          licensingAuthority: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Gambling Commission">
                      Gambling Commission
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.operatingLicense.issueDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingLicense: {
                          ...formData.operatingLicense,
                          issueDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.operatingLicense.expiryDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingLicense: {
                          ...formData.operatingLicense,
                          expiryDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  License Conditions
                </label>
                <p className="text-sm text-gray-400 mb-3">
                  Add any specific conditions attached to your operating license
                </p>
                {formData.operatingLicense.conditions.map(
                  (condition, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => updateCondition(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="License condition"
                      />
                      {formData.operatingLicense.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="px-4 py-3 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )
                )}
                <button
                  type="button"
                  onClick={addCondition}
                  className="mt-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-600/30 transition-colors"
                >
                  + Add Condition
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Permits */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Additional Permits</CardTitle>
              <CardDescription className="text-gray-300">
                Any additional permits or licenses your organization holds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.additionalPermits.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No additional permits added yet
                </p>
              ) : (
                formData.additionalPermits.map((permit, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-800/30 rounded-xl border border-slate-600"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Permit Name
                        </label>
                        <input
                          type="text"
                          value={permit.name}
                          onChange={(e) =>
                            updateAdditionalPermit(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Alcohol License"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Permit Number
                        </label>
                        <input
                          type="text"
                          value={permit.number}
                          onChange={(e) =>
                            updateAdditionalPermit(
                              index,
                              "number",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Permit number"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Issuing Authority
                        </label>
                        <input
                          type="text"
                          value={permit.authority}
                          onChange={(e) =>
                            updateAdditionalPermit(
                              index,
                              "authority",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Local Council"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={permit.expiryDate}
                          onChange={(e) =>
                            updateAdditionalPermit(
                              index,
                              "expiryDate",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalPermit(index)}
                      className="mt-4 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      Remove Permit
                    </button>
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={addAdditionalPermit}
                className="w-full px-4 py-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-600/30 transition-colors"
              >
                + Add Additional Permit
              </button>
            </CardContent>
          </Card>

          {/* Compliance History */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Compliance History</CardTitle>
              <CardDescription className="text-gray-300">
                Information about any previous compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-4">
                  Have you had any previous regulatory violations or compliance
                  issues?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="previousViolations"
                      checked={!formData.complianceHistory.previousViolations}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          complianceHistory: {
                            ...formData.complianceHistory,
                            previousViolations: false,
                          },
                        })
                      }
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-white">No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="previousViolations"
                      checked={formData.complianceHistory.previousViolations}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          complianceHistory: {
                            ...formData.complianceHistory,
                            previousViolations: true,
                          },
                        })
                      }
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-white">Yes</span>
                  </label>
                </div>
              </div>

              {formData.complianceHistory.previousViolations && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Violation Details *
                    </label>
                    <textarea
                      value={formData.complianceHistory.violationDetails}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          complianceHistory: {
                            ...formData.complianceHistory,
                            violationDetails: e.target.value,
                          },
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Please describe the nature of the violations, dates, and regulatory bodies involved"
                    />
                    {errors.violationDetails && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {errors.violationDetails}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Corrective Actions Taken
                    </label>
                    <textarea
                      value={formData.complianceHistory.correctiveActions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          complianceHistory: {
                            ...formData.complianceHistory,
                            correctiveActions: e.target.value,
                          },
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the corrective actions taken to address the violations"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Complete Step 2
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
