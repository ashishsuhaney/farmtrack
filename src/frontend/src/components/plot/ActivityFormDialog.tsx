import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  dateToInputValue,
  errorMessage,
  inputValueToTimestamp,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_TYPES,
  type ActivityType,
  type FieldActivityInput,
} from "@/types/farms";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plotId: bigint;
  onSubmit: (input: FieldActivityInput) => Promise<unknown>;
  isSubmitting: boolean;
}

interface FormState {
  activityType: ActivityType;
  date: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    activityType: ACTIVITY_TYPES[0].value,
    date: dateToInputValue(new Date()),
    notes: "",
  };
}

/**
 * Log a field activity against a plot: type, date, and optional notes.
 * The draft is owned locally and only reset by the user's own submit flow.
 */
export function ActivityFormDialog({
  open,
  onOpenChange,
  plotId,
  onSubmit,
  isSubmitting,
}: ActivityFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setSubmitError(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const draft = form;
    setForm(emptyForm());
    try {
      await onSubmit({
        plotId,
        activityType: draft.activityType,
        date: inputValueToTimestamp(draft.date),
        notes: draft.notes.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      setForm(draft);
      setSubmitError(errorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="activity.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Log field activity
          </DialogTitle>
          <DialogDescription>
            Record what happened on this plot so its field history stays
            complete.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="activity-type">Activity type</Label>
            <Select
              value={form.activityType}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  activityType: value as ActivityType,
                }))
              }
            >
              <SelectTrigger
                id="activity-type"
                data-ocid="activity.type_select"
                className="w-full"
              >
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-date">Date</Label>
            <Input
              id="activity-date"
              data-ocid="activity.date_input"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-notes">Notes</Label>
            <Textarea
              id="activity-notes"
              data-ocid="activity.notes_textarea"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Applied 40 kg of nitrogen per hectare."
              rows={3}
            />
          </div>

          {submitError && (
            <p
              data-ocid="activity.submit_error"
              className={cn("text-sm text-destructive")}
            >
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              data-ocid="activity.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="activity.submit_button"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Log activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
