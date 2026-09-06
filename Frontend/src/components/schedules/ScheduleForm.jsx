"use client";

import React, { useState } from "react";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";

const DAYS = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
  { key: "SAT", label: "Saturday" },
  { key: "SUN", label: "Sunday" },
];

const DEFAULT_LINE = { day: "MON", startTime: "09:00", endTime: "18:00", breakDuration: 60 };

export function ScheduleForm({ initialData, onSubmit, isLoading, onCancel }) {
  const [name, setName] = useState(initialData?.name || "");
  const [lines, setLines] = useState(
    initialData?.lines?.length ? initialData.lines : [{ ...DEFAULT_LINE }]
  );
  const [errors, setErrors] = useState({});

  const addLine = () => setLines((prev) => [...prev, { ...DEFAULT_LINE }]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const updateLine = (idx, field, value) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === idx ? { ...line, [field]: field === "breakDuration" ? Number(value) : value } : line
      )
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Schedule name is required";
    if (lines.length === 0) newErrors.lines = "At least one day must be configured";
    lines.forEach((line, idx) => {
      if (!line.startTime) newErrors[`line_${idx}_start`] = "Start time required";
      if (!line.endTime) newErrors[`line_${idx}_end`] = "End time required";
      if (line.startTime && line.endTime && line.startTime >= line.endTime)
        newErrors[`line_${idx}_range`] = "End time must be after start time";
      if (line.breakDuration < 0) newErrors[`line_${idx}_break`] = "Break cannot be negative";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: name.trim(), lines });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Schedule Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Schedule Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Standard 40h/week"
          className={`w-full bg-slate-900/50 border ${
            errors.name ? "border-rose-500/50" : "border-slate-700"
          } rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
        />
        {errors.name && <p className="text-[10px] text-rose-400">{errors.name}</p>}
      </div>

      {/* Schedule Lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Daily Schedule Lines</h3>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/30 hover:bg-violet-500/10 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Day
          </button>
        </div>

        {errors.lines && <p className="text-[10px] text-rose-400">{errors.lines}</p>}

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 items-start p-3 bg-slate-900/40 border border-slate-800 rounded-xl"
            >
              {/* Day */}
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wide">Day</label>
                <select
                  value={line.day}
                  onChange={(e) => updateLine(idx, "day", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  {DAYS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wide">Start (HH:MM)</label>
                <input
                  type="time"
                  value={line.startTime}
                  onChange={(e) => updateLine(idx, "startTime", e.target.value)}
                  className={`w-full bg-slate-900 border ${
                    errors[`line_${idx}_start`] || errors[`line_${idx}_range`]
                      ? "border-rose-500/50"
                      : "border-slate-700"
                  } rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500`}
                />
              </div>

              {/* End Time */}
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wide">End (HH:MM)</label>
                <input
                  type="time"
                  value={line.endTime}
                  onChange={(e) => updateLine(idx, "endTime", e.target.value)}
                  className={`w-full bg-slate-900 border ${
                    errors[`line_${idx}_end`] || errors[`line_${idx}_range`]
                      ? "border-rose-500/50"
                      : "border-slate-700"
                  } rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500`}
                />
                {errors[`line_${idx}_range`] && (
                  <p className="text-[10px] text-rose-400">{errors[`line_${idx}_range`]}</p>
                )}
              </div>

              {/* Break Duration */}
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wide">Break (min)</label>
                <input
                  type="number"
                  min={0}
                  value={line.breakDuration}
                  onChange={(e) => updateLine(idx, "breakDuration", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Remove */}
              <div className="col-span-1 flex items-end pb-1.5">
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Computed summary */}
        {lines.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {lines.length} day(s) configured. Times stored as HH:MM 24h. Break duration in minutes.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? "Save Changes" : "Create Schedule"}
        </button>
      </div>
    </form>
  );
}
