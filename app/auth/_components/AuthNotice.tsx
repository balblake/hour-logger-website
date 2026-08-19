import type { ReactNode } from "react";

type AuthNoticeProps = {
  children: ReactNode;
  id?: string;
  tone?: "error" | "success";
};

export function AuthNotice({
  children,
  id,
  tone = "success",
}: AuthNoticeProps) {
  return (
    <p
      aria-live="polite"
      className={`status-message${tone === "error" ? " error" : ""}`}
      id={id}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
