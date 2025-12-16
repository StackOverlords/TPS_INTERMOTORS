import { useState, useEffect, useMemo } from 'react';

interface ClienteData {
    id: number;
    nombre: string;
}

interface UseClienteVariosOptions {
    currentClientId?: number;
    clientes?: Array<{ id: number; nombre: string;[key: string]: any }>;
    // configuraciones?: { inputs: boolean }; // Para futura implementación
}

export const useClienteVarios = ({
    currentClientId,
    clientes
}: UseClienteVariosOptions) => {
    const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteData | null>(null);

    // Actualizar estado cuando cambia el cliente seleccionado
    useEffect(() => {
        if (currentClientId && clientes) {
            const cliente = clientes.find(c => c.id === currentClientId);
            if (cliente) {
                setClienteSeleccionado({
                    id: cliente.id,
                    nombre: cliente.nombre
                });
            }
        }
    }, [currentClientId, clientes]);

    // Verificar si es "clientes varios" (case insensitive)
    const isClienteVarios = useMemo(() => {
        if (!clienteSeleccionado) return false;

        const nombreNormalizado = clienteSeleccionado.nombre
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' '); // Normalizar espacios múltiples

        return nombreNormalizado === 'clientes varios' ||
            nombreNormalizado === 'cliente varios';
    }, [clienteSeleccionado]);

    // Determinar si los inputs deben estar habilitados
    const shouldEnableInputs = useMemo(() => {
        // Verificar que el ID del estado coincide con el del formulario
        const idsMatch = clienteSeleccionado?.id === currentClientId;

        // Si los IDs coinciden y es cliente varios, habilitar inputs
        if (idsMatch && isClienteVarios) {
            return true;
        }

        // TODO: Aquí se agregará la verificación de configuraciones
        // if (configuraciones?.inputs) {
        //   return true;
        // }

        return false;
    }, [clienteSeleccionado, currentClientId, isClienteVarios]);

    return {
        clienteSeleccionado,
        isClienteVarios,
        shouldEnableInputs
    };
};