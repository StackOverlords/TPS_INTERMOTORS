import { Button } from "@/components/atoms/button";
import { CommandSeparator } from "@/components/atoms/command";
import { Kbd } from "@/components/atoms/kbd";
import protectedRoutes from "@/navigation/Protected.Route";
import type RouteType from "@/navigation/RouteType";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Search, X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

interface RouteTypeWithParent extends RouteType {
  parentName?: string | null;
}

const processRoutes = (routes: RouteType[]) => {
  const flatRoutes: RouteTypeWithParent[] = [];

  routes.forEach((route) => {
    // Solo procesamos si no es header y está habilitado
    if (route.showInCommandPalette !== false) {
      const currentRoute: RouteTypeWithParent = {
        path: route.path,
        name: route.name,
        icon: route.icon,
        type: route.type,
        parentName: null,
        subRoutes: [],
      };

      // Procesar subrutas si existen
      if (route.subRoutes) {
        route.subRoutes.forEach((subRoute) => {
          if (subRoute.path && subRoute.showInCommandPalette !== false) {
            currentRoute.subRoutes?.push({
              path: subRoute.path,
              name: subRoute.name,
              icon: subRoute.icon,
              type: subRoute.type,
            });
          }
        });
      }

      flatRoutes.push(currentRoute);
    }
  });

  return flatRoutes;
};

const routes = processRoutes(protectedRoutes);

export default function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  const commandPalette = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-2 bg-background/40 backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <Command
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-popover p-2 border border-border shadow-2xl rounded-xl animate-in fade-in-0 zoom-in-95 overflow-hidden"
      >
        <div className="flex items-center px-2 border-b border-border">
          <Search className="size-4 text-muted-foreground" />
          <CommandInput
            autoFocus
            placeholder="Busca una ruta o escribe un comando..."
            className="w-full h-12 px-2 text-sm text-foreground bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
          <Kbd onClick={() => setOpen(false)} className="hidden sm:block">esc</Kbd>
          <Button
            className="sm:hidden size-6"
            variant={"outline"}
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <CommandList className="max-h-[350px] overflow-y-auto pt-2">
          <CommandEmpty className="py-6 min-h-40 flex items-center justify-center font-medium text-center text-base text-muted-foreground">
            No se encontraron resultados.
          </CommandEmpty>

          {routes.map((route, index) => (
            <React.Fragment key={`${index}-${route.name}`}>
              <CommandGroup
                heading={route.name}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:mb-2"
              >
                <div className="ml-4 border-l border-border">
                  {
                    route.path && (
                      <CommandItem
                        value={`${route.name} ${route.path}`}
                        onSelect={() => route.path && handleSelect(route.path)}
                        className="relative flex items-center gap-3 p-2 cursor-pointer rounded-lg mx-2 mb-1 data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground transition-colors"
                      >
                        {route.icon && (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 data-[selected='true']:bg-primary/10 transition-colors">
                            <route.icon className="h-5 w-5 text-muted-foreground data-[selected='true']:text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">{route.name}</span>
                          <span className="text-xs text-muted-foreground/70">
                            {route.path}
                          </span>
                        </div>
                        <div className="absolute right-3 hidden text-xs text-muted-foreground/50 data-[selected='true']:block">
                          ↵
                        </div>
                      </CommandItem>
                    )
                  }
                  {route.subRoutes?.map((subRoute, index) => {
                    const Icon = subRoute.icon;
                    return (
                      <CommandItem
                        key={`${subRoute.path}-${index}`}
                        value={`${subRoute.name} ${subRoute.path} ${route.name}`}
                        onSelect={() => subRoute.path && handleSelect(subRoute.path)}
                        className="relative flex items-center gap-3 p-2 cursor-pointer rounded-lg mx-2 mb-1 data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground transition-colors"
                      >
                        {Icon && (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 data-[selected='true']:bg-primary/10 transition-colors">
                            <Icon className="h-5 w-5 text-muted-foreground data-[selected='true']:text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">{subRoute.name}</span>
                          <span className="text-xs text-muted-foreground/70">
                            {subRoute.path}
                          </span>
                        </div>
                        <div className="absolute right-3 hidden text-xs text-muted-foreground/50 data-[selected='true']:block">
                          ↵
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
              {index < routes.length - 1 && <CommandSeparator className="my-2 ml-4 mr-2" />}
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </div>
  );

  return createPortal(commandPalette, document.body);
}