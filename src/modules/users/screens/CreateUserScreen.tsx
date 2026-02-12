import { useGoBack } from "@/hooks/useGoBack";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePermissionCheck } from "@/hooks/usePermissionCheck";
import FormUser from "../components/FormUser";

const CreateUserScreen = () => {
  const handleGoBack = useGoBack("/dashboard/user");
  const navigate = useNavigate();

  // Validar permisos para crear usuarios
  const { isAuthorized, isLoading } = usePermissionCheck({
    permission: "usu-create",
    roles: ["Super Admin"],
  });

  // Redirigir si no está autorizado
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      navigate("/dashboard/user");
    }
  }, [isAuthorized, isLoading, navigate]);

  // Shortcut para volver atrás
  useHotkeys(
    "escape",
    (e) => {
      e.preventDefault();
      handleGoBack();
    },
    {
      scopes: ["esc-key"],
      enabled: true,
    }
  );

  // Mostrar loader mientras verifica permisos
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autorizado, no renderizar nada (se redirigirá)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex justify-center items-center p-2">
      <div className="w-full space-y-2">
        {/* Header */}
        <header className="border-border border bg-background rounded-lg p-2 sm:p-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight">
                  Nuevo Usuario
                </h1>
                <p className="text-sm text-muted-foreground">
                  Registra un nuevo usuario en el sistema
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Formulario */}
        <FormUser mode="create" />
      </div>
    </div>
  );
};

export default CreateUserScreen;
