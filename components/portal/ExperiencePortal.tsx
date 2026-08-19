"use client";

import Image from "next/image";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Rows3,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import {
  CATEGORY_COLORS,
  formatDisplayDate,
  formatDuration,
  parseDurationParts,
  splitDuration,
  type Category,
  type EntryDraft,
  type ExperienceEntry,
  type Organization,
  type OrganizationDraft,
  type PortalData,
  type Profile,
  type ProfileDraft,
} from "@/lib/domain";
import { CategoryModal } from "./CategoryModal";
import { DurationFields } from "./DurationFields";
import { EntryModal } from "./EntryModal";
import { OrganizationModal } from "./OrganizationModal";
import { ProfileModal } from "./ProfileModal";

type ExperiencePortalProps = PortalData & {
  userId: string;
  userEmail: string;
  initialProfile: Profile | null;
  initialAvatarUrl: string | null;
};

type EntryModalState = {
  categoryId?: string;
  entry?: ExperienceEntry | null;
} | null;

const starterCategories = [
  { name: "Volunteer", color: "#b3538c", goal_minutes: 6_000 },
  { name: "Clinical", color: "#7763b2", goal_minutes: 6_000 },
  { name: "Shadowing", color: "#d19a3e", goal_minutes: 3_000 },
];

function makeInitials(value: string) {
  return value
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ExperiencePortal({
  userId,
  userEmail,
  categories: initialCategories,
  organizations: initialOrganizations,
  entries: initialEntries,
  initialProfile,
  initialAvatarUrl,
}: ExperiencePortalProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState(
    [...initialCategories].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [entries, setEntries] = useState(initialEntries);
  const [profile, setProfile] = useState(initialProfile);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [entryModal, setEntryModal] = useState<EntryModalState>(null);
  const [organizationModal, setOrganizationModal] =
    useState<Organization | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const selectedCategory = categories.find(
    (category) => category.id === activeView,
  );
  const profileDisplayName =
    profile?.full_name ||
    profile?.username ||
    userEmail.split("@")[0] ||
    "Your profile";
  const profileSecondary = profile?.username
    ? `@${profile.username}`
    : userEmail;
  const profileInitials = makeInitials(profileDisplayName);

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3_400);
  }

  function navigate(view: string) {
    setActiveView(view);
    setIsMobileNavOpen(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function createCategory(draft: {
    name: string;
    color: string;
    goalMinutes: number;
  }) {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: draft.name,
        color: draft.color,
        goal_minutes: draft.goalMinutes,
        sort_order: categories.length,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    const category = data as Category;
    setCategories((current) => [...current, category]);
    setActiveView(category.id);
    showMessage(`${category.name} was added.`);
  }

  async function updateCategory(
    categoryId: string,
    draft: {
      name: string;
      color: string;
      goalMinutes: number;
    },
  ) {
    const { data, error } = await supabase
      .from("categories")
      .update({
        name: draft.name,
        color: draft.color,
        goal_minutes: draft.goalMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", categoryId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    const category = data as Category;
    setCategories((current) =>
      current.map((item) => (item.id === categoryId ? category : item)),
    );
    showMessage(`${category.name} was updated.`);
  }

  async function deleteCategory(category: Category) {
    const categoryEntries = entries.filter(
      (entry) => entry.category_id === category.id,
    );
    const sessionCopy =
      categoryEntries.length === 1
        ? "1 session"
        : `${categoryEntries.length} sessions`;
    const confirmed = window.confirm(
      categoryEntries.length > 0
        ? `Delete "${category.name}" and its ${sessionCopy}? This cannot be undone. Saved organizations will remain.`
        : `Delete "${category.name}"? This cannot be undone.`,
    );
    if (!confirmed) return false;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    setCategories((current) =>
      current.filter((item) => item.id !== category.id),
    );
    setEntries((current) =>
      current.filter((entry) => entry.category_id !== category.id),
    );
    setOrganizations((current) =>
      current.map((organization) =>
        organization.category_id === category.id
          ? { ...organization, category_id: null }
          : organization,
      ),
    );
    setActiveView("dashboard");
    showMessage(`${category.name} was deleted.`);
    return true;
  }

  function openCreateCategory() {
    setEditingCategory(null);
    setShowCategoryModal(true);
  }

  function openCategorySettings(category: Category) {
    setEditingCategory(category);
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setEditingCategory(null);
  }

  async function addStarterCategories() {
    setIsWorking(true);
    const payload = starterCategories.map((category, index) => ({
      ...category,
      user_id: userId,
      sort_order: index,
    }));
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select();

    if (error) {
      setIsWorking(false);
      showMessage(error.message);
      return;
    }

    setCategories((data as Category[]) ?? []);
    setIsWorking(false);
    showMessage("Your basic medical categories are ready.");
  }

  async function updateGoal(categoryId: string, goalMinutes: number) {
    const { data, error } = await supabase
      .from("categories")
      .update({ goal_minutes: goalMinutes, updated_at: new Date().toISOString() })
      .eq("id", categoryId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId ? (data as Category) : category,
      ),
    );
    showMessage("Goal updated.");
  }

  async function saveOrganization(draft: OrganizationDraft) {
    const payload = {
      user_id: userId,
      category_id: draft.categoryId || null,
      name: draft.name,
      contact_reference: draft.contactReference,
      default_role: draft.defaultRole,
      details: draft.details,
      updated_at: new Date().toISOString(),
    };

    if (draft.id) {
      const { data, error } = await supabase
        .from("organizations")
        .update(payload)
        .eq("id", draft.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setOrganizations((current) =>
        current.map((organization) =>
          organization.id === draft.id ? (data as Organization) : organization,
        ),
      );
      showMessage("Organization updated.");
      return;
    }

    const { data, error } = await supabase
      .from("organizations")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setOrganizations((current) =>
      [...current, data as Organization].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    showMessage("Organization added.");
  }

  async function saveEntry(draft: EntryDraft) {
    const payload = {
      user_id: userId,
      category_id: draft.categoryId,
      organization_id: draft.organizationId || null,
      entry_date: draft.entryDate || null,
      session_notes: draft.sessionNotes,
      organization_name_snapshot: draft.organizationName,
      role_activity: draft.roleActivity,
      minutes: draft.durationMinutes,
      contact_snapshot: draft.contactReference,
      updated_at: new Date().toISOString(),
    };

    if (draft.id) {
      const { data, error } = await supabase
        .from("experience_entries")
        .update(payload)
        .eq("id", draft.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setEntries((current) =>
        current.map((entry) =>
          entry.id === draft.id ? (data as ExperienceEntry) : entry,
        ),
      );
      showMessage("Session updated.");
      return;
    }

    const { data, error } = await supabase
      .from("experience_entries")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setEntries((current) => [data as ExperienceEntry, ...current]);
    showMessage("Session added.");
  }

  async function deleteEntry(entry: ExperienceEntry) {
    const confirmed = window.confirm(
      `Delete this ${formatDuration(entry.minutes)} session? This cannot be undone.`,
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("experience_entries")
      .delete()
      .eq("id", entry.id);
    if (error) {
      showMessage(error.message);
      return;
    }
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    showMessage("Session deleted.");
  }

  async function saveProfile(draft: ProfileDraft) {
    const currentAvatarPath = profile?.avatar_path ?? null;
    const { data: baseProfileData, error: baseProfileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          full_name: draft.fullName,
          username: draft.username || null,
          avatar_path: currentAvatarPath,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (baseProfileError) {
      if (baseProfileError.code === "23505") {
        throw new Error("That username is already being used.");
      }
      throw new Error(baseProfileError.message);
    }

    let savedProfile = baseProfileData as Profile;
    let nextAvatarUrl = avatarUrl;
    let successMessage = "Profile saved.";
    setProfile(savedProfile);

    if (draft.removeAvatar && currentAvatarPath) {
      const { data: avatarProfileData, error: avatarProfileError } =
        await supabase
          .from("profiles")
          .update({ avatar_path: null })
          .eq("user_id", userId)
          .select()
          .single();

      if (avatarProfileError) {
        throw new Error(
          "Your name and username were saved, but the photo could not be removed. Please try again.",
        );
      }

      savedProfile = avatarProfileData as Profile;
      nextAvatarUrl = null;

      const { error: removeError } = await supabase.storage
        .from("profile-photos")
        .remove([currentAvatarPath]);

      if (removeError) {
        successMessage =
          "Profile saved. The old private photo could not be cleaned up yet.";
      }
    } else if (draft.avatarFile) {
      const avatarPath = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(avatarPath, draft.avatarFile, {
          upsert: true,
          cacheControl: "0",
          contentType: draft.avatarFile.type,
        });

      if (uploadError) {
        throw new Error(
          "Your name and username were saved, but the photo could not be uploaded. Please try the photo again.",
        );
      }

      if (currentAvatarPath !== avatarPath) {
        const { data: avatarProfileData, error: avatarProfileError } =
          await supabase
            .from("profiles")
            .update({ avatar_path: avatarPath })
            .eq("user_id", userId)
            .select()
            .single();

        if (avatarProfileError) {
          await supabase.storage.from("profile-photos").remove([avatarPath]);
          throw new Error(
            "Your name and username were saved, but the photo could not be connected to your profile. Please try again.",
          );
        }

        savedProfile = avatarProfileData as Profile;
      }

      const { data: signedData, error: signedUrlError } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(avatarPath, 3_600);

      if (signedUrlError) {
        nextAvatarUrl = null;
        successMessage =
          "Profile saved. Refresh the page if your new photo does not appear yet.";
      } else {
        nextAvatarUrl = signedData.signedUrl;
      }
    }

    setProfile(savedProfile);
    setAvatarUrl(nextAvatarUrl);
    showMessage(successMessage);
  }

  return (
    <div className="portal-shell">
      <header className="mobile-topbar">
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Open navigation"
          onClick={() => setIsMobileNavOpen(true)}
        >
          <Menu aria-hidden="true" />
        </button>
        <button
          className="mobile-topbar-brand"
          type="button"
          onClick={() => navigate("dashboard")}
        >
          <BrandLogo className="mobile-topbar-logo" />
          <span>Hour Logger</span>
        </button>
      </header>

      {isMobileNavOpen ? (
        <button
          className="mobile-nav-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`portal-sidebar ${isMobileNavOpen ? "is-open" : ""}`}
        aria-label="Experience tracker navigation"
      >
        <div className="sidebar-top">
          <button
            className="mobile-nav-close icon-button"
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
          <button
            className="portal-brand"
            type="button"
            onClick={() => navigate("dashboard")}
          >
            <BrandLogo className="portal-brand-logo" />
            <div>
              <strong>Hour Logger</strong>
              <small>Experience tracker</small>
            </div>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === "dashboard" ? "active" : ""}`}
            type="button"
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            Dashboard
          </button>

          <div className="nav-section-heading">
            <span>Categories</span>
            <button
              type="button"
              aria-label="Create category"
              onClick={openCreateCategory}
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="category-nav">
            {categories.map((category) => (
              <button
                className={`nav-item ${
                  activeView === category.id ? "active" : ""
                }`}
                type="button"
                key={category.id}
                onClick={() => navigate(category.id)}
              >
                <i style={{ backgroundColor: category.color }} />
                <span>{category.name}</span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>

          <button
            className={`nav-item ${
              activeView === "organizations" ? "active" : ""
            }`}
            type="button"
            onClick={() => navigate("organizations")}
          >
            <Building2 size={18} aria-hidden="true" />
            Organizations
          </button>
        </nav>

        <div className="sidebar-account">
          <button
            className="sidebar-profile-button"
            type="button"
            aria-label="Edit profile"
            onClick={() => {
              setShowProfileModal(true);
              setIsMobileNavOpen(false);
            }}
          >
            <span className="profile-avatar">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  fill
                  sizes="36px"
                />
              ) : profileInitials ? (
                <span>{profileInitials}</span>
              ) : (
                <CircleUserRound aria-hidden="true" />
              )}
            </span>
            <span className="sidebar-profile-copy">
              <strong>{profileDisplayName}</strong>
              <small>{profileSecondary}</small>
            </span>
          </button>
          <button
            className="icon-button dark"
            type="button"
            aria-label="Sign out"
            onClick={signOut}
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="portal-main">
        {activeView === "dashboard" ? (
          <DashboardPanel
            categories={categories}
            entries={entries}
            onCreateCategory={openCreateCategory}
            onAddStarterCategories={addStarterCategories}
            onAddEntry={() => setEntryModal({})}
            onOpenCategory={(id) => setActiveView(id)}
            isWorking={isWorking}
          />
        ) : activeView === "organizations" ? (
          <OrganizationsPanel
            categories={categories}
            organizations={organizations}
            onAdd={() => setOrganizationModal(null)}
            onEdit={(organization) => setOrganizationModal(organization)}
          />
        ) : selectedCategory ? (
          <CategoryPanel
            key={selectedCategory.id}
            category={selectedCategory}
            entries={entries.filter(
              (entry) => entry.category_id === selectedCategory.id,
            )}
            onAddEntry={() =>
              setEntryModal({ categoryId: selectedCategory.id })
            }
            onEditEntry={(entry) =>
              setEntryModal({ categoryId: selectedCategory.id, entry })
            }
            onDeleteEntry={deleteEntry}
            onEditCategory={() => openCategorySettings(selectedCategory)}
            onUpdateGoal={updateGoal}
          />
        ) : (
          <div className="panel-empty">
            <h1>That category is no longer available.</h1>
            <button
              className="button button-primary"
              type="button"
              onClick={() => setActiveView("dashboard")}
            >
              Return to dashboard
            </button>
          </div>
        )}
      </main>

      {message ? (
        <div className="portal-toast" role="status">
          <Sparkles size={17} aria-hidden="true" />
          {message}
        </div>
      ) : null}

      {showCategoryModal ? (
        <CategoryModal
          category={editingCategory ?? undefined}
          entryCount={
            editingCategory
              ? entries.filter(
                  (entry) => entry.category_id === editingCategory.id,
                ).length
              : 0
          }
          onClose={closeCategoryModal}
          onDelete={editingCategory ? deleteCategory : undefined}
          onSave={(draft) =>
            editingCategory
              ? updateCategory(editingCategory.id, draft)
              : createCategory(draft)
          }
        />
      ) : null}

      {entryModal ? (
        <EntryModal
          categories={categories}
          organizations={organizations}
          initialCategoryId={entryModal.categoryId}
          entry={entryModal.entry}
          onClose={() => setEntryModal(null)}
          onSave={saveEntry}
        />
      ) : null}

      {organizationModal !== undefined ? (
        <OrganizationModal
          categories={categories}
          organization={organizationModal}
          onClose={() => setOrganizationModal(undefined)}
          onSave={saveOrganization}
        />
      ) : null}

      {showProfileModal ? (
        <ProfileModal
          profile={profile}
          avatarUrl={avatarUrl}
          userEmail={userEmail}
          onClose={() => setShowProfileModal(false)}
          onSave={saveProfile}
        />
      ) : null}
    </div>
  );
}

type DashboardPanelProps = {
  categories: Category[];
  entries: ExperienceEntry[];
  isWorking: boolean;
  onCreateCategory: () => void;
  onAddStarterCategories: () => void;
  onAddEntry: () => void;
  onOpenCategory: (id: string) => void;
};

function DashboardPanel({
  categories,
  entries,
  isWorking,
  onCreateCategory,
  onAddStarterCategories,
  onAddEntry,
  onOpenCategory,
}: DashboardPanelProps) {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const recentEntries = [...entries]
    .sort((a, b) => {
      const aDate = a.entry_date ?? a.created_at;
      const bDate = b.entry_date ?? b.created_at;
      return bDate.localeCompare(aDate);
    })
    .slice(0, 5);

  return (
    <div className="portal-page">
      <header className="portal-page-header dashboard-header">
        <div>
          <span className="page-kicker">EXPERIENCE OVERVIEW</span>
          <h1>Hours dashboard</h1>
          <p>Everything you log rolls up here automatically.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={onAddEntry}
          disabled={categories.length === 0}
        >
          <Plus size={18} aria-hidden="true" />
          Log session
        </button>
      </header>

      {categories.length === 0 ? (
        <section className="onboarding-card">
          <div className="onboarding-icon">
            <Rows3 aria-hidden="true" />
          </div>
          <div>
            <span className="page-kicker">START WITH YOUR CATEGORIES</span>
            <h2>Build a tracker that matches your experience.</h2>
            <p>
              Add any category you need, or begin with Volunteer, Clinical, and
              Shadowing and customize them later.
            </p>
            <div className="onboarding-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={onAddStarterCategories}
                disabled={isWorking}
              >
                <Sparkles size={17} aria-hidden="true" />
                {isWorking ? "Adding…" : "Add basic medical categories"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={onCreateCategory}
              >
                Create my own
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="metric-grid" aria-label="Category time totals">
            {categories.map((category) => {
              const categoryEntries = entries.filter(
                (entry) => entry.category_id === category.id,
              );
              const minutes = categoryEntries.reduce(
                (sum, entry) => sum + entry.minutes,
                0,
              );
              return (
                <button
                  className="metric-card"
                  type="button"
                  key={category.id}
                  style={
                    { "--category-color": category.color } as React.CSSProperties
                  }
                  onClick={() => onOpenCategory(category.id)}
                >
                  <span>{category.name}</span>
                  <strong>{formatDuration(minutes)}</strong>
                  <small>
                    {categoryEntries.length}{" "}
                    {categoryEntries.length === 1 ? "session" : "sessions"}
                  </small>
                </button>
              );
            })}
            <button
              className="metric-card add-category-card"
              type="button"
              onClick={onCreateCategory}
            >
              <Plus aria-hidden="true" />
              <span>Add category</span>
            </button>
          </section>

          <section className="total-hours-card">
            <div className="total-hours-copy">
              <span>TOTAL EXPERIENCE TIME</span>
              <strong>{formatDuration(totalMinutes)}</strong>
              <small>{entries.length} logged sessions</small>
            </div>
            <div className="total-hours-visual" aria-hidden="true">
              <Clock3 />
              <i />
              <i />
              <i />
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span className="page-kicker">GOALS</span>
                <h2>Progress by category</h2>
              </div>
              <Target aria-hidden="true" />
            </div>
            <div className="progress-list">
              {categories.map((category) => {
                const minutes = entries
                  .filter((entry) => entry.category_id === category.id)
                  .reduce((sum, entry) => sum + entry.minutes, 0);
                const percent =
                  category.goal_minutes > 0
                    ? Math.round((minutes / category.goal_minutes) * 100)
                    : 0;
                return (
                  <button
                    className="progress-row"
                    type="button"
                    key={category.id}
                    onClick={() => onOpenCategory(category.id)}
                  >
                    <span className="progress-category">
                      <i style={{ backgroundColor: category.color }} />
                      <strong>{category.name}</strong>
                    </span>
                    <span>{formatDuration(minutes)}</span>
                    <span>{formatDuration(category.goal_minutes)} goal</span>
                    <span className="progress-track">
                      <i
                        style={{
                          backgroundColor: category.color,
                          width: `${Math.min(percent, 100)}%`,
                        }}
                      />
                    </span>
                    <strong>{percent}%</strong>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="page-kicker">LATEST</span>
            <h2>Recent sessions</h2>
          </div>
          <CalendarDays aria-hidden="true" />
        </div>
        {recentEntries.length === 0 ? (
          <div className="soft-empty">
            <Clock3 aria-hidden="true" />
            <p>Your newest sessions will appear here.</p>
          </div>
        ) : (
          <div className="recent-list">
            {recentEntries.map((entry) => {
              const category = categories.find(
                (item) => item.id === entry.category_id,
              );
              return (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => category && onOpenCategory(category.id)}
                >
                  <i
                    style={{
                      backgroundColor: category?.color ?? CATEGORY_COLORS[0],
                    }}
                  />
                  <span>
                    <strong>
                      {entry.organization_name_snapshot ||
                        entry.role_activity ||
                        "Experience session"}
                    </strong>
                    <small>
                      {formatDisplayDate(entry.entry_date)} ·{" "}
                      {category?.name ?? "Category"}
                    </small>
                  </span>
                  <strong>{formatDuration(entry.minutes)}</strong>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

type CategoryPanelProps = {
  category: Category;
  entries: ExperienceEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: ExperienceEntry) => void;
  onDeleteEntry: (entry: ExperienceEntry) => void;
  onEditCategory: () => void;
  onUpdateGoal: (categoryId: string, goalMinutes: number) => Promise<void>;
};

function CategoryPanel({
  category,
  entries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onEditCategory,
  onUpdateGoal,
}: CategoryPanelProps) {
  const initialGoal = splitDuration(category.goal_minutes);
  const [goalHours, setGoalHours] = useState(String(initialGoal.hours));
  const [goalMinutes, setGoalMinutes] = useState(String(initialGoal.minutes));
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState("");
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const percent =
    category.goal_minutes > 0
      ? Math.round((totalMinutes / category.goal_minutes) * 100)
      : 0;
  const sortedEntries = [...entries].sort((a, b) =>
    (b.entry_date ?? b.created_at).localeCompare(a.entry_date ?? a.created_at),
  );

  async function saveGoal() {
    const totalGoalMinutes = parseDurationParts(goalHours, goalMinutes);
    if (totalGoalMinutes === null) {
      setGoalError("Enter whole hours and 0–59 minutes.");
      return;
    }
    setGoalError("");
    setIsSavingGoal(true);
    try {
      await onUpdateGoal(category.id, totalGoalMinutes);
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : "Goal not saved.");
    } finally {
      setIsSavingGoal(false);
    }
  }

  return (
    <div className="portal-page">
      <header className="portal-page-header">
        <div>
          <span
            className="category-eyebrow"
            style={
              {
                "--category-color": category.color,
              } as React.CSSProperties
            }
          >
            <i />
            EXPERIENCE LOG
          </span>
          <h1>{category.name}</h1>
          <p>Add and edit sessions in a familiar spreadsheet-style log.</p>
        </div>
        <div className="category-header-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onEditCategory}
          >
            <Pencil size={17} aria-hidden="true" />
            Category settings
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={onAddEntry}
          >
            <Plus size={18} aria-hidden="true" />
            Add session
          </button>
        </div>
      </header>

      <section className="category-summary">
        <article>
          <span>Total time</span>
          <strong>{formatDuration(totalMinutes)}</strong>
          <small>exact hours and minutes</small>
        </article>
        <article>
          <span>Sessions</span>
          <strong>{entries.length}</strong>
          <small>logged in this category</small>
        </article>
        <article className="goal-editor-card">
          <div>
            <span>Time goal</span>
            <div className="goal-input-row">
              <DurationFields
                idPrefix={`goal-${category.id}`}
                label={`${category.name} goal`}
                hours={goalHours}
                minutes={goalMinutes}
                onHoursChange={setGoalHours}
                onMinutesChange={setGoalMinutes}
              />
              <button
                className="button button-secondary"
                type="button"
                onClick={saveGoal}
                disabled={isSavingGoal}
              >
                {isSavingGoal ? "Saving…" : "Save"}
              </button>
            </div>
            {goalError ? <small className="error-text">{goalError}</small> : null}
          </div>
          <div
            className="mini-progress-ring"
            style={
              {
                "--category-color": category.color,
                "--progress": `${Math.min(percent, 100) * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <span>{percent}%</span>
          </div>
        </article>
      </section>

      <section className="log-sheet">
        <div className="sheet-heading">
          <div>
            <span className="page-kicker">SESSION LOG</span>
            <h2>{category.name} entries</h2>
          </div>
          <span>{entries.length} rows</span>
        </div>

        {sortedEntries.length === 0 ? (
          <div className="sheet-empty">
            <CalendarDays aria-hidden="true" />
            <h3>No sessions yet</h3>
            <p>Use “Add session” to create the first row in this log.</p>
            <button className="button button-secondary" type="button" onClick={onAddEntry}>
              <Plus size={17} aria-hidden="true" />
              Add first session
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Session notes</th>
                  <th>Organization / location</th>
                  <th>Role / activity</th>
                  <th className="number-column">Duration</th>
                  <th>Contact / reference</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="date-cell">
                      {formatDisplayDate(entry.entry_date)}
                    </td>
                    <td className="notes-cell">
                      {entry.session_notes || <span>—</span>}
                    </td>
                    <td>{entry.organization_name_snapshot || "—"}</td>
                    <td>{entry.role_activity || "—"}</td>
                    <td className="number-column">
                      <strong>{formatDuration(entry.minutes)}</strong>
                    </td>
                    <td>{entry.contact_snapshot || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Edit session"
                          onClick={() => onEditEntry(entry)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          aria-label="Delete session"
                          onClick={() => onDeleteEntry(entry)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type OrganizationsPanelProps = {
  categories: Category[];
  organizations: Organization[];
  onAdd: () => void;
  onEdit: (organization: Organization) => void;
};

function OrganizationsPanel({
  categories,
  organizations,
  onAdd,
  onEdit,
}: OrganizationsPanelProps) {
  return (
    <div className="portal-page">
      <header className="portal-page-header">
        <div>
          <span className="page-kicker">SMART AUTOFILL</span>
          <h1>Organizations</h1>
          <p>
            Save a contact and default role once. They will fill automatically
            when you choose that organization in a session.
          </p>
        </div>
        <button className="button button-primary" type="button" onClick={onAdd}>
          <Plus size={18} aria-hidden="true" />
          Add organization
        </button>
      </header>

      <section className="organization-info">
        <WandCard />
        <div>
          <strong>How autofill works</strong>
          <p>
            The role and contact are copied into the log row, so historical
            entries stay accurate even if the organization record changes later.
          </p>
        </div>
      </section>

      <section className="log-sheet">
        <div className="sheet-heading">
          <div>
            <span className="page-kicker">DIRECTORY</span>
            <h2>Saved places</h2>
          </div>
          <span>{organizations.length} organizations</span>
        </div>

        {organizations.length === 0 ? (
          <div className="sheet-empty">
            <Building2 aria-hidden="true" />
            <h3>No organizations saved</h3>
            <p>Add one to make future session logging much faster.</p>
            <button className="button button-secondary" type="button" onClick={onAdd}>
              <Plus size={17} aria-hidden="true" />
              Add organization
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table organization-table">
              <thead>
                <tr>
                  <th>Organization / location</th>
                  <th>Category</th>
                  <th>Contact / reference</th>
                  <th>Default role / activity</th>
                  <th>Details</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...organizations]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((organization) => {
                    const category = categories.find(
                      (item) => item.id === organization.category_id,
                    );
                    return (
                      <tr key={organization.id}>
                        <td>
                          <strong>{organization.name}</strong>
                        </td>
                        <td>
                          {category ? (
                            <span
                              className="category-pill"
                              style={
                                {
                                  "--category-color": category.color,
                                } as React.CSSProperties
                              }
                            >
                              <i />
                              {category.name}
                            </span>
                          ) : (
                            <span className="category-pill neutral">
                              All categories
                            </span>
                          )}
                        </td>
                        <td>{organization.contact_reference || "—"}</td>
                        <td>{organization.default_role || "—"}</td>
                        <td className="notes-cell">
                          {organization.details || "—"}
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Edit ${organization.name}`}
                            onClick={() => onEdit(organization)}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function WandCard() {
  return (
    <div className="wand-card-icon" aria-hidden="true">
      <Sparkles />
    </div>
  );
}
