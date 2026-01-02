import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Submission, ConfirmAction } from "./types";

type ConfirmDialogProps = {
  open: boolean;
  action: ConfirmAction;
  item: Submission | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ open, action, item, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {action === "approve" ? "✓ Approve Submission" : "✗ Reject Submission"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {action === "approve" ? (
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to approve and publish <strong>{item?.title}</strong>? It will be visible to buyers immediately.
            </p>
          ) : (
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to reject <strong>{item?.title}</strong>? The seller will be notified.
            </p>
          )}
        </div>
        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} onClick={onConfirm}>
              {action === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
