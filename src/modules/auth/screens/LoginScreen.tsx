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
import logoImage from "@/assets/images/logo_light.webp";

const LoginScreen = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => {

  const [showPassword, setShowPassword] = useState(false)
  const { selectedBranchId } = useBranchStore()

  const {
    mutate: signIn,
    isPending,
    isError
  } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
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
          message: error?.message || "Error al iniciar sesión. Verifica tus credenciales."
        });
        // console.error("Error al iniciar sesión, verifica tus credenciales:", error?.message);
      }
    });

  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-3 md:p-10 w-full">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="flex items-center justify-center self-center">
          <img
            src={logoImage}
            alt="Intermotors Logo"
            className="h-16 w-auto object-contain"
          />
        </header>

        <div className={cn("flex flex-col", className)} {...props}>

          <Card className="p-4">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900">
                {selectedBranchId ? "Bienvenido de nuevo" : "Iniciar Sesión"}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-xs sm:text-sm">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error general del servidor */}
              {(errors.root || isError) && (
                <Alert className="border-red-200 bg-red-50 p-2">
                  <AlertDescription className="text-red-700 flex items-center gap-2 text-xs">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    {errors.root?.message || "Error al iniciar sesión. Verifica tus credenciales."}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Usuario
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      required
                      id="usuario"
                      type="text"
                      placeholder="Ingresa tu usuario"
                      autoComplete="username"
                      className={`pl-10 h-10 ${errors.usuario ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      disabled={isPending || isSubmitting}
                      {...register("usuario")}
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
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="clave"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      data-form-type="password"
                      className={`pl-10 h-10 ${errors.clave ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      disabled={isPending || isSubmitting}
                      {...register("clave")}
                    />
                    {
                      2 < 1 && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={isPending || isSubmitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )
                    }
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
                  className="w-full h-10"
                  disabled={isPending || isSubmitting}
                >
                  {(isPending || isSubmitting) ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando sesión...
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>

              {/* <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  ¿Olvidaste tu contraseña?{" "}
                  <a
                    href="#"
                    className="text-xs underline-offset-4 hover:underline text-black font-medium"
                  >
                    Recuperar acceso
                  </a>
                </p>
              </div> */}
            </CardContent>
          </Card>
          {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
            Al hacer clic en continuar, aceptas nuestros{" "}
            <a href="#">Términos de servicio</a> y{" "}
            <a href="#">Política de privacidad</a>.
          </div> */}
        </div>
      </div>
    </main>
  );
};

export default LoginScreen;