import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

import { AlertDialogAction } from "./ui/alert-dialog";

export const ConfirmDialog = ({
  open,
  isFetching = false,
  title = "Are you sure?",
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  isFetching?: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isFetching}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600"
            onClick={onConfirm}
            disabled={isFetching}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
