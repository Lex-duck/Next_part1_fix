export type Offer = {
  id?: string;
  projectId: string;
  version: number;
  createdAt: string;
  data: Record<string, any>;
  finalDocHtml: string;
};
