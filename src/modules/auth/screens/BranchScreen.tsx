// components/BranchSelection.tsx
import type { AuthUser } from "sdk-simple-auth";
import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import authSDK from "@/services/sdk-simple-auth";

interface BranchSelectionProps {
  user: AuthUser;
  onSelect: (branchId: string) => void;
}

const BranchSelection: React.FC<BranchSelectionProps> = ({
  user,
  onSelect,
}) => {
  const [branchs, setBranch] = useState<any>();
  const [loading, setLoading] = useState(true);
  const getBranchs = async () => {
    try {
      const br = await authSDK.getCurrentUser();
      if (!br?.sucursales?.length) {
        onSelect("1");
        return;
      }
      setBranch(br?.sucursales);
    } catch (error) {
      console.error("Error al obtener sucursales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBranchs();
  }, []);

  const handleSelect = (branchId: string) => {
    onSelect(branchId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 w-full">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-zinc-900" />
              Bienvenido, {user.name}
            </h2>
            <p className="text-gray-600 text-sm">
              Por favor selecciona una sucursal para continuar:
            </p>
          </div>
          
          <div className="space-y-3">
            {branchs &&
              branchs.map((branch: any) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch.id)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-900 font-medium">
                      {branch.sucursal}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchSelection;