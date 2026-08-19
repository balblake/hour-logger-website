import { Clock3 } from "lucide-react";

type DurationFieldsProps = {
  idPrefix: string;
  label: string;
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  hint?: string;
};

export function DurationFields({
  idPrefix,
  label,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  hint,
}: DurationFieldsProps) {
  const hintId = hint ? `${idPrefix}-hint` : undefined;

  return (
    <fieldset className="duration-fields" aria-describedby={hintId}>
      <legend>
        <Clock3 size={15} aria-hidden="true" />
        {label}
      </legend>
      <div className="duration-input-grid">
        <label htmlFor={`${idPrefix}-hours`}>
          <span>Hours</span>
          <input
            id={`${idPrefix}-hours`}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={hours}
            onChange={(event) => onHoursChange(event.target.value)}
          />
        </label>
        <label htmlFor={`${idPrefix}-minutes`}>
          <span>Minutes</span>
          <input
            id={`${idPrefix}-minutes`}
            type="number"
            min="0"
            max="59"
            step="1"
            inputMode="numeric"
            value={minutes}
            onChange={(event) => onMinutesChange(event.target.value)}
          />
        </label>
      </div>
      {hint ? (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
    </fieldset>
  );
}
