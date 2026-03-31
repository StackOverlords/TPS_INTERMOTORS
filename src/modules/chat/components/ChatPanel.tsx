// import { ScrollArea } from "@/components/atoms/scroll-area";
// import { cn } from "@/lib/utils";
// import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
// import { getUserAvatarGradient } from "@/utils/userColors";
// import { formatCurrency } from "@/utils/formaters";
// import authSDK from "@/services/sdk-simple-auth";
// import { useBranchStore } from "@/states/branchStore";
// import {
//   MessageSquare,
//   Package,
//   Send,
//   ShoppingCart,
//   X,
//   CheckCheck,
// } from "lucide-react";
// import { useEffect, useRef, useState } from "react";
// import {
//   MOCK_CONVERSATIONS,
//   MOCK_MESSAGES,
//   type MockConversation,
//   type MockMessage,
//   type ProductListPayload,
// } from "../mock/chat.mock";
// import { useChatUiStore } from "../store/chatUiStore";

// // ─── Avatar ───────────────────────────────────────────────────────────────────

// const Avatar = ({
//   name,
//   id,
//   size = "md",
//   online,
// }: {
//   name: string;
//   id: string;
//   size?: "sm" | "md";
//   online?: boolean;
// }) => {
//   const gradient = getUserAvatarGradient(id, name);
//   const sizeClass = size === "sm" ? "size-7" : "size-9";
//   const textClass = size === "sm" ? "text-xs" : "text-sm";

//   return (
//     <div className="relative flex-shrink-0">
//       <div
//         className={cn(
//           sizeClass,
//           gradient.gradient,
//           gradient.darkGradient,
//           "rounded-full flex items-center justify-center"
//         )}
//       >
//         <span className={cn(gradient.text, textClass, "font-semibold")}>
//           {name.charAt(0).toUpperCase()}
//         </span>
//       </div>
//       {online !== undefined && (
//         <span
//           className={cn(
//             "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background",
//             online ? "bg-green-500" : "bg-muted-foreground"
//           )}
//         />
//       )}
//     </div>
//   );
// };

// // ─── Product List Card ────────────────────────────────────────────────────────

// const ProductListCard = ({
//   payload,
//   from,
//   onImport,
// }: {
//   payload: ProductListPayload;
//   from: "me" | "them";
//   onImport: () => void;
// }) => {
//   const [imported, setImported] = useState(false);

//   const handleImport = () => {
//     onImport();
//     setImported(true);
//   };

//   return (
//     <div
//       className={cn(
//         "rounded-2xl border overflow-hidden w-[260px]",
//         from === "me"
//           ? "border-primary/20 bg-primary/5 rounded-br-sm"
//           : "border-border bg-card rounded-bl-sm"
//       )}
//     >
//       {/* Header */}
//       <div
//         className={cn(
//           "flex items-center gap-2 px-3 py-2 border-b",
//           from === "me" ? "border-primary/10 bg-primary/10" : "border-border bg-muted/50"
//         )}
//       >
//         <Package className="size-3.5 text-muted-foreground flex-shrink-0" />
//         <span className="text-xs font-semibold">Lista de pedido</span>
//       </div>

//       {/* Items */}
//       <div className="px-3 py-2 flex flex-col gap-1.5">
//         {payload.items.map((item) => (
//           <div key={item.id} className="flex items-start justify-between gap-2">
//             <div className="flex-1 min-w-0">
//               <p className="text-xs font-medium leading-tight truncate">{item.name}</p>
//               {item.brand && (
//                 <p className="text-[10px] text-muted-foreground">{item.brand}</p>
//               )}
//             </div>
//             <div className="text-right flex-shrink-0">
//               <p className="text-xs font-medium">{formatCurrency(item.subtotal)}</p>
//               <p className="text-[10px] text-muted-foreground">×{item.quantity}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Footer */}
//       <div
//         className={cn(
//           "px-3 py-2 border-t flex items-center justify-between gap-2",
//           from === "me" ? "border-primary/10" : "border-border"
//         )}
//       >
//         <div>
//           <p className="text-[10px] text-muted-foreground">Total</p>
//           <p className="text-xs font-bold">{formatCurrency(payload.total)}</p>
//         </div>

//         {from === "them" && (
//           <button
//             onClick={handleImport}
//             disabled={imported}
//             className={cn(
//               "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
//               imported
//                 ? "bg-green-500/10 text-green-600 cursor-default"
//                 : "bg-primary text-primary-foreground hover:bg-primary/90"
//             )}
//           >
//             {imported ? (
//               <>
//                 <CheckCheck className="size-3" />
//                 Importado
//               </>
//             ) : (
//               <>
//                 <ShoppingCart className="size-3" />
//                 Importar
//               </>
//             )}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// // ─── Message Bubble ───────────────────────────────────────────────────────────

// const MessageBubble = ({
//   message,
//   onImportCart,
// }: {
//   message: MockMessage;
//   onImportCart: (payload: ProductListPayload) => void;
// }) => {
//   const isMe = message.from === "me";

//   return (
//     <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
//       {message.type === "product-list" ? (
//         <ProductListCard
//           payload={message.payload}
//           from={message.from}
//           onImport={() => onImportCart(message.payload)}
//         />
//       ) : (
//         <div
//           className={cn(
//             "max-w-[75%] px-3 py-2 rounded-2xl text-xs",
//             isMe
//               ? "bg-primary text-primary-foreground rounded-br-sm"
//               : "bg-muted text-foreground rounded-bl-sm"
//           )}
//         >
//           <p>{message.text}</p>
//           <p
//             className={cn(
//               "text-[10px] mt-1 text-right",
//               isMe ? "text-primary-foreground/70" : "text-muted-foreground"
//             )}
//           >
//             {message.time}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// // ─── Conversation Item ────────────────────────────────────────────────────────

// const ConversationItem = ({
//   conversation,
//   isActive,
//   onClick,
// }: {
//   conversation: MockConversation;
//   isActive: boolean;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className={cn(
//       "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
//       "hover:bg-accent rounded-md",
//       isActive && "bg-accent"
//     )}
//   >
//     <Avatar name={conversation.name} id={conversation.id} online={conversation.online} />
//     <div className="flex-1 min-w-0">
//       <div className="flex items-center justify-between gap-1">
//         <span className="text-xs font-medium truncate">{conversation.name}</span>
//         <span className="text-[10px] text-muted-foreground flex-shrink-0">
//           {conversation.lastTime}
//         </span>
//       </div>
//       <div className="flex items-center justify-between gap-1 mt-0.5">
//         <span className="text-[11px] text-muted-foreground truncate">
//           {conversation.lastMessage}
//         </span>
//         {conversation.unread > 0 && (
//           <span className="flex-shrink-0 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
//             {conversation.unread}
//           </span>
//         )}
//       </div>
//     </div>
//   </button>
// );

// // ─── Chat View ────────────────────────────────────────────────────────────────

// const ChatView = ({ conversation }: { conversation: MockConversation }) => {
//   const user = authSDK.getCurrentUser();
//   const { selectedBranchId } = useBranchStore();
//   const cart = useCartWithUtils(user?.name || "", selectedBranchId ?? "");

//   const [messages, setMessages] = useState<MockMessage[]>(
//     () => MOCK_MESSAGES[conversation.id] ?? []
//   );
//   const [input, setInput] = useState("");
//   const bottomRef = useRef<HTMLDivElement>(null);

//   // Resetear mensajes al cambiar de conversación
//   useEffect(() => {
//     setMessages(MOCK_MESSAGES[conversation.id] ?? []);
//     setInput("");
//   }, [conversation.id]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSend = () => {
//     if (!input.trim()) return;
//     const newMsg: MockMessage = {
//       id: Date.now().toString(),
//       from: "me",
//       time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
//       type: "text",
//       text: input.trim(),
//     };
//     setMessages((prev) => [...prev, newMsg]);
//     setInput("");
//   };

//   const handleShareCart = () => {
//     if (cart.items.length === 0) return;

//     const payload: ProductListPayload = {
//       items: cart.items.map((item) => ({
//         id: item.product.id,
//         name: item.customDescription || item.product.descripcion,
//         brand: item.customBrand || item.product.marca?.nombre || null,
//         quantity: item.quantity,
//         price: item.customPrice,
//         subtotal: item.customSubtotal,
//       })),
//       total: cart.items.reduce((acc, item) => acc + item.customSubtotal, 0),
//     };

//     const newMsg: MockMessage = {
//       id: Date.now().toString(),
//       from: "me",
//       time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
//       type: "product-list",
//       payload,
//     };
//     setMessages((prev) => [...prev, newMsg]);
//   };

//   const handleImportCart = (_payload: ProductListPayload) => {
//     // TODO: cuando el backend esté listo, importar cada item al carrito real
//     // por ahora es solo visual (el botón cambia a "Importado")
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* Header */}
//       <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border flex-shrink-0">
//         <Avatar name={conversation.name} id={conversation.id} online={conversation.online} />
//         <div>
//           <p className="text-sm font-medium leading-none">{conversation.name}</p>
//           <p className="text-[11px] text-muted-foreground mt-0.5">
//             {conversation.role} · {conversation.online ? "En línea" : "Desconectado"}
//           </p>
//         </div>
//       </div>

//       {/* Messages */}
//       <ScrollArea className="flex-1 px-4 py-3">
//         <div className="flex flex-col gap-2">
//           {messages.map((msg) => (
//             <MessageBubble
//               key={msg.id}
//               message={msg}
//               onImportCart={handleImportCart}
//             />
//           ))}
//           <div ref={bottomRef} />
//         </div>
//       </ScrollArea>

//       {/* Input */}
//       <div className="px-3 py-3 border-t border-border flex-shrink-0">
//         <div className="flex items-end gap-2 bg-muted rounded-xl px-3 py-2">
//           {/* Compartir carrito */}
//           <button
//             onClick={handleShareCart}
//             disabled={cart.items.length === 0}
//             title={
//               cart.items.length === 0
//                 ? "El carrito está vacío"
//                 : `Compartir carrito (${cart.items.length} items)`
//             }
//             className={cn(
//               "flex-shrink-0 size-7 rounded-lg flex items-center justify-center transition-colors relative",
//               cart.items.length > 0
//                 ? "text-muted-foreground hover:bg-background hover:text-foreground"
//                 : "text-muted-foreground/40 cursor-not-allowed"
//             )}
//           >
//             <Package className="size-3.5" />
//             {cart.items.length > 0 && (
//               <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
//                 {cart.items.length}
//               </span>
//             )}
//           </button>

//           <textarea
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter" && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSend();
//               }
//             }}
//             placeholder="Escribí un mensaje..."
//             rows={1}
//             className="flex-1 bg-transparent text-xs resize-none outline-none placeholder:text-muted-foreground min-h-[20px] max-h-[80px]"
//           />

//           <button
//             onClick={handleSend}
//             disabled={!input.trim()}
//             className={cn(
//               "flex-shrink-0 size-7 rounded-lg flex items-center justify-center transition-colors",
//               input.trim()
//                 ? "bg-primary text-primary-foreground hover:bg-primary/90"
//                 : "text-muted-foreground/40"
//             )}
//           >
//             <Send className="size-3.5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Empty State ──────────────────────────────────────────────────────────────

// const EmptyState = () => (
//   <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
//     <MessageSquare className="size-10 opacity-20" />
//     <p className="text-sm">Seleccioná una conversación</p>
//   </div>
// );

// // ─── Chat Panel ───────────────────────────────────────────────────────────────

// const ChatPanel = () => {
//   const { isOpen, close, activeConversationId, setActiveConversation } =
//     useChatUiStore();

//   const activeConversation = MOCK_CONVERSATIONS.find(
//     (c) => c.id === activeConversationId
//   );

//   if (!isOpen) return null;

//   return (
//     <div
//       className={cn(
//         "fixed bottom-4 right-4 z-50",
//         "w-[680px] h-[520px]",
//         "bg-background border border-border rounded-xl shadow-2xl",
//         "flex overflow-hidden"
//       )}
//     >
//       {/* ── Conversation list ── */}
//       <div className="w-[220px] flex-shrink-0 border-r border-border flex flex-col">
//         <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
//           <span className="text-sm font-semibold">Chat</span>
//           <button
//             onClick={close}
//             className="size-6 rounded-md flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
//           >
//             <X className="size-3.5" />
//           </button>
//         </div>

//         <ScrollArea className="flex-1 px-2 py-2">
//           <div className="flex flex-col gap-0.5">
//             {MOCK_CONVERSATIONS.map((conv) => (
//               <ConversationItem
//                 key={conv.id}
//                 conversation={conv}
//                 isActive={conv.id === activeConversationId}
//                 onClick={() => setActiveConversation(conv.id)}
//               />
//             ))}
//           </div>
//         </ScrollArea>
//       </div>

//       {/* ── Chat area ── */}
//       <div className="flex-1 min-w-0">
//         {activeConversation ? (
//           <ChatView conversation={activeConversation} />
//         ) : (
//           <EmptyState />
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatPanel;
