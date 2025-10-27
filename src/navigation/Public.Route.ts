import LoginScreen from "@/modules/auth/screens/LoginScreen";
import { LogIn } from "lucide-react";
import type RouteType from "./RouteType";

export const publicRoutes: RouteType[] = [
  {
    path: "/",
    name: "Login",
    type: "public",
    element: LoginScreen,
    isAdmin: false,
    role: ['guest'],
    icon: LogIn
  },
]; 