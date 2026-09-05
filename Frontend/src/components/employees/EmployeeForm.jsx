import React, { useState } from "react";
import { User, Mail, Phone, Briefcase, Building, Loader2 } from "lucide-react";

export function EmployeeForm({ initialData, onSubmit, isLoading, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    department: initialData?.department || "",
    jobPosition: initialData?.jobPosition || "",
    employmentStatus: initialData?.employmentStatus || "ACTIVE",
    employeeType: initialData?.employeeType || "FULL_TIME",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.jobPosition) newErrors.jobPosition = "Job Position is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">
            Personal Details
          </h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-slate-900/50 border ${errors.name ? 'border-rose-500/50' : 'border-slate-700'} rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <span className="text-[10px] text-rose-400">{errors.name}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-slate-900/50 border ${errors.email ? 'border-rose-500/50' : 'border-slate-700'} rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
                placeholder="john.doe@company.com"
              />
            </div>
            {errors.email && <span className="text-[10px] text-rose-400">{errors.email}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">
            Job Details
          </h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Department</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full bg-slate-900/50 border ${errors.department ? 'border-rose-500/50' : 'border-slate-700'} rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
                placeholder="e.g. Engineering"
              />
            </div>
            {errors.department && <span className="text-[10px] text-rose-400">{errors.department}</span>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Job Position</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.jobPosition}
                onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                className={`w-full bg-slate-900/50 border ${errors.jobPosition ? 'border-rose-500/50' : 'border-slate-700'} rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
                placeholder="e.g. Senior Developer"
              />
            </div>
            {errors.jobPosition && <span className="text-[10px] text-rose-400">{errors.jobPosition}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 appearance-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="NOTICE_PERIOD">Notice Period</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Type</label>
              <select
                value={formData.employeeType}
                onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 appearance-none"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACTOR">Contractor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

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
          {initialData ? "Save Changes" : "Create Employee"}
        </button>
      </div>
    </form>
  );
}
