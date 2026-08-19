"use client";

import Image from "next/image";
import { Camera, Trash2, UserRound } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { Profile, ProfileDraft } from "@/lib/domain";
import { Modal } from "./Modal";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

type ProfileModalProps = {
  profile: Profile | null;
  avatarUrl: string | null;
  userEmail: string;
  onClose: () => void;
  onSave: (draft: ProfileDraft) => Promise<void>;
};

function profileInitials(fullName: string, username: string, email: string) {
  const source = fullName.trim() || username.trim() || email.split("@")[0] || "U";
  return source
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileModal({
  profile,
  avatarUrl,
  userEmail,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const previewObjectUrl = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
      }
    };
  }, []);

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");

    if (!file) {
      setAvatarFile(null);
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
        previewObjectUrl.current = null;
      }
      setPreviewUrl(avatarUrl);
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Profile pictures must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
    }
    previewObjectUrl.current = URL.createObjectURL(file);
    setPreviewUrl(previewObjectUrl.current);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedName.length > 120) {
      setError("Your name must be 120 characters or fewer.");
      return;
    }
    if (normalizedUsername && !USERNAME_PATTERN.test(normalizedUsername)) {
      setError(
        "Username must be 3–30 lowercase letters, numbers, or underscores.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        fullName: normalizedName,
        username: normalizedUsername,
        avatarFile,
        removeAvatar,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your profile could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const initials = profileInitials(fullName, username, userEmail);

  return (
    <Modal
      title="Your profile"
      description="Add only what you want to share with your own Hour Logger account."
      onClose={onClose}
    >
      <form className="modal-form profile-form" onSubmit={handleSubmit}>
        <div className="profile-photo-editor">
          <div className="profile-avatar profile-avatar-large">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile preview"
                fill
                sizes="88px"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            ) : initials ? (
              <span>{initials}</span>
            ) : (
              <UserRound aria-hidden="true" />
            )}
          </div>
          <div>
            <label className="button button-secondary profile-upload-button">
              <Camera size={16} aria-hidden="true" />
              Choose photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={chooseAvatar}
              />
            </label>
            {previewUrl ? (
              <button
                className="button button-quiet profile-remove-button"
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setRemoveAvatar(true);
                  if (previewObjectUrl.current) {
                    URL.revokeObjectURL(previewObjectUrl.current);
                    previewObjectUrl.current = null;
                  }
                  setPreviewUrl(null);
                }}
              >
                <Trash2 size={15} aria-hidden="true" />
                Remove
              </button>
            ) : null}
            <span className="field-hint">
              Optional JPG, PNG, or WebP up to 5 MB.
            </span>
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              value={fullName}
              maxLength={120}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div className="form-field">
            <label htmlFor="profile-username">Username</label>
            <div className="username-input">
              <span aria-hidden="true">@</span>
              <input
                id="profile-username"
                value={username}
                maxLength={30}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your_username"
                autoComplete="username"
              />
            </div>
            <span className="field-hint">
              3–30 letters, numbers, or underscores.
            </span>
          </div>
        </div>

        <div className="profile-email-card">
          <span>Account email</span>
          <strong>{userEmail}</strong>
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
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
