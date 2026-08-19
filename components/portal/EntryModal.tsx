"use client";

import { CalendarDays, WandSparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type {
  Category,
  EntryDraft,
  ExperienceEntry,
  Organization,
} from "@/lib/domain";
import { parseDurationParts, splitDuration } from "@/lib/domain";
import { DurationFields } from "./DurationFields";
import { Modal } from "./Modal";

type EntryModalProps = {
  categories: Category[];
  organizations: Organization[];
  initialCategoryId?: string;
  entry?: ExperienceEntry | null;
  onClose: () => void;
  onSave: (draft: EntryDraft) => Promise<void>;
};

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function EntryModal({
  categories,
  organizations,
  initialCategoryId,
  entry,
  onClose,
  onSave,
}: EntryModalProps) {
  const initialDuration = splitDuration(entry?.minutes ?? 0);
  const [categoryId, setCategoryId] = useState(
    entry?.category_id ?? initialCategoryId ?? categories[0]?.id ?? "",
  );
  const [organizationId, setOrganizationId] = useState(
    entry?.organization_id ?? "",
  );
  const [organizationName, setOrganizationName] = useState(
    entry?.organization_name_snapshot ?? "",
  );
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ?? todayForInput(),
  );
  const [sessionNotes, setSessionNotes] = useState(
    entry?.session_notes ?? "",
  );
  const [roleActivity, setRoleActivity] = useState(
    entry?.role_activity ?? "",
  );
  const [durationHours, setDurationHours] = useState(
    String(initialDuration.hours),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(initialDuration.minutes),
  );
  const [contactReference, setContactReference] = useState(
    entry?.contact_snapshot ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const availableOrganizations = useMemo(
    () =>
      organizations.filter(
        (organization) =>
          !organization.category_id || organization.category_id === categoryId,
      ),
    [categoryId, organizations],
  );

  function chooseOrganization(value: string) {
    setOrganizationId(value);
    const organization = organizations.find((item) => item.id === value);

    if (!organization) {
      setOrganizationName("");
      setContactReference("");
      setRoleActivity("");
      return;
    }

    setOrganizationName(organization.name);
    setContactReference(organization.contact_reference);
    setRoleActivity(organization.default_role);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const totalMinutes = parseDurationParts(durationHours, durationMinutes);
    if (!categoryId) {
      setError("Choose a category before saving.");
      return;
    }
    if (totalMinutes === null || totalMinutes <= 0) {
      setError(
        "Enter whole hours and 0–59 minutes. The session must be longer than zero.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: entry?.id,
        categoryId,
        organizationId,
        entryDate,
        sessionNotes: sessionNotes.trim(),
        organizationName: organizationName.trim(),
        roleActivity: roleActivity.trim(),
        durationMinutes: totalMinutes,
        contactReference: contactReference.trim(),
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The session could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={entry ? "Edit session" : "Log a session"}
      description="Enter the session in hours and minutes. Totals update automatically."
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="entry-category">Category</label>
            <select
              id="entry-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setOrganizationId("");
                setOrganizationName("");
                setContactReference("");
                setRoleActivity("");
              }}
              required
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field entry-date-field">
            <label htmlFor="entry-date">
              <CalendarDays size={15} aria-hidden="true" />
              Date
            </label>
            <span className="date-input-shell">
              <input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                required
              />
            </span>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="entry-organization">Organization</label>
            <select
              id="entry-organization"
              value={organizationId}
              onChange={(event) => chooseOrganization(event.target.value)}
            >
              <option value="">No saved organization</option>
              {availableOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Selecting a saved place fills the contact and role.
            </span>
          </div>
          <DurationFields
            idPrefix="entry-duration"
            label="Duration"
            hours={durationHours}
            minutes={durationMinutes}
            onHoursChange={setDurationHours}
            onMinutesChange={setDurationMinutes}
            hint="For example, 1 hour and 30 minutes."
          />
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="entry-role">
              <WandSparkles size={15} aria-hidden="true" />
              Role / activity
            </label>
            <input
              id="entry-role"
              value={roleActivity}
              onChange={(event) => setRoleActivity(event.target.value)}
              placeholder="Volunteer, observer, patient support…"
            />
          </div>
          <div className="form-field">
            <label htmlFor="entry-contact">Contact / reference</label>
            <input
              id="entry-contact"
              value={contactReference}
              onChange={(event) => setContactReference(event.target.value)}
              placeholder="Name, email, or phone"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="entry-notes">Session notes</label>
          <textarea
            id="entry-notes"
            value={sessionNotes}
            onChange={(event) => setSessionNotes(event.target.value)}
            placeholder="What did you do or learn during this session?"
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
            {isSaving ? "Saving…" : entry ? "Save changes" : "Add session"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
