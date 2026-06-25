"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PartnerForm } from "./partner-form"

export function BecomePartnerModal({
  children,
  onSubmitted,
}: {
  children?: React.ReactNode
  onSubmitted?: () => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Become a Partner</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Become a Partner</DialogTitle>
          <DialogDescription>
            Fill out the form below to list your business and offer perks to the alumni community.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PartnerForm
            onSuccess={() => {
              setOpen(false)
              onSubmitted?.()
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
