const USER_GRADIENTS = [
  {
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    darkGradient: 'dark:from-blue-600 dark:to-cyan-500',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
    darkGradient: 'dark:from-purple-600 dark:to-pink-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
    darkGradient: 'dark:from-violet-600 dark:to-purple-700',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
    darkGradient: 'dark:from-pink-600 dark:to-rose-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-indigo-500 to-blue-500',
    darkGradient: 'dark:from-indigo-600 dark:to-blue-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-teal-500 to-emerald-500',
    darkGradient: 'dark:from-teal-600 dark:to-emerald-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
    darkGradient: 'dark:from-orange-600 dark:to-red-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
    darkGradient: 'dark:from-fuchsia-600 dark:to-pink-700',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    darkGradient: 'dark:from-cyan-600 dark:to-blue-700',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    darkGradient: 'dark:from-emerald-600 dark:to-teal-700',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
    darkGradient: 'dark:from-amber-600 dark:to-orange-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-rose-500 to-orange-500',
    darkGradient: 'dark:from-rose-600 dark:to-orange-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-sky-500 to-indigo-500',
    darkGradient: 'dark:from-sky-600 dark:to-indigo-600',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-lime-500 to-green-600',
    darkGradient: 'dark:from-lime-600 dark:to-green-700',
    text: 'text-white',
  },
  {
    gradient: 'bg-gradient-to-br from-violet-600 to-indigo-600',
    darkGradient: 'dark:from-violet-700 dark:to-indigo-700',
    text: 'text-white',
  },
];

/**
 * Genera un hash numérico a partir de un string
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Obtiene el gradiente de avatar para un usuario
 * - Si existe en localStorage, lo usa
 * - Si no existe, genera uno basado en el ID/nombre y lo guarda
 */
export const getUserAvatarGradient = (userId?: number | string, userName?: string) => {
  const identifier = userId?.toString() || userName || 'default';
  const storageKey = `user-avatar-gradient-${identifier}`;
  
  // Intentar obtener del localStorage
  const savedGradient = localStorage.getItem(storageKey);
  
  if (savedGradient) {
    const parsed = JSON.parse(savedGradient);
    return parsed;
  }
  
  // Si no existe, generar uno nuevo
  const hash = hashString(identifier);
  const gradientIndex = hash % USER_GRADIENTS.length;
  const gradient = USER_GRADIENTS[gradientIndex];
  
  // Guardar en localStorage
  localStorage.setItem(storageKey, JSON.stringify(gradient));
  
  return gradient;
};

/**
 * Limpia el gradiente guardado (útil para testing o reset)
 */
export const clearUserAvatarGradient = (userId?: number | string, userName?: string) => {
  const identifier = userId?.toString() || userName || 'default';
  const storageKey = `user-avatar-gradient-${identifier}`;
  localStorage.removeItem(storageKey);
};