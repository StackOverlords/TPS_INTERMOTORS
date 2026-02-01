// components/BranchSelection.tsx
import type { AuthUser } from "sdk-simple-auth";
import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import authSDK from "@/services/sdk-simple-auth";
import { Button } from "@/components/atoms/button";

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
      <div className="h-full bg-muted flex items-center justify-center p-4 w-full">
        <div className="bg-background rounded-xl p-6 border border-border">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-muted flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-xl">
        <div className="bg-card rounded-xl p-10 border border-border">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Building2 className="size-5 text-primary" />
              Bienvenido, {user.name}
            </h2>
            <p className="text-muted-foreground text-sm">
              Por favor selecciona una sucursal para continuar:
            </p>
          </div>

          <div className="space-y-3">
            {branchs &&
              branchs.map((branch: any) => (
                <Button
                  key={branch.id}
                  onClick={() => handleSelect(branch.id)}
                  variant={"outline"}
                  className="w-full p-6 justify-start text-left rounded-xl h-auto focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-700 focus:ring-offset-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-700 rounded-full"></div>
                    <span className="font-medium">{branch.sucursal}</span>
                  </div>
                </Button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchSelection;
