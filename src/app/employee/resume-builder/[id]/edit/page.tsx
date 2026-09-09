import { ResumeBuilderEditor } from "../../../../components/resume-builder";

export default async function EditResumePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <ResumeBuilderEditor resumeId={id}/>;
}
