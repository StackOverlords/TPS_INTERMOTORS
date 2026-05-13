import { Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";

import { getInitials } from "../utils/chatUtils";
import { getUserAvatarColor } from "../utils/avatarColors";

interface Props {
  userId?: number;
  name: string;
  isGroup?: boolean;

  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
}

export function ConversationAvatar({
  userId,
  name,
  isGroup = false,

  className,
  fallbackClassName,
  iconClassName,
}: Props) {
  const { vars } = getUserAvatarColor(userId);

  const avatarStyle = isGroup ? undefined : (vars as React.CSSProperties);

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      <AvatarFallback
        style={avatarStyle}
        className={cn(
          "font-semibold",
          !isGroup && "avatar-color",
          isGroup && "bg-primary/10 text-primary",
          fallbackClassName
        )}
      >
        {isGroup ? (
          <Users className={cn("h-5 w-5", iconClassName)} />
        ) : (
          getInitials(name)
        )}
      </AvatarFallback>
    </Avatar>
  );
}
