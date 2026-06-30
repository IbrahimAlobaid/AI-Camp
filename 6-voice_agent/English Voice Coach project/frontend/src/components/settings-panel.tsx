import { SlidersHorizontal } from "lucide-react";

import {
  CORRECTION_LEVELS,
  LEARNER_LEVELS,
  LESSON_TOPICS,
  TEACHING_STYLES,
  VOICES,
} from "../lib/constants";
import type { SessionSettings } from "../types/voice";

interface SettingsPanelProps {
  settings: SessionSettings;
  disabled: boolean;
  onChange: <Key extends keyof SessionSettings>(
    key: Key,
    value: SessionSettings[Key],
  ) => void;
}

function SelectField<Value extends string>({
  id,
  label,
  value,
  disabled,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: Value;
  disabled: boolean;
  options: Array<{ value: Value; label: string }>;
  onChange: (value: Value) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as Value)}
        className="w-full rounded-xl border border-white/10 bg-[#0b1728] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsPanel({
  settings,
  disabled,
  onChange,
}: SettingsPanelProps) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-white">
            <SlidersHorizontal size={17} className="text-cyan-300" />
            Session settings
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Settings are stored in this browser and sent only when a session
            starts.
          </p>
        </div>
        {disabled ? (
          <span className="shrink-0 rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
            Locked live
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="learner-level"
          label="Learner level"
          value={settings.learnerLevel}
          disabled={disabled}
          options={LEARNER_LEVELS.map(({ value, label, description }) => ({
            value,
            label: `${label} · ${description}`,
          }))}
          onChange={(value) => onChange("learnerLevel", value)}
        />
        <SelectField
          id="lesson-topic"
          label="Lesson topic"
          value={settings.lessonTopic}
          disabled={disabled}
          options={LESSON_TOPICS}
          onChange={(value) => onChange("lessonTopic", value)}
        />
        <SelectField
          id="teaching-style"
          label="Teaching style"
          value={settings.teachingStyle}
          disabled={disabled}
          options={TEACHING_STYLES}
          onChange={(value) => onChange("teachingStyle", value)}
        />
        <SelectField
          id="correction-level"
          label="Correction strictness"
          value={settings.correctionStrictness}
          disabled={disabled}
          options={CORRECTION_LEVELS}
          onChange={(value) => onChange("correctionStrictness", value)}
        />
        <div className="sm:col-span-2">
          <SelectField
            id="voice-name"
            label="Coach voice"
            value={settings.voice}
            disabled={disabled}
            options={VOICES}
            onChange={(value) => onChange("voice", value)}
          />
        </div>
      </div>
    </section>
  );
}
