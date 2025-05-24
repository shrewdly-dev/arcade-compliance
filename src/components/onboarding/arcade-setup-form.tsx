"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

interface ArcadeSetupFormProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function ArcadeSetupForm({
  onComplete,
  onBack,
}: ArcadeSetupFormProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    premisesLicenseNo: "",
    premisesLicenseIssueDate: "",
    premisesLicenseExpiryDate: "",
    localAuthority: "",
    premisesLicenseConditions: "",
    openingHours: "",
    contactPhone: "",
    contactEmail: "",
    // Machine counts
    category_b3_machines: 0,
    category_c_machines: 0,
    category_d_machines: 0,
    other_machines: 0,
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Get the user's organization first
      const orgResponse = await fetch("/api/onboarding/status");
      const orgData = await orgResponse.json();

      if (!orgData.organizations || orgData.organizations.length === 0) {
        throw new Error(
          "No organization found. Please complete organization setup first."
        );
      }

      const organizationId = orgData.organizations[0].id;

      // Prepare the data with correct field mapping
      const submitData = {
        ...formData,
        organizationId,
        premisesLicenseIssueDate:
          formData.premisesLicenseIssueDate || undefined,
        premisesLicenseExpiryDate:
          formData.premisesLicenseExpiryDate || undefined,
        premisesLicenseConditions: formData.premisesLicenseConditions
          ? [formData.premisesLicenseConditions]
          : [],
      };

      // Create the arcade
      const response = await fetch("/api/arcades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create arcade");
      }

      const result = await response.json();
      onComplete({
        arcade: result.arcade,
        step: "arcade-setup",
      });
    } catch (error) {
      console.error("Error creating arcade:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <BuildingStorefrontIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Arcade Setup</h1>
          <p className="text-purple-200 max-w-2xl mx-auto">
            Register your first arcade location. You can add more arcades later
            from your dashboard.
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Onboarding
        </button>

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Arcade Information
            </CardTitle>
            <CardDescription className="text-purple-200">
              Provide details about your arcade location, licensing, and contact
              information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    <BuildingStorefrontIcon className="h-4 w-4 inline mr-2" />
                    Arcade Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Downtown Gaming Arcade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    <PhoneIcon className="h-4 w-4 inline mr-2" />
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., +44 20 1234 5678"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Address Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 123 High Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., London"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., SW1A 1AA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="England">England</option>
                      <option value="Scotland">Scotland</option>
                      <option value="Wales">Wales</option>
                      <option value="Northern Ireland">Northern Ireland</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Licensing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Premises Licensing Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Premises License Number
                    </label>
                    <input
                      type="text"
                      name="premisesLicenseNo"
                      value={formData.premisesLicenseNo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., PREM/12345/2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Local Authority
                    </label>
                    <input
                      type="text"
                      name="localAuthority"
                      value={formData.localAuthority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Westminster City Council"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      License Issue Date
                    </label>
                    <input
                      type="date"
                      name="premisesLicenseIssueDate"
                      value={formData.premisesLicenseIssueDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      name="premisesLicenseExpiryDate"
                      value={formData.premisesLicenseExpiryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    License Conditions
                  </label>
                  <textarea
                    name="premisesLicenseConditions"
                    value={formData.premisesLicenseConditions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any specific conditions attached to your premises license..."
                  />
                </div>
              </div>

              {/* Operational Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Operational Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Opening Hours
                    </label>
                    <input
                      type="text"
                      name="openingHours"
                      value={formData.openingHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Mon-Sun 10:00-22:00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., arcade@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Machine Inventory */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <CpuChipIcon className="h-5 w-5 mr-2" />
                  Machine Inventory
                </h3>
                <p className="text-purple-200 text-sm">
                  Enter the total number of each type of gaming machine in this
                  arcade.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Category B3 Machines
                    </label>
                    <input
                      type="number"
                      name="category_b3_machines"
                      value={formData.category_b3_machines}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Fixed odds betting terminals
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Category C Machines
                    </label>
                    <input
                      type="number"
                      name="category_c_machines"
                      value={formData.category_c_machines}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      £1 stake, £100 prize
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Category D Machines
                    </label>
                    <input
                      type="number"
                      name="category_d_machines"
                      value={formData.category_d_machines}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      10p stake, £5 prize
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Other Machines
                    </label>
                    <input
                      type="number"
                      name="other_machines"
                      value={formData.other_machines}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Crane machines, etc.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Arcade...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Create Arcade
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
