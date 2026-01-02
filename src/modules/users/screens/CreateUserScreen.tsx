import { useGoBack } from "@/hooks/useGoBack";
import { useHotkeys } from "react-hotkeys-hook";
import FormUser from "../components/FormUser";

const CreateUserScreen = () => {
  const handleGoBack = useGoBack("/dashboard/user");

  // Shortcut para volver atrás
  useHotkeys('escape', (e) => {
    e.preventDefault();
    handleGoBack();
  }, {
    scopes: ["esc-key"],
    enabled: true
  });

  return (
    <div className="flex justify-center items-center">
      <div className="w-full space-y-2">
        {/* Header */}
        <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                  Nuevo Usuario
                </h1>
                <p className="text-sm text-gray-500">
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
