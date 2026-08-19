"use client";

import { useState, type FormEvent } from "react";
import type {
  Category,
  Organization,
  OrganizationDraft,
} from "@/lib/domain";
import { Modal } from "./Modal";

type OrganizationModalProps = {
  categories: Category[];
  organization?: Organization | null;
  onClose: () => void;
  onSave: (draft: OrganizationDraft) => Promise<void>;
};

export function OrganizationModal({
  categories,
  organization,
  onClose,
  onSave,
}: OrganizationModalProps) {
  const [name, setName] = useState(organization?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    organization?.category_id ?? "",
  );
  const [contactReference, setContactReference] = useState(
    organization?.contact_reference ?? "",
  );
  const [defaultRole, setDefaultRole] = useState(
    organization?.default_role ?? "",
  );
  const [details, setDetails] = useState(organization?.details ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter the organization name.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: organization?.id,
        categoryId,
        name: name.trim(),
        contactReference: contactReference.trim(),
        defaultRole: defaultRole.trim(),
        details: details.trim(),
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The organization could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={organization ? "Edit organization" : "Add organization"}
      description="Save a place once, then reuse its contact and default role while logging."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="organization-name">Organization / location</label>
            <input
              id="organization-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Community Food Bank"
              autoFocus
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="organization-category">Category</label>
            <select
              id="organization-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Available in every category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="organization-contact">Contact / reference</label>
            <input
              id="organization-contact"
              value={contactReference}
              onChange={(event) => setContactReference(event.target.value)}
              placeholder="Coordinator name, email, or phone"
            />
          </div>
          <div className="form-field">
            <label htmlFor="organization-role">Default role / activity</label>
            <input
              id="organization-role"
              value={defaultRole}
              onChange={(event) => setDefaultRole(event.target.value)}
              placeholder="e.g. Patient support volunteer"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="organization-details">Details</label>
          <textarea
            id="organization-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Address, onboarding notes, verification process, or anything worth remembering."
          />
        </div>

        {error ? (
          <p className="status-message error" role="alert">
            {error}
          </p>
        ) : null}

        <footer className="modal-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={isSaving}
          >
            {isSaving
              ? "Saving…"
              : organization
                ? "Save changes"
                : "Add organization"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
