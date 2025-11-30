import type { Project } from "../domain/project";

export interface ProjectRepository {
  getAll(): Project[];
  saveAll(projects: Project[]): void;
}

export class LocalStorageProjectRepository implements ProjectRepository {
  key = "projects";
  constructor() {}

  getAll(): Project[] {
    const json = localStorage.getItem(this.key);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error("Failed to parse projects", e);
      return [];
    }
  }

  saveAll(projects: Project[]): void {
    localStorage.setItem(this.key, JSON.stringify(projects));
  }
}
