"use client";

import { useState } from "react";

import { createMessage } from "@/features/messages/services/messageApi";

type ContactFormValues = {
  emailAddress: string;
  message: string;
  name: string;
};

type LandingContactFormState = {
  errorMessage: string | null;
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  setFieldValue: (field: keyof ContactFormValues, value: string) => void;
  successMessage: string | null;
  values: ContactFormValues;
};

const INITIAL_VALUES: ContactFormValues = {
  name: "",
  emailAddress: "",
  message: "",
};

export function useLandingContactForm(
  userId: number | null
): LandingContactFormState {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function setFieldValue(field: keyof ContactFormValues, value: string): void {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(): Promise<void> {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await createMessage({
        userId,
        name: values.name,
        emailAddress: values.emailAddress,
        message: values.message,
      });

      setValues(INITIAL_VALUES);
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to send message."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    isSubmitting,
    errorMessage,
    successMessage,
    setFieldValue,
    handleSubmit,
  };
}
