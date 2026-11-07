"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ScriptFormState } from "@/app/scripts/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ScriptFormProps = {
  action: (
    prev: ScriptFormState,
    formData: FormData,
  ) => Promise<ScriptFormState>;
  defaultValues?: { title: string; topic: string; content: string };
  submitLabel: string;
  cancelHref: string;
};

export function ScriptForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
}: ScriptFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field data-invalid={!!state.errors?.title}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues?.title}
            aria-invalid={!!state.errors?.title}
            placeholder="Terraform basics"
          />
          {state.errors?.title && (
            <FieldError>{state.errors.title[0]}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!state.errors?.topic}>
          <FieldLabel htmlFor="topic">Topic</FieldLabel>
          <Input
            id="topic"
            name="topic"
            defaultValue={defaultValues?.topic}
            aria-invalid={!!state.errors?.topic}
            placeholder="Terraform"
          />
          {state.errors?.topic && (
            <FieldError>{state.errors.topic[0]}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!state.errors?.content}>
          <FieldLabel htmlFor="content">Script</FieldLabel>
          <Textarea
            id="content"
            name="content"
            rows={12}
            defaultValue={defaultValues?.content}
            aria-invalid={!!state.errors?.content}
            placeholder="Write the script as it should be spoken, in full sentences."
          />
          {state.errors?.content && (
            <FieldError>{state.errors.content[0]}</FieldError>
          )}
        </Field>

        {state.message && <FieldError>{state.message}</FieldError>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : submitLabel}
          </Button>
          <Link
            href={cancelHref}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancel
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
