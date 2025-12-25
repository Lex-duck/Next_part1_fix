export type ProjectStatus = "ajanlat" | "folyamatban" | "zart";

export type Project = {
  id: string;
  name: string;
  company: string;
  owner: string;
  deadline?: string;
  status: ProjectStatus;
  description?: string;
  signed: boolean;
  invoiceIssued: boolean;
  signedFilePath?: string | null;
  signedOfferVersion?: number | null;
  invoiceFilePath?: string | null;
  projectValueHuf?: number;
};
