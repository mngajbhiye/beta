import { useState } from "react";
import axios from "axios";
import {
  createCustomer,
  type CreateCustomerInput,
} from "../../services/customerService";

interface PhoneContact {
  name?: string[];
  tel?: string[];
}

interface ContactPicker {
  select(
    properties: ("name" | "tel")[],
    options?: { multiple?: boolean },
  ): Promise<PhoneContact[]>;
}

interface ContactPickerNavigator extends Navigator {
  contacts?: ContactPicker;
}

interface CustomerFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

interface CustomerFormValues {
  name: string;
  phone: string;
  address: string;
}

export default function CustomerForm({
  onCreated,
  onCancel,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormValues>({
    name: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CustomerFormValues, string>>
  >({});

  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    setServerError("");
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Customer name is required.";
    } else if (form.name.trim().length > 100) {
      nextErrors.name = "Name cannot exceed 100 characters.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (form.phone.trim().length > 20) {
      nextErrors.phone = "Phone number cannot exceed 20 characters.";
    }

    if (form.address.trim().length > 500) {
      nextErrors.address = "Address cannot exceed 500 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function selectContact() {
    setServerError("");

    const contactPicker = (navigator as ContactPickerNavigator).contacts;

    if (!window.isSecureContext) {
      setServerError(
        "Contact selection requires a secure connection. Open the app over HTTPS or enter the details manually.",
      );
      return;
    }

    if (!contactPicker) {
      setServerError(
        "Contact selection is not supported in this browser. Try Chrome on Android or enter the details manually.",
      );
      return;
    }

    try {
      const contacts = await contactPicker.select(["name", "tel"]);
      const contact = contacts[0];

      if (!contact) return;

      const name = contact.name?.[0]?.trim() ?? "";
      const phone = contact.tel?.[0]?.trim() ?? "";

      setForm((previous) => ({
        ...previous,
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
      }));

      setErrors((previous) => ({
        ...previous,
        ...(name ? { name: undefined } : {}),
        ...(phone ? { phone: undefined } : {}),
      }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setServerError("Unable to select this contact. Please try again.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");

    if (!validate()) return;

    const payload: CreateCustomerInput = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
    };

    try {
      setIsSubmitting(true);
      await createCustomer(payload);
      onCreated();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        setServerError(
          typeof detail === "string"
            ? detail
            : error.response
              ? "Unable to create customer. Please check the details."
              : "Unable to connect to the server. Check your connection.",
        );
      } else {
        setServerError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100";

  const labelClass =
    "block w-full text-left text-sm font-medium text-neutral-700";

  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2
              id="customer-form-title"
              className="text-left text-lg font-semibold tracking-tight text-neutral-900"
            >
              Add customer
            </h2>

            <p className="mt-0.5 text-left text-sm text-neutral-500">
              Enter customer details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close form"
            className="rounded-md px-2 py-1 text-xl leading-none text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 px-5 py-4"
        >
          <button
            type="button"
            onClick={() => void selectContact()}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M6 16c0-1.7 1.3-3 3-3s3 1.3 3 3" />
              <path d="M16 9h2M16 13h2" />
            </svg>
            Choose from contacts
          </button>

          <div>
            <label htmlFor="customer-name" className={labelClass}>
              Customer name <span className="text-red-600">*</span>
            </label>

            <input
              id="customer-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Enter full name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "customer-name-error" : undefined}
              className={inputClass}
            />

            {errors.name && (
              <p id="customer-name-error" className={errorClass}>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="customer-phone" className={labelClass}>
              Phone number <span className="text-red-600">*</span>
            </label>

            <input
              id="customer-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="Enter phone number"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "customer-phone-error" : undefined
              }
              className={inputClass}
            />

            {errors.phone && (
              <p id="customer-phone-error" className={errorClass}>
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="customer-address" className={labelClass}>
              Address{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>

            <textarea
              id="customer-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              autoComplete="street-address"
              rows={2}
              placeholder="Enter address"
              aria-invalid={Boolean(errors.address)}
              aria-describedby={
                errors.address ? "customer-address-error" : undefined
              }
              className={`${inputClass} resize-y`}
            />

            {errors.address && (
              <p id="customer-address-error" className={errorClass}>
                {errors.address}
              </p>
            )}
          </div>

          {serverError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save customer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
