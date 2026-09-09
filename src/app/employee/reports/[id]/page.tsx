import { ResumeReportDetail } from "../../../components/resume-report-detail";

export default async function ResumeReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResumeReportDetail id={id} />;
}
