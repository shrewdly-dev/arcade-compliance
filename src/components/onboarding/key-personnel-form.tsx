"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface KeyPersonnelFormProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface PersonnelMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  startDate: string;
  responsibilities: string;
}

export default function KeyPersonnelForm({
  onComplete,
  onBack,
}: KeyPersonnelFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [designatedSupervisor, setDesignatedSupervisor] = useState("");
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([
    {
      id: "1",
      name: "",
      position: "",
      email: "",
      phone: "",
      startDate: "",
      responsibilities: "",
    },
  ]);

  // Load existing key personnel data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch("/api/onboarding/key-personnel");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.organization) {
            setDesignatedSupervisor(
              result.organization.designatedSupervisor || ""
            );
            if (
              result.organization.keyPersonnel &&
              result.organization.keyPersonnel.length > 0
            ) {
              setPersonnel(result.organization.keyPersonnel);
            }
          }
        }
      } catch (error) {
        console.error("Error loading existing key personnel data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, []);

  const addPersonnelMember = () => {
    const newMember: PersonnelMember = {
      id: Date.now().toString(),
      name: "",
      position: "",
      email: "",
      phone: "",
      startDate: "",
      responsibilities: "",
    };
    setPersonnel([...personnel, newMember]);
  };

  const removePersonnelMember = (id: string) => {
    if (personnel.length > 1) {
      setPersonnel(personnel.filter((member) => member.id !== id));
    }
  };

  const updatePersonnelMember = (
    id: string,
    field: keyof PersonnelMember,
    value: string
  ) => {
    setPersonnel(
      personnel.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/onboarding/key-personnel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          designatedSupervisor,
          keyPersonnel: personnel.filter((member) => member.name.trim() !== ""),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save key personnel information");
      }
    } catch (error) {
      console.error("Error saving key personnel:", error);
      alert("An error occurred while saving key personnel information");
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
              <UserGroupIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Key Personnel</h1>
          <p className="text-purple-200 max-w-2xl mx-auto">
            Provide information about your management team and key staff members
            responsible for compliance and operations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Designated Supervisor */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                Designated Supervisor
              </CardTitle>
              <CardDescription className="text-gray-300">
                The person responsible for overall compliance oversight
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Designated Supervisor Name *
                </label>
                <input
                  type="text"
                  value={designatedSupervisor}
                  onChange={(e) => setDesignatedSupervisor(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter the designated supervisor's full name"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Key Personnel */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Key Personnel</CardTitle>
                  <CardDescription className="text-gray-300">
                    Add information about key staff members
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={addPersonnelMember}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Person</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {personnel.map((member, index) => (
                <div
                  key={member.id}
                  className="p-6 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-white">
                      Person {index + 1}
                    </h4>
                    {personnel.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePersonnelMember(member.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) =>
                          updatePersonnelMember(
                            member.id,
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Position/Title *
                      </label>
                      <input
                        type="text"
                        value={member.position}
                        onChange={(e) =>
                          updatePersonnelMember(
                            member.id,
                            "position",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Manager, Supervisor, Technician"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) =>
                          updatePersonnelMember(
                            member.id,
                            "email",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) =>
                          updatePersonnelMember(
                            member.id,
                            "phone",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={member.startDate}
                        onChange={(e) =>
                          updatePersonnelMember(
                            member.id,
                            "startDate",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Key Responsibilities
                      </label>
                      <textarea
                        value={member.responsibilities}
                        onChange={(e) =>
                          updatePersonnelMember(
                            member.id,
                            "responsibilities",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Describe their key responsibilities and duties"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
