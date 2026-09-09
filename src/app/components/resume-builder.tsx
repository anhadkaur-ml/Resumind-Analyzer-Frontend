"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { api, getApiErrorMessage } from "../../lib/api";

type BuilderStatus = "Draft" | "Completed";
type EducationEntry = {educationType:string;degree:string;field:string;institution:string;startYear:string;endYear:string};
type ProjectEntry = {name:string;technologies:string;description:string;link:string};
type ResumeData = {
  id: number | null;
  title: string;
  targetRole: string;
  template: string;
  status: BuilderStatus;
  completion: number;
  updatedAt: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  jobTitle: string;
  company: string;
  period: string;
  experience: string;
  education: string;
  educationEntries: EducationEntry[];
  skills: string;
  skillItems: string[];
  projects: string;
  projectEntries: ProjectEntry[];
};

type BuilderApiData = {
  id:number; title:string; target_role:string; template:string; status:BuilderStatus;
  completion:number; updated_at:string; full_name:string; email:string; phone:string;
  location:string; summary:string; job_title:string; company:string; period:string;
  experience:string; education:string; education_entries:{education_type:string;degree:string;field:string;institution:string;start_year:string;end_year:string}[];
  skills:string; skill_items:string[]; projects:string; project_entries:{name:string;technologies:string;description:string;link:string}[];
};

// Keep API field conversion in one place so the UI can use natural camelCase names.
function fromApi(item:BuilderApiData):ResumeData {
  return {id:item.id,title:item.title,targetRole:item.target_role,template:item.template,status:item.status,completion:item.completion,updatedAt:item.updated_at,fullName:item.full_name,email:item.email,phone:item.phone,location:item.location,summary:item.summary,jobTitle:item.job_title,company:item.company,period:item.period,experience:item.experience,education:item.education,educationEntries:(item.education_entries||[]).map((entry)=>({educationType:entry.education_type||"Bachelor's Degree",degree:entry.degree,field:entry.field,institution:entry.institution,startYear:entry.start_year,endYear:entry.end_year})),skills:item.skills,skillItems:item.skill_items||[],projects:item.projects,projectEntries:item.project_entries||[]};
}

function toApi(item:ResumeData,status:BuilderStatus) {
  return {title:item.title,target_role:item.targetRole,template:item.template,status,full_name:item.fullName,email:item.email,phone:item.phone,location:item.location,summary:item.summary,job_title:item.jobTitle,company:item.company,period:item.period,experience:item.experience,education:item.education,education_entries:item.educationEntries.map((entry)=>({education_type:entry.educationType,degree:entry.degree,field:entry.field,institution:entry.institution,start_year:entry.startYear,end_year:entry.endYear})),skills:item.skills,skill_items:item.skillItems,projects:item.projects,project_entries:item.projectEntries};
}

export function ResumeBuilderHome() {
  const [resumes,setResumes]=useState<ResumeData[]>([]);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState<"All"|BuilderStatus>("All");
  const [template,setTemplate]=useState("All Templates");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{let active=true;api.get<BuilderApiData[]>("/api/resumes/builder/").then(({data})=>{if(active)setResumes(data.map(fromApi));}).catch((reason)=>{if(active)setError(getApiErrorMessage(reason,"Builder resumes could not be loaded."));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const filtered=useMemo(()=>resumes.filter((item)=>(status==="All"||item.status===status)&&(template==="All Templates"||item.template===template)&&`${item.title} ${item.targetRole}`.toLowerCase().includes(query.toLowerCase())),[resumes,query,status,template]);
  const drafts=resumes.filter((item)=>item.status==="Draft").length;
  const completed=resumes.filter((item)=>item.status==="Completed").length;
  async function duplicate(item:ResumeData){setError("");try{const payload={...toApi(item,"Draft"),title:`${item.title} Copy`};const {data}=await api.post<BuilderApiData>("/api/resumes/builder/",payload);setResumes((current)=>[fromApi(data),...current]);}catch(reason){setError(getApiErrorMessage(reason,"The resume could not be duplicated."));}}
  async function remove(id:number|null){if(id===null||!window.confirm("Delete this resume?"))return;setError("");try{await api.delete(`/api/resumes/builder/${id}/`);setResumes((current)=>current.filter((item)=>item.id!==id));}catch(reason){setError(getApiErrorMessage(reason,"The resume could not be deleted."));}}
  return <div className="space-y-4">
    <div className="flex justify-end"><Link href="/employee/resume-builder/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-5 text-xs font-bold text-white shadow-sm">＋ Create New Resume</Link></div>
    {error&&<p className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="min-w-0 flex-1"><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search resumes by name or target role..." aria-label="Search saved resumes" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-blue-400"/></div><div className="flex flex-wrap gap-2"><button onClick={()=>setStatus("All")} className={`h-8 rounded-lg px-3 text-[10px] font-bold ${status==="All"?"bg-blue-50 text-blue-700":"text-slate-500"}`}>All ({resumes.length})</button><button onClick={()=>setStatus("Draft")} className={`h-8 rounded-lg px-3 text-[10px] font-bold ${status==="Draft"?"bg-blue-50 text-blue-700":"text-slate-500"}`}>Draft ({drafts})</button><button onClick={()=>setStatus("Completed")} className={`h-8 rounded-lg px-3 text-[10px] font-bold ${status==="Completed"?"bg-blue-50 text-blue-700":"text-slate-500"}`}>Completed ({completed})</button><select value={template} onChange={(event)=>setTemplate(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[10px]"><option>All Templates</option>{Array.from(new Set(resumes.map((item)=>item.template))).map((item)=><option key={item}>{item}</option>)}</select></div></div></div>
      {loading?<div className="grid min-h-64 place-items-center text-xs text-slate-500">Loading resumes…</div>:filtered.length===0?<div className="grid min-h-64 place-items-center text-center"><div><span className="text-3xl">▤</span><h3 className="mt-3 text-sm font-bold">No resumes found</h3><p className="mt-1 text-[10px] text-slate-500">Create a new resume or change your filters.</p></div></div>:<div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead><tr className="border-b border-slate-200 bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Resume name</th><th className="px-5 py-3">Target role</th><th className="px-5 py-3">Template</th><th className="px-5 py-3">Last updated</th><th className="px-5 py-3">Completion</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item)=><ResumeRow key={item.id} item={item} onDuplicate={()=>duplicate(item)} onDelete={()=>remove(item.id)}/>)}</tbody></table></div>}<div className="border-t border-slate-100 px-5 py-3 text-[9px] text-slate-500">Showing {filtered.length} of {resumes.length} resumes</div></section>
  </div>;
}

function ResumeRow({item,onDuplicate,onDelete}:{item:ResumeData;onDuplicate:()=>void;onDelete:()=>void}){const [menu,setMenu]=useState(false);return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">▤</span><strong className="max-w-52 text-[11px]">{item.title}</strong></div></td><td className="px-5 py-4 text-[10px] text-slate-600">{item.targetRole}</td><td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] text-slate-600">{item.template}</span></td><td className="px-5 py-4 text-[10px] text-slate-500">{new Date(item.updatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><b className="text-[10px]">{item.completion}%</b><span className="h-1.5 w-20 rounded-full bg-slate-100"><i className={`block h-full rounded-full ${item.completion===100?"bg-emerald-500":"bg-blue-600"}`} style={{width:`${item.completion}%`}}/></span></div></td><td className="px-5 py-4"><span className={`rounded-md px-2 py-1 text-[9px] font-bold ${item.status==="Completed"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{item.status}</span></td><td className="px-5 py-4"><div className="relative flex justify-end gap-2"><Link href={`/employee/resume-builder/${item.id}/edit`} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-bold text-blue-700">Edit</Link><button onClick={()=>setMenu((value)=>!value)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">•••</button>{menu&&<div className="absolute right-0 top-10 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><Link href={`/employee/resume-builder/${item.id}/edit?preview=1`} className="block rounded-lg px-3 py-2 text-[10px] hover:bg-slate-50">Preview</Link><button onClick={onDuplicate} className="block w-full rounded-lg px-3 py-2 text-left text-[10px] hover:bg-slate-50">Duplicate</button><button onClick={()=>window.print()} className="block w-full rounded-lg px-3 py-2 text-left text-[10px] hover:bg-slate-50">Download PDF</button><button onClick={onDelete} className="block w-full rounded-lg px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50">Delete</button></div>}</div></td></tr>}

const blankResume:ResumeData={id:null,title:"Untitled Resume",targetRole:"",template:"Modern ATS",status:"Draft",completion:0,updatedAt:"",fullName:"",email:"",phone:"",location:"",summary:"",jobTitle:"",company:"",period:"",experience:"",education:"",educationEntries:[],skills:"",skillItems:[],projects:"",projectEntries:[]};
const steps=["Personal","Summary","Experience","Education","Skills","Projects"] as const;
type Step=typeof steps[number];

export function ResumeBuilderEditor({resumeId}:{resumeId?:string}){
  const router=useRouter();
  const [data,setData]=useState<ResumeData>(blankResume);
  const [step,setStep]=useState<Step>("Personal");
  const [saved,setSaved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{if(!resumeId)return;let active=true;api.get<BuilderApiData>(`/api/resumes/builder/${resumeId}/`).then(({data:result})=>{if(active){setData(fromApi(result));setSaved(true);}}).catch((reason)=>{if(active)setError(getApiErrorMessage(reason,"This builder resume could not be loaded."));});return()=>{active=false;};},[resumeId]);
  function update<K extends keyof ResumeData>(key:K,value:ResumeData[K]){setSaved(false);setData((current)=>({...current,[key]:value}));}
  async function save(status:BuilderStatus){setBusy(true);setError("");try{const request=data.id===null?api.post<BuilderApiData>("/api/resumes/builder/",toApi(data,status)):api.patch<BuilderApiData>(`/api/resumes/builder/${data.id}/`,toApi(data,status));const {data:result}=await request;const savedResume=fromApi(result);setData(savedResume);setSaved(true);return savedResume;}catch(reason){setError(getApiErrorMessage(reason,"The resume could not be saved."));return null;}finally{setBusy(false);}}
  async function saveDraft(){const result=await save("Draft");if(result)router.push("/employee/resume-builder");}
  async function generate(event:FormEvent){event.preventDefault();if(!data.fullName||!data.email||!data.targetRole){setError("Add your name, email, and target role before generating the resume.");return;}await save("Completed");}
  return <main className="min-h-screen bg-slate-100 text-slate-950"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white"><div className="flex min-h-16 items-center gap-4 px-5"><Link href="/employee/resume-builder" className="font-bold text-blue-800">RESUMIND</Link><span className="text-slate-300">/</span><input value={data.title} onChange={(event)=>update("title",event.target.value)} className="h-10 min-w-0 max-w-md flex-1 rounded-lg border border-slate-200 px-3 text-xs font-bold"/><span className="ml-auto hidden text-[10px] text-emerald-600 sm:block">● {saved?"Saved just now":"Changes not saved"}</span><select value={data.template} onChange={(event)=>update("template",event.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-[10px]"><option>Modern ATS</option><option>Professional</option><option>ATS-Friendly Minimal</option><option>Modern Clean</option></select></div><nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-2">{steps.map((item)=><button key={item} onClick={()=>setStep(item)} className={`rounded-full px-4 py-2 text-[10px] font-bold ${step===item?"bg-blue-700 text-white":"bg-slate-50 text-slate-500"}`}>{item}</button>)}</nav></header>
    <form onSubmit={generate} className="grid min-h-[calc(100vh-113px)] lg:grid-cols-2"><section className="bg-white p-5 sm:p-8"><div className="mx-auto max-w-2xl">{error&&<p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}<p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">{step} details</p><h1 className="mt-1 text-xl font-bold">{stepTitle(step)}</h1><p className="mt-1 text-[10px] text-slate-500">Your changes appear immediately in the preview.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{stepFields(step,data,update)}</div></div><div className="sticky bottom-0 mt-8 flex items-center justify-between border-t border-slate-100 bg-white py-4"><button type="button" disabled={busy} onClick={saveDraft} className="h-10 rounded-lg border border-slate-200 px-5 text-xs font-bold text-slate-600 disabled:opacity-50">{busy?"Saving…":"Save as Draft"}</button><button type="submit" disabled={busy} className="h-10 rounded-lg bg-blue-700 px-6 text-xs font-bold text-white shadow-md disabled:opacity-50">{busy?"Saving…":"Generate Resume"}</button></div></section><section className="bg-slate-200 p-5 sm:p-8"><div className="mb-4 flex items-center justify-between"><div><span className="text-[9px] font-bold uppercase text-emerald-700">Live preview</span><p className="text-[10px] text-slate-500">Template: {data.template}</p></div><div className="flex gap-2"><button type="button" onClick={()=>window.print()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-bold">Download PDF</button><Link href="/employee/resume-analyzer/new" className="rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-bold text-white">Analyze</Link></div></div><ResumePreview data={data}/></section></form>
  </main>;
}

function stepTitle(step:Step){return ({Personal:"Personal Information",Summary:"Professional Summary",Experience:"Work Experience (Optional)",Education:"Education",Skills:"Skills",Projects:"Projects"})[step]}
function Input({label,value,onChange,wide=false}:{label:string;value:string;onChange:(value:string)=>void;wide?:boolean}){return <label className={wide?"sm:col-span-2":""}><span className="text-[10px] font-bold text-slate-700">{label}</span><input value={value} onChange={(event)=>onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/></label>}
function Area({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <label className="sm:col-span-2"><span className="text-[10px] font-bold text-slate-700">{label}</span><textarea value={value} onChange={(event)=>onChange(event.target.value)} className="mt-1.5 h-40 w-full resize-none rounded-lg border border-slate-200 p-3 text-xs leading-5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/></label>}
function stepFields(step:Step,data:ResumeData,update:<K extends keyof ResumeData>(key:K,value:ResumeData[K])=>void){if(step==="Personal")return <><Input label="Resume title" value={data.title} onChange={(value)=>update("title",value)} wide/><Input label="Full name *" value={data.fullName} onChange={(value)=>update("fullName",value)}/><Input label="Target role *" value={data.targetRole} onChange={(value)=>update("targetRole",value)}/><Input label="Email *" value={data.email} onChange={(value)=>update("email",value)}/><Input label="Phone" value={data.phone} onChange={(value)=>update("phone",value)}/><Input label="Location" value={data.location} onChange={(value)=>update("location",value)} wide/></>;if(step==="Summary")return <SummaryFields data={data} onChange={(value)=>update("summary",value)}/>;if(step==="Experience")return <><p className="sm:col-span-2 text-[10px] text-slate-500">You can skip this section if you do not have work experience yet.</p><Input label="Job title (optional)" value={data.jobTitle} onChange={(value)=>update("jobTitle",value)}/><Input label="Company (optional)" value={data.company} onChange={(value)=>update("company",value)}/><Input label="Date period (optional)" value={data.period} onChange={(value)=>update("period",value)} wide/><Area label="Responsibilities and measurable results (optional)" value={data.experience} onChange={(value)=>update("experience",value)}/></>;if(step==="Education")return <EducationFields entries={data.educationEntries} onChange={(entries)=>update("educationEntries",entries)}/>;if(step==="Skills")return <SkillsFields skills={data.skillItems} onChange={(skills)=>update("skillItems",skills)}/>;return <ProjectsFields projects={data.projectEntries} onChange={(projects)=>update("projectEntries",projects)}/>}

function SummaryFields({data,onChange}:{data:ResumeData;onChange:(value:string)=>void}){
  const [generating,setGenerating]=useState(false);
  const [error,setError]=useState("");
  async function generate(){setGenerating(true);setError("");try{const legacySkills=data.skills.split(",").map((item)=>item.trim()).filter(Boolean);const projectContext=data.projectEntries.length?data.projectEntries.map((item)=>`${item.name}: ${item.description} (${item.technologies})`).join("\n"):data.projects;const {data:result}=await api.post<{summary:string}>("/api/resumes/builder/generate-professional-summary/",{target_role:data.targetRole,skills:data.skillItems.length?data.skillItems:legacySkills,experience:data.experience,projects:projectContext,current_summary:data.summary});onChange(result.summary);}catch(reason){setError(getApiErrorMessage(reason,"The AI summary could not be generated. Add your target role or skills first."));}finally{setGenerating(false);}}
  return <div className="sm:col-span-2"><div className="flex items-end justify-between gap-3"><div><span className="text-[10px] font-bold text-slate-700">Professional summary</span><p className="mt-1 text-[9px] text-slate-500">Write it yourself or generate a focused summary from your resume details.</p></div><button type="button" onClick={generate} disabled={generating} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 text-[10px] font-bold text-violet-700 shadow-sm hover:bg-violet-100 disabled:opacity-50"><span>✦</span>{generating?"Generating…":"Generate with AI"}</button></div><textarea value={data.summary} onChange={(event)=>onChange(event.target.value)} placeholder="Add a short summary of your background, skills, and career goal." className="mt-3 h-48 w-full resize-none rounded-lg border border-slate-200 p-3 text-xs leading-5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/>{error&&<p className="mt-2 text-[10px] text-red-600">{error}</p>}<p className="mt-2 text-[9px] text-slate-400">Review and edit the generated summary before saving your resume.</p></div>;
}

function EducationFields({entries,onChange}:{entries:EducationEntry[];onChange:(entries:EducationEntry[])=>void}){
  const educationTypes=["Secondary School","High School / Senior Secondary","Diploma","Bachelor's Degree","Master's Degree","Doctorate / PhD","Professional Certification","Other"];
  const emptyEntry={educationType:"High School / Senior Secondary",degree:"",field:"",institution:"",startYear:"",endYear:""};
  // Show one usable form immediately; it becomes real saved data as soon as
  // the user changes any field.
  const visibleEntries=entries.length?entries:[emptyEntry];
  const add=()=>onChange([...visibleEntries,{...emptyEntry}]);
  const updateEntry=(index:number,key:keyof EducationEntry,value:string)=>onChange(visibleEntries.map((entry,itemIndex)=>itemIndex===index?{...entry,[key]:value}:entry));
  const remove=(index:number)=>onChange(visibleEntries.filter((_,itemIndex)=>itemIndex!==index));
  return <div className="space-y-4 sm:col-span-2"><div className="flex items-center justify-between"><p className="text-[10px] text-slate-500">Add school, college, degree, diploma, or certification details.</p><button type="button" onClick={add} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">＋ Add another</button></div>{visibleEntries.map((entry,index)=><div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><strong className="text-xs">Education {index+1}</strong>{entries.length>0&&<button type="button" onClick={()=>remove(index)} className="text-[10px] font-bold text-red-600">Remove</button>}</div><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-[10px] font-bold text-slate-700">Education type</span><select value={entry.educationType} onChange={(event)=>updateEntry(index,"educationType",event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">{educationTypes.map((type)=><option key={type}>{type}</option>)}</select></label><Input label="Degree, class or qualification" value={entry.degree} onChange={(value)=>updateEntry(index,"degree",value)}/><Input label="Field, stream or board" value={entry.field} onChange={(value)=>updateEntry(index,"field",value)}/><Input label="School, college or university" value={entry.institution} onChange={(value)=>updateEntry(index,"institution",value)} wide/><Input label="Start year" value={entry.startYear} onChange={(value)=>updateEntry(index,"startYear",value)}/><Input label="End year or expected" value={entry.endYear} onChange={(value)=>updateEntry(index,"endYear",value)}/></div></div>)}</div>;
}

function SkillsFields({skills,onChange}:{skills:string[];onChange:(skills:string[])=>void}){
  const [value,setValue]=useState("");
  function add(){const skill=value.trim();if(!skill||skills.some((item)=>item.toLowerCase()===skill.toLowerCase()))return;onChange([...skills,skill]);setValue("");}
  return <div className="sm:col-span-2"><span className="text-[10px] font-bold text-slate-700">Add skills</span><div className="mt-1.5 flex gap-2"><input value={value} onChange={(event)=>setValue(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"){event.preventDefault();add();}}} placeholder="For example: Python" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/><button type="button" onClick={add} className="rounded-lg bg-blue-700 px-4 text-[10px] font-bold text-white">Add skill</button></div><p className="mt-2 text-[9px] text-slate-500">Press Enter or use Add skill. Select × to remove a skill.</p><div className="mt-4 flex min-h-20 flex-wrap content-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">{skills.length===0?<span className="text-[10px] text-slate-400">Your added skills will appear here.</span>:skills.map((skill)=><span key={skill} className="inline-flex h-8 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-[10px] font-semibold text-blue-700">{skill}<button type="button" onClick={()=>onChange(skills.filter((item)=>item!==skill))} aria-label={`Remove ${skill}`} className="font-bold">×</button></span>)}</div></div>;
}

function ProjectsFields({projects,onChange}:{projects:ProjectEntry[];onChange:(projects:ProjectEntry[])=>void}){
  const emptyProject={name:"",technologies:"",description:"",link:""};
  const visibleProjects=projects.length?projects:[emptyProject];
  const add=()=>onChange([...visibleProjects,{...emptyProject}]);
  const updateProject=(index:number,key:keyof ProjectEntry,value:string)=>onChange(visibleProjects.map((project,itemIndex)=>itemIndex===index?{...project,[key]:value}:project));
  const remove=(index:number)=>onChange(visibleProjects.filter((_,itemIndex)=>itemIndex!==index));
  return <div className="space-y-4 sm:col-span-2"><div className="flex items-center justify-between"><p className="text-[10px] text-slate-500">Add projects individually so recruiters can scan them easily.</p><button type="button" onClick={add} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">＋ Add another project</button></div>{visibleProjects.map((project,index)=><div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><strong className="text-xs">Project {index+1}</strong>{projects.length>0&&<button type="button" onClick={()=>remove(index)} className="text-[10px] font-bold text-red-600">Remove</button>}</div><div className="grid gap-4 sm:grid-cols-2"><Input label="Project name" value={project.name} onChange={(value)=>updateProject(index,"name",value)}/><Input label="Technologies used" value={project.technologies} onChange={(value)=>updateProject(index,"technologies",value)}/><Input label="Project link (optional)" value={project.link} onChange={(value)=>updateProject(index,"link",value)} wide/><label className="sm:col-span-2"><span className="text-[10px] font-bold text-slate-700">Description and achievements</span><textarea value={project.description} onChange={(event)=>updateProject(index,"description",event.target.value)} placeholder="Describe what you built, your contribution, and the result." className="mt-1.5 h-32 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"/></label></div></div>)}</div>;
}
function ResumePreview({data}:{data:ResumeData}){
  const contact=[data.email,data.phone,data.location].filter(Boolean).join("  •  ");
  const displayedSkills=data.skillItems.length?data.skillItems.join("  •  "):data.skills;
  // Keep every resume section visible so the preview also acts as a clear
  // checklist while the user moves through the builder steps.
  return <article className="mx-auto min-h-[900px] max-w-[700px] bg-white px-10 py-12 shadow-lg sm:px-14">
    <header className="border-b-2 border-slate-900 pb-6 text-center"><h1 className="font-serif text-3xl font-bold uppercase tracking-wide">{data.fullName||"Your Name"}</h1><p className="mt-2 text-sm font-semibold text-blue-700">{data.targetRole||"Target Role"}</p></header>
    <PreviewSection title="Personal Details"><p>{contact||"Add your email, phone number, and location."}</p></PreviewSection>
    <PreviewSection title="Professional Summary"><p>{data.summary||"Add a focused professional summary highlighting your background, skills, and strongest value."}</p></PreviewSection>
    <PreviewSection title="Work Experience (Optional)">{data.jobTitle||data.company||data.period||data.experience?<><div className="flex justify-between gap-4"><div><b>{data.company}</b><i className="block">{data.jobTitle}</i></div><span>{data.period}</span></div>{data.experience&&<ul className="mt-2 list-disc space-y-1 pl-5">{data.experience.split("\n").filter(Boolean).map((item)=><li key={item}>{item}</li>)}</ul>}</>:<p>Add work experience if applicable, or leave this optional section empty.</p>}</PreviewSection>
    <PreviewSection title="Education">{data.educationEntries.length?data.educationEntries.map((entry,index)=><div key={index} className={index?"mt-3":""}><div className="flex justify-between gap-4"><b>{entry.degree||entry.educationType}{entry.degree&&entry.field&&` in ${entry.field}`}</b><span>{[entry.startYear,entry.endYear].filter(Boolean).join(" – ")}</span></div>{entry.degree&&<i className="block">{entry.educationType}</i>}<p>{entry.institution}</p></div>):<p>{data.education||"Add your school, college, degree, diploma, or certification details."}</p>}</PreviewSection>
    <PreviewSection title="Skills"><p>{displayedSkills||"Add your technical and professional skills."}</p></PreviewSection>
    <PreviewSection title="Projects">{data.projectEntries.length?data.projectEntries.map((project,index)=><div key={index} className={index?"mt-3":""}><div className="flex justify-between gap-4"><b>{project.name}</b>{project.link&&<span>{project.link}</span>}</div>{project.technologies&&<i className="block">{project.technologies}</i>}<p>{project.description}</p></div>):<p>{data.projects||"Add projects with their technologies, your contribution, and outcomes."}</p>}</PreviewSection>
  </article>;
}
function PreviewSection({title,children}:{title:string;children:React.ReactNode}){return <section className="mt-6 text-[11px] leading-5 text-slate-700"><h2 className="mb-2 border-b border-slate-300 pb-1 font-serif text-sm font-bold uppercase tracking-wider text-slate-950">{title}</h2>{children}</section>}
