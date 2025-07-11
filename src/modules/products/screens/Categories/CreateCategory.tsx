import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import FormCreateCategory from "../../components/Category/FormCreateCategory";
import TableCreateCategory from "../../components/Category/TableCreateCategory";

const CreateCategory = () => {
  return (
    <div className="">
      <div className="bg-white rounded-lg shadow-sm">
        <PanelGroup direction="horizontal">
          <Panel
            className="min-h-screen"
            minSize={30}
            maxSize={80}
            defaultSize={55}
          >
            <div className="p-4">
              <h2 className="mb-4 text-lg font-semibold">Crear Categoría</h2>
              <FormCreateCategory />
            </div>
          </Panel>
          <PanelResizeHandle className="flex items-center justify-center w-1 transition-colors bg-gray-100 hover:bg-blue-300 cursor-col-resize" />
          <Panel
            className="h-screen"
            minSize={20}
            maxSize={70}
            defaultSize={45}
          >
            <div className="p-4">
              <TableCreateCategory />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default CreateCategory;
