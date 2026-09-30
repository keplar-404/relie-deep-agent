export interface ProjectRecord {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  agentCount: number;
  updatedAt: string;
  image?: string | null;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  image?: string;
}
