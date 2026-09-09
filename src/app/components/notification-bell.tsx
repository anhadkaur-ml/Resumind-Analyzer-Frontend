"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Notification = { id:number; title:string; message:string; kind:string; link:string; is_read:boolean; created_at:string };
type NotificationResponse = { unread_count:number; results:Notification[] };

export function NotificationBell() {
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<Notification[]>([]);
  const [unread,setUnread]=useState(0);
  const [loading,setLoading]=useState(false);

  async function load(){setLoading(true);try{const {data}=await api.get<NotificationResponse>("/api/auth/notifications/");setItems(data.results);setUnread(data.unread_count);}finally{setLoading(false);}}
  useEffect(()=>{let active=true;api.get<NotificationResponse>("/api/auth/notifications/").then(({data})=>{if(active){setItems(data.results);setUnread(data.unread_count);}}).catch(()=>undefined);return()=>{active=false;};},[]);
  async function toggle(){const next=!open;setOpen(next);if(next)await load();}
  async function markAll(){await api.post("/api/auth/notifications/read-all/");setItems((current)=>current.map((item)=>({...item,is_read:true})));setUnread(0);}
  async function select(item:Notification){if(!item.is_read){await api.patch(`/api/auth/notifications/${item.id}/read/`);setUnread((count)=>Math.max(0,count-1));}setOpen(false);if(item.link)router.push(item.link);}

  return <div className="relative"><button type="button" onClick={()=>void toggle()} aria-label={`Notifications${unread?` (${unread} unread)`:""}`} aria-expanded={open} className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><BellIcon/>{unread>0&&<span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full border-2 border-white bg-blue-600 px-1 text-[7px] font-bold leading-3 text-white">{unread>9?"9+":unread}</span>}</button>{open&&<div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><strong className="block text-sm">Notifications</strong><span className="text-[9px] text-slate-400">{unread?`${unread} unread`:"You are all caught up"}</span></div>{unread>0&&<button type="button" onClick={()=>void markAll()} className="text-[9px] font-bold text-blue-700">Mark all read</button>}</div><div className="max-h-80 overflow-y-auto">{loading&&items.length===0?<p className="px-4 py-8 text-center text-[10px] text-slate-400">Loading notifications...</p>:items.length===0?<p className="px-4 py-8 text-center text-[10px] text-slate-400">No notifications yet.</p>:items.map((item)=><button key={item.id} type="button" onClick={()=>void select(item)} className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${item.is_read?"":"bg-blue-50/60"}`}><span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm"><DocumentIcon/></span><span className="min-w-0 flex-1"><span className="flex items-start gap-2"><strong className="flex-1 text-[10px] leading-4">{item.title}</strong>{!item.is_read&&<i className="mt-1 size-1.5 rounded-full bg-blue-600"/>}</span><span className="mt-1 block text-[9px] leading-4 text-slate-500">{item.message}</span><time className="mt-1 block text-[8px] text-slate-400">{new Date(item.created_at).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></span></button>)}</div></div>}</div>;
}
function BellIcon(){return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 19h4"/></svg>}
function DocumentIcon(){return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>}
