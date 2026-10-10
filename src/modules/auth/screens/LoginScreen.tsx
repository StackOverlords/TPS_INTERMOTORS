import type React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/atoms/alert";
import { useLogin } from "../hooks/useLogin";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "../schemas/login.schema";
import type { Login } from "../types/login.types";
import { useForm } from "react-hook-form";
import { useBranchStore } from "@/states/branchStore";
import logoLight from "@/assets/images/logo_light.webp";
import logoDark from "@/assets/images/darkmodeweb.webp";
import { useThemeStore } from "@/stores/themeStore";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { LoginUpdateNotice } from "@/modules/updates/components/LoginUpdateNotice";
import { VersionNotesDialog } from "@/modules/updates/components/VersionNotesDialog";
import { displayVersion } from "@/modules/updates/utils/version";

const LoginScreen = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => {
  const [showPassword, setShowPassword] = useState(false);
  const { selectedBranchId } = useBranchStore();
  const { resolvedTheme } = useThemeStore();

  const { mutate: signIn, isPending, isError } = useLogin();
  const update = useUpdateChecker({ loadCurrentNotes: false });
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);
  // Mientras se actualiza no se inicia sesión: la app se reinicia al terminar.
  const isUpdating = update.isDownloading || update.isInstalling;
  const showUpdateNotice = update.supportsSelfUpdate && update.available;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      usuario: "",
      clave: "",
    },
    // mode: "onChange"
  });

  const onSubmit = async (data: Login) => {
    clearErrors("root");
    signIn(data, {
      onSuccess: () => {
        // console.log('Login exitoso');
      },
      onError: (error: { message?: string }) => {
        setError("root", {
          type: "server",
          message:
            error?.message ||
            "Error al iniciar sesión. Verifica tus credenciales.",
        });
        // console.error("Error al iniciar sesión, verifica tus credenciales:", error?.message);
      },
    });
  };

  return (
    <main className="flex h-full flex-col items-center justify-center gap-6 bg-muted p-3 md:p-10 w-full">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="flex items-center justify-center self-center">
          <img
            src={resolvedTheme === "dark" ? logoDark : logoLight}
            alt="Intermotors Logo"
            className="h-16 w-auto object-contain"
          />
        </header>

        <div className={cn("flex flex-col gap-4", className)} {...props}>
          <Card className="p-4">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-semibold text-foreground">
                {selectedBranchId ? "Bienvenido de nuevo" : "Iniciar Sesión"}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 text-xs sm:text-sm">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error general del servidor */}
              {(errors.root || isError) && (
                <Alert className="border-red-200 bg-red-50 p-2">
                  <AlertDescription className="text-red-700 flex items-center gap-2 text-xs">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    {errors.root?.message ||
                      "Error al iniciar sesión. Verifica tus credenciales."}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Usuario
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      id="usuario"
                      type="text"
                      placeholder="Ingresa tu usuario"
                      autoComplete="username"
                      className={`pl-10 h-10 ${errors.usuario ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      disabled={isPending || isSubmitting || isUpdating}
                      {...register("usuario")}
                      autoFocus
                    />
                  </div>
                  {errors.usuario && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.usuario.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clave"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      data-form-type="password"
                      className={`pl-10 h-10 ${errors.clave ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      disabled={isPending || isSubmitting || isUpdating}
                      {...register("clave")}
                    />
                    {2 < 1 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isPending || isSubmitting || isUpdating}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {errors.clave && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.clave.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-8"
                  disabled={isPending || isSubmitting || isUpdating}
                >
                  {isPending || isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando sesión...
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>

              {/* <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  ¿Olvidaste tu contraseña?{" "}
                  <a
                    href="#"
                    className="text-xs underline-offset-4 hover:underline text-foreground font-medium"
                  >
                    Recuperar acceso
                  </a>
                </p>
              </div> */}
            </CardContent>
          </Card>
          {showUpdateNotice && (
            <LoginUpdateNotice
              version={update.latestVersion}
              currentVersion={update.currentVersion}
              isDownloading={update.isDownloading}
              isInstalling={update.isInstalling}
              progress={update.downloadProgress}
              error={update.error}
              onUpdate={update.downloadAndInstall}
              onShowNotes={() => setShowUpdateNotes(true)}
            />
          )}
          {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
            Al hacer clic en continuar, aceptas nuestros{" "}
            <a href="#">Términos de servicio</a> y{" "}
            <a href="#">Política de privacidad</a>.
          </div> */}
        </div>
      </div>
      <VersionNotesDialog
        open={showUpdateNotes}
        onClose={() => setShowUpdateNotes(false)}
        title={`Novedades de la versión ${displayVersion(update.latestVersion)}`}
        description={`Tienes la ${displayVersion(update.currentVersion)}. Actualizar es opcional.`}
        notes={update.releaseNotes || "Esta versión no tiene notas publicadas."}
        secondary={{ label: "Más tarde", onClick: () => setShowUpdateNotes(false) }}
        primary={{
          label: "Actualizar ahora",
          onClick: () => {
            setShowUpdateNotes(false);
            void update.downloadAndInstall();
          },
        }}
      />
    </main>
  );
};

export default LoginScreen;
