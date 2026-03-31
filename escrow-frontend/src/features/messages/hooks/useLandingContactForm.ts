"use client";

import { useState } from "react";

import { BOT_VERIFICATION_REQUIRED_MESSAGE } from "@/features/messages/constants";
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
  setTurnstileToken: (value: string | null) => void;
  successMessage: string | null;
  turnstileResetKey: number;
  values: ContactFormValues;
};

const INITIAL_VALUES: ContactFormValues = {
  name: "",
  emailAddress: "",
  message: "",
};

export function useLandingContactForm(
): LandingContactFormState {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  function resetTurnstile(): void {
    setTurnstileToken(null);
    setTurnstileResetKey((currentValue) => currentValue + 1);
  }

  function setFieldValue(field: keyof ContactFormValues, value: string): void {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(): Promise<void> {
    if (!turnstileToken) {
      setErrorMessage(BOT_VERIFICATION_REQUIRED_MESSAGE);
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await createMessage({
        name: values.name,
        emailAddress: values.emailAddress,
        message: values.message,
        turnstileToken,
      });

      setValues(INITIAL_VALUES);
      resetTurnstile();
      setSuccessMessage(result.message);
    } catch (error) {
      resetTurnstile();
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
    setTurnstileToken,
    handleSubmit,
    turnstileResetKey,
  };
}
