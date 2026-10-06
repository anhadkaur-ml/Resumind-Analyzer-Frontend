import { EmployeeSection } from "../../components/employee-section";

const sections = ["reports", "compare-resumes", "resume-builder", "interview-practice", "copilot", "settings", "help"] as const;
type Section = (typeof sections)[number];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default async function EmployeeSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <EmployeeSection section={(sections.includes(section as Section) ? section : "reports") as Section} />;
}
