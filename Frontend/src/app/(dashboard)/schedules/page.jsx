"use client";

import React, { useEffect, useState } from "react";
import { Clock, Plus } from "lucide-react";
import { useScheduleStore } from "@/store/scheduleStore";
import { useAuthStore } from "@/store/authStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";
import { canAccessHR, isEmployee } from "@/lib/permissions";

export default function SchedulesPage() {
  const { user } = useAuthStore();
  const {
    schedules,
    mySchedule,
    isLoading,
    isRetrying,
    isSubmitting,
    error,
    errorInfo,
    fetchSchedules,
    fetchMySchedule,
    createSchedule,
    clearError,
  } = useScheduleStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isEmp = isEmployee(user?.role);
  const canManage = canAccessHR(user?.role);

  useEffect(() => {
    if (isEmp) {
      // Standard employees only see their own schedule
      fetchMySchedule();
    } else {
      fetchSchedules();
    }
  }, [user?.role]);

  const handleCreate = async (data) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await createSchedule(data);
      setSaveSuccess(true);
      setShowAddForm(false);
      fetchSchedules();
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Failed to create schedule.");
    }
  };

  // --- Employee view: their own schedule only ---
  if (isEmp) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            My Working Schedule
          </h1>
          <p className="text-sm text-slate-400 mt-1">Your assigned working hours and schedule.</p>
        </div>

        {isLoading && !isRetrying ? (
          <CardSkeleton />
        ) : error ? (
          <ErrorState
            title="Unable to Load Your Schedule"
            message={error}
            endpoint={errorInfo?.endpoint || "GET /api/schedules/me"}
            statusCode={errorInfo?.status}
            suggestion={errorInfo?.suggestion || "Your assigned schedule requires the backend service to be running."}
            onRetry={() => fetchMySchedule(true)}
            isRetrying={isRetrying}
          />
        ) : !mySchedule ? (
          <EmptyState
            icon={Clock}
            title="No Schedule Assigned"
            description="You have not been assigned a working schedule yet. Contact your HR manager."
          />
        ) : (
          <ScheduleCard schedule={mySchedule} />
        )}
      </div>
    );
  }

  // --- HR / Admin view: all schedules ---
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            Working Schedules
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define and manage weekly working hour templates.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setSaveError(null); setSaveSuccess(false); clearError(); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "Cancel" : "New Schedule"}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          Schedule created successfully.
        </div>
      )}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
          {saveError}
        </div>
      )}

      {showAddForm && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-4xl">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Create New Schedule</h2>
          <ScheduleForm
            onSubmit={handleCreate}
            isLoading={isSubmitting}
            onCancel={() => { setShowAddForm(false); setSaveError(null); clearError(); }}
          />
        </div>
      )}

      {isLoading && !isRetrying ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton /><CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState
          title="Working Schedules Service Unreachable"
          message={error}
          endpoint={errorInfo?.endpoint || "GET /api/schedules"}
          statusCode={errorInfo?.status}
          suggestion={errorInfo?.suggestion || "Live schedule templates require Mohith's backend service. You can still test schedule configuration."}
          onRetry={() => fetchSchedules({}, true)}
          isRetrying={isRetrying}
          actionLabel={canManage ? "+ New Schedule" : undefined}
          onAction={canManage ? () => { setShowAddForm(true); setSaveError(null); } : undefined}
        />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Schedules Yet"
          description="No working schedules have been configured. Create one to assign to employees and contracts."
          actionLabel={canManage ? "Create First Schedule" : undefined}
          onAction={canManage ? () => setShowAddForm(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ schedule }) {
  const totalMinutes = (schedule.lines || []).reduce((acc, line) => {
    if (!line.startTime || !line.endTime) return acc;
    const [sh, sm] = line.startTime.split(":").map(Number);
    const [eh, em] = line.endTime.split(":").map(Number);
    const worked = (eh * 60 + em) - (sh * 60 + sm) - (line.breakDuration || 0);
    return acc + Math.max(0, worked);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-200">{schedule.name}</h3>
          <p className="text-xs text-cyan-400 mt-0.5">{totalHours}h / week</p>
        </div>
        <Clock className="w-5 h-5 text-cyan-400/50" />
      </div>
      <div className="divide-y divide-slate-800/60">
        {(schedule.lines || []).map((line, idx) => {
          const [sh, sm] = (line.startTime || "").split(":").map(Number);
          const [eh, em] = (line.endTime || "").split(":").map(Number);
          const minutes = (eh * 60 + em) - (sh * 60 + sm) - (line.breakDuration || 0);
          const hours = (minutes / 60).toFixed(1);
          return (
            <div key={idx} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-slate-400 w-12">{line.day}</span>
              <span className="text-slate-300">{line.startTime} – {line.endTime}</span>
              <span className="text-slate-500 text-xs">Break: {line.breakDuration}min</span>
              <span className="text-cyan-400 font-medium text-xs">{hours}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
