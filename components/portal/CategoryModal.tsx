"use client";

import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  CATEGORY_COLORS,
  parseDurationParts,
  splitDuration,
  type Category,
} from "@/lib/domain";
import { DurationFields } from "./DurationFields";
import { Modal } from "./Modal";

type CategoryDraft = {
  name: string;
  color: string;
  goalMinutes: number;
};

type CategoryModalProps = {
  category?: Category;
  entryCount?: number;
  onClose: () => void;
  onDelete?: (category: Category) => Promise<boolean>;
  onSave: (draft: CategoryDraft) => Promise<void>;
};

export function CategoryModal({
  category,
  entryCount = 0,
  onClose,
  onDelete,
  onSave,
}: CategoryModalProps) {
  const initialGoal = splitDuration(category?.goal_minutes ?? 6_000);
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [goalHours, setGoalHours] = useState(String(initialGoal.hours));
  const [goalMinutes, setGoalMinutes] = useState(String(initialGoal.minutes));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(category);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const totalGoalMinutes = parseDurationParts(goalHours, goalMinutes);

    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }
    if (totalGoalMinutes === null) {
      setError("Enter whole goal hours and 0–59 goal minutes.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        color,
        goalMinutes: totalGoalMinutes,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The category could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!category || !onDelete) return;
    setError("");
    setIsDeleting(true);
    try {
      const deleted = await onDelete(category);
      if (deleted) onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The category could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      title={isEditing ? "Customize category" : "Create a category"}
      description={
        isEditing
          ? `Change the category name, highlight color, or time goal.${
              entryCount > 0
                ? ` Deleting it will also remove ${entryCount} logged ${
                    entryCount === 1 ? "session" : "sessions"
                  }.`
                : ""
            }`
          : "Add any experience type and choose the goal that will power its progress bar."
      }
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="category-name">Category name</label>
            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Research, leadership, service…"
              autoFocus
              required
            />
          </div>
          <DurationFields
            idPrefix="category-goal"
            label="Goal"
            hours={goalHours}
            minutes={goalMinutes}
            onHoursChange={setGoalHours}
            onMinutesChange={setGoalMinutes}
          />
        </div>

        <fieldset className="color-picker">
          <legend>Highlight color</legend>
          <div>
            {CATEGORY_COLORS.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name="category-color"
                  value={option}
                  checked={color === option}
                  onChange={() => setColor(option)}
                />
                <span style={{ backgroundColor: option }} />
                <span className="sr-only">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p className="status-message error" role="alert">
            {error}
          </p>
        ) : null}

        <footer className="modal-actions">
          {isEditing && category && onDelete ? (
            <button
              className="button button-danger modal-delete-button"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              <Trash2 size={16} aria-hidden="true" />
              {isDeleting ? "Deleting…" : "Delete category"}
            </button>
          ) : null}
          <button
            className="button button-quiet"
            type="button"
            onClick={onClose}
            disabled={isDeleting || isSaving}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={isSaving || isDeleting}
          >
            {isSaving
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create category"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
