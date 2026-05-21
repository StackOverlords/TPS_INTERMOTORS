import { useChatStore } from "@/modules/messaging/stores/ChatStore";
import { useNavigate } from "react-router";
import type { TransferRequest } from "../types/transferRequest.types";
import TransferRequestCreateScreen from "./TransferRequestCreateScreen";

/**
 * Route-level wrapper for TransferRequestCreateScreen.
 *
 * The Tab system renders route elements as `<Component />` (no props).
 * This wrapper wires the `onSuccess` callback to ChatStore.sendTransferRequest
 * so the screen does not need to know about the chat layer directly.
 *
 * Flow on success:
 *   1. Create request → receive TransferRequest
 *   2. Call ChatStore.sendTransferRequest (creates DM if needed + sends message)
 *   3. Navigate back to transfers list
 */
const TransferRequestCreatePage = () => {
  const navigate = useNavigate();
  const sendTransferRequest = useChatStore((s) => s.sendTransferRequest);

  const handleSuccess = async (request: TransferRequest) => {
    await sendTransferRequest({
      toUserId: request.usuario_destinatario_id,
      transferRequestId: request.id,
      itemCount: request.items.length,
    });
    navigate("/dashboard/transfers");
  };

  return <TransferRequestCreateScreen onSuccess={handleSuccess} />;
};

export default TransferRequestCreatePage;
