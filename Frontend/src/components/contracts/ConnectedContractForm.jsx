"use client";
import {useEffect,useState} from 'react';
import {apiClient} from '@/lib/api';
import {IntegrationForm} from '@/components/ui/IntegrationForm';
export function ContractForm(props){
 const [options,setOptions]=useState({employees:[],structures:[],schedules:[]});
 useEffect(()=>{Promise.all([apiClient.get('/api/employees?limit=200'),apiClient.get('/api/contract-options'),apiClient.get('/api/schedules?limit=200')]).then(([e,s,w])=>setOptions({employees:e.data.data.map(x=>({value:x.id,label:x.name})),structures:s.data.data.map(x=>({value:x.id,label:x.name})),schedules:w.data.data.map(x=>({value:x.id,label:x.name}))})).catch(()=>{});},[]);
 const fields=[{name:'employeeId',label:'Employee',options:options.employees,required:true},{name:'wage',label:'Monthly wage (INR)',type:'number',min:0.01,required:true},{name:'startDate',label:'Start date',type:'date',required:true},{name:'endDate',label:'End date',type:'date'},{name:'structureId',label:'Salary structure',options:options.structures,required:true},{name:'scheduleId',label:'Working schedule',options:options.schedules},{name:'status',label:'Status',options:['ACTIVE','ENDED','CANCELLED'],defaultValue:'ACTIVE',required:true}];
 return <IntegrationForm {...props} fields={fields} initialData={{...props.initialData,startDate:props.initialData?.startDate?.slice(0,10)||'',endDate:props.initialData?.endDate?.slice(0,10)||''}} onSubmit={b=>props.onSubmit({...b,wage:Number(b.wage),endDate:b.endDate||null})}/>;
}
