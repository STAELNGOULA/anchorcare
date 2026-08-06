"use client";

import * as React from "react";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DatePicker,
  FileUpload,
  FormSelect,
  PhoneInput,
  RichText,
  SignaturePad,
  TextField,
} from "@/components/forms";

export function DevUiGallery() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [select, setSelect] = React.useState("");
  const [rich, setRich] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl">Forms & overlays</h2>
      <BezelCard className="space-y-6 p-6">
        <TextField
          id="demo-name"
          label="Child name"
          placeholder="Emma"
          hint="Legal first name"
        />
        <FormSelect
          id="demo-program"
          label="Program"
          value={select}
          onValueChange={setSelect}
          options={[
            { value: "am", label: "Morning session" },
            { value: "pm", label: "Afternoon session" },
          ]}
        />
        <DatePicker
          id="demo-date"
          label="Start date"
          value={date}
          onChange={setDate}
        />
        <PhoneInput
          id="demo-phone"
          label="Mobile"
          value={phone}
          onChange={(e164) => setPhone(e164)}
        />
        <RichText
          id="demo-notes"
          label="Notes"
          value={rich}
          onChange={setRich}
        />
        <FileUpload
          id="demo-photo"
          label="Photo"
          value={file}
          onChange={setFile}
        />
        <SignaturePad
          id="demo-sig"
          label="Signature"
          onChange={() => undefined}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            onClick={() => toast.success("Saved", { description: "Changes synced." })}
          >
            Show toast
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmOpen(true)}
          >
            Confirm dialog
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline">
                Open sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Mobile filter drawer with motion.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </BezelCard>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Discard draft?"
        description="Unsaved changes will be lost."
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={() => setConfirmOpen(false)}
      />
    </section>
  );
}
