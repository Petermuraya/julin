import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";

interface AdminPropertiesHeaderProps {
  selectedProperties: string[];
  openAddDialog: () => void;
  bulkUpdateStatus: (status: "available" | "pending" | "sold") => void;
  bulkDeleteProperties: () => void;
}

export const AdminPropertiesHeader = ({
  selectedProperties,
  openAddDialog,
  bulkUpdateStatus,
  bulkDeleteProperties,
}: AdminPropertiesHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Properties</h1>
        <p className="text-muted-foreground mt-1">Manage all properties in your portfolio</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2">
            <PlusIcon className="h-4 w-4 mr-2" />
          Add Property
        </Button>
        {selectedProperties.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={() => bulkUpdateStatus("available")}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              Mark Available
            </Button>
            <Button
              onClick={() => bulkUpdateStatus("sold")}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Mark Sold
            </Button>
            <Button
              onClick={bulkDeleteProperties}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};