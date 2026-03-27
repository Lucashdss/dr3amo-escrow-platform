"use client";

import { useLandingContactForm } from "@/features/messages/hooks/useLandingContactForm";

type LandingContactSectionProps = {
  userId: number | null;
};

export function LandingContactSection({
  userId,
}: LandingContactSectionProps) {
  const {
    values,
    isSubmitting,
    errorMessage,
    successMessage,
    setFieldValue,
    handleSubmit,
  } = useLandingContactForm(userId);

  return (
    <section
      id="landing-contact"
      className="px-6 pb-18 pt-4 md:px-10 md:pb-24 md:pt-6"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center text-white">
          <h2 className="text-4xl font-black tracking-tight md:text-6xl">
            How can we help?
          </h2>
          <p className="mt-4 text-lg text-white/58 md:text-xl">
            We&apos;re here to help you build. Contact us to learn more.
          </p>
        </div>

        <form
          className="mt-10 rounded-[2rem] bg-black p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)] md:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid gap-6">
            <label className="block text-left">
              <span className="mb-3 block text-base font-medium text-white">
                Name *
              </span>
              <input
                type="text"
                required
                value={values.name}
                onChange={(event) => setFieldValue("name", event.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-full border border-white/10 bg-black/15 px-5 py-4 text-base text-white placeholder:text-white/50 focus:outline-none"
              />
            </label>

            <label className="block text-left">
              <span className="mb-3 block text-base font-medium text-white">
                Email *
              </span>
              <input
                type="email"
                required
                value={values.emailAddress}
                onChange={(event) =>
                  setFieldValue("emailAddress", event.target.value)
                }
                placeholder="Enter your email"
                className="w-full rounded-full border border-white/10 bg-black/15 px-5 py-4 text-base text-white placeholder:text-white/50 focus:outline-none"
              />
            </label>

            <label className="block text-left">
              <span className="mb-3 block text-base font-medium text-white">
                Message *
              </span>
              <textarea
                rows={6}
                required
                value={values.message}
                onChange={(event) =>
                  setFieldValue("message", event.target.value)
                }
                placeholder="Write a message"
                className="w-full rounded-[1.75rem] border border-white/10 bg-black/15 px-5 py-4 text-base text-white placeholder:text-white/50 focus:outline-none"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="mt-5 text-sm text-red-400">{errorMessage}</p>
          ) : null}

          {successMessage ? (
            <p className="mt-5 text-sm text-green-400">{successMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 w-full rounded-full bg-white px-6 py-4 text-base font-semibold text-[#2f3136] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>
    </section>
  );
}
