import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/reactQueryConfig";
import type { Login } from "../types/login.types";
import { authService } from "../services/authService";

export const useLogin = () => {
    return useMutation({
        mutationFn: (credentials: Login) => authService.login(credentials),
        onSuccess: () => {
            queryClient.clear();
        },
    });
};