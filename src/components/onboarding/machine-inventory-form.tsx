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
  CpuChipIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface MachineInventoryFormProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface Machine {
  id: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  category: "B3" | "C" | "D";
  location: string;
  installDate: string;
}

export default function MachineInventoryForm({
  onComplete,
  onBack,
}: MachineInventoryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [arcadeId, setArcadeId] = useState("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [complianceCheck, setComplianceCheck] = useState<any>(null);

  // Initialize with one empty machine
  useEffect(() => {
    if (machines.length === 0) {
      addMachine();
    }
    fetchUserArcade();
  }, []);

  const fetchUserArcade = async () => {
    try {
      const response = await fetch("/api/arcades");
      if (response.ok) {
        const data = await response.json();
        if (data.arcades && data.arcades.length > 0) {
          setArcadeId(data.arcades[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching arcade:", error);
    }
  };

  const addMachine = () => {
    const newMachine: Machine = {
      id: `temp-${Date.now()}`,
      serialNumber: "",
      manufacturer: "",
      model: "",
      category: "C",
      location: "",
      installDate: "",
    };
    setMachines([...machines, newMachine]);
  };

  const removeMachine = (id: string) => {
    setMachines(machines.filter((machine) => machine.id !== id));
  };

  const updateMachine = (id: string, field: keyof Machine, value: string) => {
    setMachines(
      machines.map((machine) =>
        machine.id === id ? { ...machine, [field]: value } : machine
      )
    );
  };

  const checkCompliance = () => {
    const total = machines.filter((m) => m.serialNumber.trim()).length;
    const b3Count = machines.filter(
      (m) => m.category === "B3" && m.serialNumber.trim()
    ).length;
    const cCount = machines.filter(
      (m) => m.category === "C" && m.serialNumber.trim()
    ).length;
    const dCount = machines.filter(
      (m) => m.category === "D" && m.serialNumber.trim()
    ).length;

    const b3Percentage = total > 0 ? (b3Count / total) * 100 : 0;
    const maxB3Allowed = Math.floor(total * 0.2);

    const issues: string[] = [];
    const warnings: string[] = [];

    if (b3Count > maxB3Allowed) {
      issues.push(
        `B3 machine limit exceeded: ${b3Count} B3 machines (${b3Percentage.toFixed(1)}%) exceeds the maximum allowed of ${maxB3Allowed} (20% of ${total} total machines)`
      );
    }

    if (b3Count === maxB3Allowed && total > 0) {
      warnings.push(
        `B3 machine limit reached: ${b3Count} B3 machines (${b3Percentage.toFixed(1)}%) is at the maximum allowed limit`
      );
    } else if (b3Count >= maxB3Allowed * 0.8 && total > 0) {
      warnings.push(
        `Approaching B3 machine limit: ${b3Count} B3 machines (${b3Percentage.toFixed(1)}%) is close to the maximum allowed of ${maxB3Allowed}`
      );
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
        b3Percentage: Math.round(b3Percentage * 10) / 10,
        maxB3Allowed,
      },
    };
  };

  useEffect(() => {
    setComplianceCheck(checkCompliance());
  }, [machines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!arcadeId) {
        throw new Error("No arcade found. Please complete arcade setup first.");
      }

      const validMachines = machines.filter((m) => m.serialNumber.trim());

      if (validMachines.length === 0) {
        throw new Error(
          "Please add at least one machine with a serial number."
        );
      }

      const compliance = checkCompliance();
      if (!compliance.isCompliant) {
        throw new Error(
          `Compliance issues detected: ${compliance.issues.join(", ")}`
        );
      }

      // Add all machines to the arcade
      const results = [];
      for (const machine of validMachines) {
        const response = await fetch(`/api/arcades/${arcadeId}/machines`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serialNumber: machine.serialNumber,
            manufacturer: machine.manufacturer || undefined,
            model: machine.model || undefined,
            category: machine.category,
            location: machine.location || undefined,
            installDate: machine.installDate || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add machine");
        }

        const result = await response.json();
        results.push(result);
      }

      onComplete({
        machines: results,
        compliance: compliance,
        step: "machine-inventory",
      });
    } catch (error) {
      console.error("Error adding machines:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete({
      machines: [],
      skipped: true,
      step: "machine-inventory",
    });
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <CpuChipIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Machine Inventory
          </h1>
          <p className="text-purple-200 max-w-3xl mx-auto">
            Register your gaming machines. This helps ensure compliance with B3
            machine limits (max 20% of total machines).
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

        {/* Compliance Status */}
        {complianceCheck && (
          <Card className="mb-6 bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {complianceCheck.machineBreakdown.total}
                  </div>
                  <div className="text-sm text-gray-300">Total Machines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {complianceCheck.machineBreakdown.b3Count}
                  </div>
                  <div className="text-sm text-gray-300">B3 Machines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {complianceCheck.machineBreakdown.b3Percentage}%
                  </div>
                  <div className="text-sm text-gray-300">B3 Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {complianceCheck.machineBreakdown.maxB3Allowed}
                  </div>
                  <div className="text-sm text-gray-300">Max B3 Allowed</div>
                </div>
              </div>

              {complianceCheck.issues.length > 0 && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-200 font-medium">
                      Compliance Issues
                    </span>
                  </div>
                  {complianceCheck.issues.map(
                    (issue: string, index: number) => (
                      <p key={index} className="text-red-200 text-sm">
                        • {issue}
                      </p>
                    )
                  )}
                </div>
              )}

              {complianceCheck.warnings.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-200 font-medium">
                      Warnings
                    </span>
                  </div>
                  {complianceCheck.warnings.map(
                    (warning: string, index: number) => (
                      <p key={index} className="text-yellow-200 text-sm">
                        • {warning}
                      </p>
                    )
                  )}
                </div>
              )}

              {complianceCheck.isCompliant &&
                complianceCheck.machineBreakdown.total > 0 && (
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-green-200 font-medium">
                        Compliant
                      </span>
                    </div>
                    <p className="text-green-200 text-sm mt-1">
                      Your machine inventory meets all compliance requirements.
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Gaming Machines
            </CardTitle>
            <CardDescription className="text-purple-200">
              Add your gaming machines. You can skip this step and add machines
              later from your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {machines.map((machine, index) => (
                <div
                  key={machine.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      Machine {index + 1}
                    </h3>
                    {machines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMachine(machine.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Serial Number *
                      </label>
                      <input
                        type="text"
                        value={machine.serialNumber}
                        onChange={(e) =>
                          updateMachine(
                            machine.id,
                            "serialNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., SN123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Category *
                      </label>
                      <select
                        value={machine.category}
                        onChange={(e) =>
                          updateMachine(machine.id, "category", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="B3">
                          B3 (Fixed Odds Betting Terminal)
                        </option>
                        <option value="C">C (Slot Machine)</option>
                        <option value="D">D (Non-complex Lottery)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={machine.manufacturer}
                        onChange={(e) =>
                          updateMachine(
                            machine.id,
                            "manufacturer",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., IGT, Aristocrat"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={machine.model}
                        onChange={(e) =>
                          updateMachine(machine.id, "model", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Game King"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={machine.location}
                        onChange={(e) =>
                          updateMachine(machine.id, "location", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Front Row, Position 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Install Date
                      </label>
                      <input
                        type="date"
                        value={machine.installDate}
                        onChange={(e) =>
                          updateMachine(
                            machine.id,
                            "installDate",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Machine Button */}
              <button
                type="button"
                onClick={addMachine}
                className="w-full py-3 border-2 border-dashed border-purple-400 rounded-lg text-purple-300 hover:text-white hover:border-purple-300 transition-colors flex items-center justify-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Another Machine
              </button>

              {/* Submit Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="bg-slate-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-slate-700 transition-all duration-200"
                >
                  Skip for Now
                </button>

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (complianceCheck && !complianceCheck.isCompliant)
                  }
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding Machines...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Add Machines
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
