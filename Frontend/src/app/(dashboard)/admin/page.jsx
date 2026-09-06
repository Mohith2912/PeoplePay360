"use client";
import {useEffect,useState} from 'react';
import {apiClient} from '@/lib/api';
import {useAuthStore} from '@/store/authStore';
import {IntegrationForm} from '@/components/ui/IntegrationForm';
export default function Page(){const {user}=useAuthStore();const [users,setUsers]=useState([]),[employees,setEmployees]=useState([]),[logs,setLogs]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){try{const [u,e,a]=await Promise.all([apiClient.get('/api/admin/users'),apiClient.get('/api/employees?limit=200'),apiClient.get('/api/admin/audit')]);setUsers(u.data.data);setEmployees(e.data.data);setLogs(a.data.data);}catch(e){setError(e.response?.data?.message||'Unable to load administration');}}
 useEffect(()=>{if(user?.role==='ADMIN')load();},[user]);if(user?.role!=='ADMIN')return <p>Administrator access required.</p>;
 return <div className="space-y-6"><h1 className="text-2xl font-bold">Administration</h1>{error&&<p role="alert">{error}</p>}<IntegrationForm fields={[{name:'name',label:'Name',required:true},{name:'email',label:'Email',type:'email',required:true},{name:'password',label:'Password (at least 8 characters)',type:'password',required:true},{name:'role',label:'Role',options:['EMPLOYEE','HR_MANAGER','HR_PAYROLL_USER','HR_PAYROLL_MANAGER','ADMIN'],required:true},{name:'employeeId',label:'Linked employee',options:employees.map(e=>({value:e.id,label:e.name}))}]} isLoading={busy} onSubmit={async b=>{setBusy(true);try{await apiClient.post('/api/admin/users',{...b,employeeId:b.employeeId||undefined});await load();}finally{setBusy(false);}}}/><h2>Users</h2>{users.map(u=><p key={u.id}>{u.name} · {u.email} · {u.role}</p>)}<h2>Audit history</h2><div className="max-h-96 overflow-auto">{logs.map(l=><p className="border-b border-slate-800 py-2 text-sm" key={l.id}>{l.createdAt} · {l.user?.name} · {l.action} · {l.entityType}</p>)}</div></div>;
}
