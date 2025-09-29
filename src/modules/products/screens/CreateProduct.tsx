// import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Kbd } from "@/components/atoms/kbd";
import TooltipButton from "@/components/common/TooltipButton";
import { useGoBack } from "@/hooks/useGoBack";
import { CornerUpLeft } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import FormCreateProduct from "../components/FormCreateProduct";
// import TableCreateProduct from "../components/TableCreateProduct";

const CreateProduct = () => {
  const handleGoBack = useGoBack("/dashboard/productos");

  // Shortcuts
  useHotkeys('escape', (e) => {
    e.preventDefault();
    handleGoBack();
  }, {
    scopes: ["esc-key"],
    enabled: true
  });

  return (
    <div className={`flex justify-center items-center`}>
      {/* <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
          <Panel className="" minSize={30} maxSize={80} defaultSize={isMobile ? 40 : 55}> */}
      <div className="w-full space-y-2">
        {/* Header */}
        <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <TooltipButton
                tooltipContentProps={{
                  align: 'start'
                }}
                onClick={handleGoBack}
                tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver atrás</p>}
                buttonProps={{
                  variant: 'default',
                  type: 'button'
                }}
              >
                <CornerUpLeft />
              </TooltipButton>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                  Nuevo Producto
                </h1>
                <p className="text-sm text-gray-500">Registra un nuevo producto en el sistema</p>
              </div>
            </div >

            {/* Action Buttons */}
            < div className="flex items-center justify-end w-full sm:w-auto gap-2" >

            </div >
          </div >
        </header >
        <FormCreateProduct
        />
      </div>
      {/* </Panel> */}
      {/* <PanelResizeHandle className={`${
            isMobile 
              ? "h-1 flex items-center justify-center bg-gray-100 hover:bg-blue-300 transition-colors cursor-row-resize" 
              : "w-1 flex items-center justify-center bg-gray-100 hover:bg-blue-300 transition-colors cursor-col-resize"
          }`}></PanelResizeHandle>
          <Panel className="" minSize={20} maxSize={70} defaultSize={isMobile ? 60 : 45}>
            <div className="p-4 h-full flex flex-col">
              <TableCreateProduct />
            </div>
          </Panel> */}
      {/* </PanelGroup> */}
    </div>
  );
};

export default CreateProduct;