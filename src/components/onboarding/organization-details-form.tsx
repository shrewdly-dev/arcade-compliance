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
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface OrganizationDetailsFormProps {
  onComplete: (data: OrganizationData) => void;
  onBack: () => void;
}

interface OrganizationData {
  businessName: string;
  tradingNames: string[];
  businessAddress: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  registrationDetails: {
    companyNumber?: string;
    vatNumber?: string;
    incorporationDate?: string;
    businessType: string;
  };
}

export default function OrganizationDetailsForm({
  onComplete,
  onBack,
}: OrganizationDetailsFormProps) {
  const [formData, setFormData] = useState<OrganizationData>({
    businessName: "",
    tradingNames: [""],
    businessAddress: {
      street: "",
      city: "",
      postcode: "",
      country: "United Kingdom",
    },
    contactInfo: {
      phone: "",
      email: "",
      website: "",
    },
    registrationDetails: {
      companyNumber: "",
      vatNumber: "",
      incorporationDate: "",
      businessType: "limited-company",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load existing organization data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch("/api/onboarding/organization");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.organization.onboardingData) {
            const data = result.organization.onboardingData;

            // Map the saved data back to form structure
            setFormData({
              businessName: data.businessName || "",
              tradingNames:
                data.tradingNames && data.tradingNames.length > 0
                  ? data.tradingNames
                  : [""],
              businessAddress: {
                street: data.streetAddress || "",
                city: data.city || "",
                postcode: data.postcode || "",
                country: data.country || "United Kingdom",
              },
              contactInfo: {
                phone: result.organization.phone || "",
                email: result.organization.email || "",
                website: data.website || "",
              },
              registrationDetails: {
                companyNumber: data.companyNumber || "",
                vatNumber: data.vatNumber || "",
                incorporationDate: data.incorporationDate || "",
                businessType: data.businessType || "limited-company",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error loading existing organization data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.businessAddress.street.trim()) {
      newErrors.street = "Street address is required";
    }

    if (!formData.businessAddress.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.businessAddress.postcode.trim()) {
      newErrors.postcode = "Postcode is required";
    }

    if (!formData.contactInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.contactInfo.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors.email = "Please enter a valid email address";
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
      const response = await fetch("/api/onboarding/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save organization details");
      }

      // Success - call onComplete with the form data
      onComplete(formData);
    } catch (error) {
      console.error("Error saving organization details:", error);
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTradingName = () => {
    setFormData({
      ...formData,
      tradingNames: [...formData.tradingNames, ""],
    });
  };

  const removeTradingName = (index: number) => {
    const newTradingNames = formData.tradingNames.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      tradingNames: newTradingNames.length > 0 ? newTradingNames : [""],
    });
  };

  const updateTradingName = (index: number, value: string) => {
    const newTradingNames = [...formData.tradingNames];
    newTradingNames[index] = value;
    setFormData({
      ...formData,
      tradingNames: newTradingNames,
    });
  };

  // Show loading state while fetching existing data
  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-purple-200">
            Loading organization details...
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
            <BuildingOfficeIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Organization Details
          </h1>
          <p className="text-purple-200">
            Tell us about your arcade business to get started with compliance
          </p>
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
          {/* Business Information */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Business Information</CardTitle>
              <CardDescription className="text-gray-300">
                Basic details about your arcade business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your business name"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.businessName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Trading Names
                </label>
                <p className="text-sm text-gray-400 mb-3">
                  Add any trading names or DBA names your business operates
                  under
                </p>
                {formData.tradingNames.map((name, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateTradingName(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Trading name"
                    />
                    {formData.tradingNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTradingName(index)}
                        className="px-4 py-3 bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-600/30 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTradingName}
                  className="mt-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-600/30 transition-colors"
                >
                  + Add Trading Name
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.registrationDetails.businessType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationDetails: {
                        ...formData.registrationDetails,
                        businessType: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="limited-company">Limited Company</option>
                  <option value="partnership">Partnership</option>
                  <option value="sole-trader">Sole Trader</option>
                  <option value="llp">Limited Liability Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Business Address */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Business Address</CardTitle>
              <CardDescription className="text-gray-300">
                Your registered business address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.businessAddress.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: {
                        ...formData.businessAddress,
                        street: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter street address"
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.street}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.businessAddress.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessAddress: {
                          ...formData.businessAddress,
                          city: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    value={formData.businessAddress.postcode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessAddress: {
                          ...formData.businessAddress,
                          postcode: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter postcode"
                  />
                  {errors.postcode && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.postcode}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Country *
                </label>
                <select
                  value={formData.businessAddress.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: {
                        ...formData.businessAddress,
                        country: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
              <CardDescription className="text-gray-300">
                How we can reach your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.contactInfo.website}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        website: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://www.example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Registration Details */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Registration Details</CardTitle>
              <CardDescription className="text-gray-300">
                Official registration information (if applicable)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Company Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.registrationDetails.companyNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDetails: {
                          ...formData.registrationDetails,
                          companyNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    VAT Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.registrationDetails.vatNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDetails: {
                          ...formData.registrationDetails,
                          vatNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., GB123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Incorporation Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.registrationDetails.incorporationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationDetails: {
                        ...formData.registrationDetails,
                        incorporationDate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
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
                  Complete Step 1
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
