/**
 * Default compliance checklists by company type.
 * Informational only — the disclaimer applies.
 *
 * Categories: incorporation, tax, employment, annual, data_privacy
 */

interface ChecklistItem {
  title: string;
  description: string;
  category: string;
}

const PRIVATE_LIMITED: ChecklistItem[] = [
  // Incorporation
  {
    title: "Obtain Digital Signature Certificate (DSC)",
    description: "Required for all directors before filing any MCA forms. Apply via authorized CAs.",
    category: "incorporation",
  },
  {
    title: "Apply for Director Identification Number (DIN)",
    description: "Unique identification number for every proposed director. Part of SPICe+ flow.",
    category: "incorporation",
  },
  {
    title: "Reserve Company Name (RUN / SPICe+ Part A)",
    description: "Apply for name reservation via the RUN service or SPICe+ Part A on MCA portal.",
    category: "incorporation",
  },
  {
    title: "File SPICe+ Part B (Incorporation)",
    description: "Combined form for incorporation, PAN, TAN, EPFO, ESIC, and bank account opening.",
    category: "incorporation",
  },
  {
    title: "Draft MoA and AoA",
    description: "Memorandum and Articles of Association defining the company's objectives and rules.",
    category: "incorporation",
  },
  // Tax
  {
    title: "Obtain PAN",
    description: "Permanent Account Number — automatically allotted via SPICe+. Verify after incorporation.",
    category: "tax",
  },
  {
    title: "Obtain TAN",
    description: "Tax Deduction Account Number for TDS compliance. Also allotted via SPICe+.",
    category: "tax",
  },
  {
    title: "GST Registration",
    description: "Required if turnover exceeds ₹20L (services) or ₹40L (goods). Apply on GST portal.",
    category: "tax",
  },
  {
    title: "Professional Tax Registration",
    description: "State-level tax on employment. Rules vary by state — check your state's threshold.",
    category: "tax",
  },
  // Employment
  {
    title: "Shops & Establishment Act Registration",
    description: "Register with the local municipal authority within 30 days of starting business.",
    category: "employment",
  },
  {
    title: "EPF Registration (≥ 20 employees)",
    description: "Mandatory for establishments with 20+ employees. Register on EPFO portal.",
    category: "employment",
  },
  {
    title: "ESIC Registration (≥ 10 employees)",
    description: "Mandatory for establishments with 10+ employees where wages ≤ ₹21,000/month.",
    category: "employment",
  },
  // Annual
  {
    title: "DIR-3 KYC (Annual)",
    description: "All directors must file DIR-3 KYC every year by September 30. ₹5,000 penalty if late.",
    category: "annual",
  },
  {
    title: "File AOC-4 (Financial Statements)",
    description: "Annual filing of balance sheet and P&L within 30 days of AGM.",
    category: "annual",
  },
  {
    title: "File MGT-7 (Annual Return)",
    description: "Annual return to be filed within 60 days of AGM.",
    category: "annual",
  },
  // Data Privacy
  {
    title: "DPDP Act — Consent Mechanism",
    description: "Set up valid consent collection for processing personal data of users/employees.",
    category: "data_privacy",
  },
  {
    title: "DPDP Act — Data Protection Officer",
    description: "Appoint a DPO if classified as a Significant Data Fiduciary by the Central Government.",
    category: "data_privacy",
  },
  {
    title: "DPDP Act — Breach Reporting",
    description: "Establish a process to notify the Data Protection Board of personal data breaches.",
    category: "data_privacy",
  },
];

const LLP: ChecklistItem[] = [
  { title: "Obtain DSC for Designated Partners", description: "Digital Signature Certificate for all designated partners.", category: "incorporation" },
  { title: "Apply for DPIN", description: "Designated Partner Identification Number for each partner.", category: "incorporation" },
  { title: "Reserve LLP Name (RUN-LLP)", description: "Name reservation on MCA portal.", category: "incorporation" },
  { title: "File FiLLiP (Incorporation)", description: "Form for incorporation of LLP with MCA.", category: "incorporation" },
  { title: "Draft LLP Agreement", description: "Partnership agreement defining rights, duties, and profit-sharing.", category: "incorporation" },
  { title: "Obtain PAN & TAN", description: "Apply separately after incorporation.", category: "tax" },
  { title: "GST Registration", description: "Required if turnover exceeds threshold.", category: "tax" },
  { title: "File Form 8 (Statement of Account)", description: "Annual filing within 30 days of end of financial year.", category: "annual" },
  { title: "File Form 11 (Annual Return)", description: "Annual return within 60 days of end of financial year.", category: "annual" },
];

const SOLE_PROP: ChecklistItem[] = [
  { title: "Udyam Registration (MSME)", description: "Register as a micro/small enterprise on Udyam portal.", category: "incorporation" },
  { title: "Obtain PAN (Proprietor)", description: "Proprietor's PAN serves as the business PAN.", category: "tax" },
  { title: "GST Registration", description: "Required if turnover exceeds threshold or for interstate supply.", category: "tax" },
  { title: "Shops & Establishment Act", description: "Register with local authority.", category: "employment" },
  { title: "Income Tax Return (ITR)", description: "File annual ITR as individual with business income.", category: "annual" },
];

const checklists: Record<string, ChecklistItem[]> = {
  private_limited: PRIVATE_LIMITED,
  llp: LLP,
  sole_prop: SOLE_PROP,
  partnership: LLP, // Similar requirements
  opc: PRIVATE_LIMITED, // OPC follows Pvt Ltd compliance with minor differences
};

/**
 * Get default compliance checklist for a company type.
 * Falls back to private_limited if type is unknown.
 */
export function getDefaultChecklist(companyType?: string | null): ChecklistItem[] {
  return checklists[companyType || "private_limited"] || PRIVATE_LIMITED;
}
