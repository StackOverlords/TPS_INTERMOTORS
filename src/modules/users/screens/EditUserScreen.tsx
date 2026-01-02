import { Button } from "@/components/atoms/button";
import { Skeleton } from "@/components/atoms/skeleton";
import { useGoBack } from "@/hooks/useGoBack";
import { ArrowLeft } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router";
import FormUser from "../components/FormUser";
import { useUserByIdForEdit } from "../hooks/useUserByIdForEdit";

const EditUserScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleGoBack = useGoBack("/dashboard/user");

  const {
    data: user,
    isLoading,
    isError,
    error
  } = useUserByIdForEdit(Number(id));

  // Shortcut para volver atrás
  useHotkeys('escape', (e) => {
    e.preventDefault();
    handleGoBack();
  }, {
    scopes: ["esc-key"],
    enabled: true
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar usuario
          </h2>
          <p className="text-gray-500 mb-4">
            {error?.message || 'No se pudo encontrar el usuario solicitado'}
          </p>
          <Button onClick={() => navigate('/dashboard/user')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  // Mapear datos del usuario al formato del formulario
  // Los datos vienen en user.persona
  const persona = (user as any).persona || {};

  // Extraer fecha sin timestamp
  const fechaIngreso = (user as any).fecha_ingreso
    ? (user as any).fecha_ingreso.split(' ')[0]
    : '';

  const defaultValues = {
    nombre: persona.nombre || '',
    apellido_p: persona.apellido_paterno || '',
    apellido_m: persona.apellido_materno || '',
    sexo: (persona.sexo || 'M') as 'M' | 'F',
    dni: persona.dni || 0,
    dni_comp: persona.dni_comp || '',
    dni_tipo: (persona.dni_tipo || 'DNI') as 'DNI' | 'PASS' | 'DNIE',
    telefono: persona.telefono || '',
    celular: persona.celular || '',
    direccion: persona.direccion || '',
    fecha_ingreso: fechaIngreso,
    email: user.email || '',
    nombre_usuario: user.nickname || '',
  };

  console.log('📝 Usuario cargado para edición:', user);
  console.log('📝 Persona:', persona);
  console.log('📝 Valores por defecto mapeados:', defaultValues);

  return (
    <div className="flex justify-center items-center">
      <div className="w-full space-y-2">
        {/* Header */}
        <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                  Editar Usuario: {user.nickname}
                </h1>
                <p className="text-sm text-gray-500">
                  {persona.nombre || 'Sin nombre'} - Modifica la información del usuario
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Formulario */}
        <FormUser
          mode="edit"
          userId={user.id}
          defaultValues={defaultValues}
        />
      </div>
    </div>
  );
};

export default EditUserScreen;
