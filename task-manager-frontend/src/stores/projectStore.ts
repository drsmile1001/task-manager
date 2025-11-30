import { createSignal, createEffect } from "solid-js";
import type { Project } from "../domain/project";
import {
  type ProjectRepository,
  LocalStorageProjectRepository,
} from "../repositories/ProjectRepository";

export function createProjectStore(
  repo: ProjectRepository = new LocalStorageProjectRepository()
) {
  const [projects, setProjects] = createSignal<Project[]>(repo.getAll());

  // persist
  createEffect(() => {
    repo.saveAll(projects());
  });

  function createProject(input: Omit<Project, "id">) {
    const id = crypto.randomUUID();
    const p: Project = { id, ...input };
    setProjects((prev) => [...prev, p]);
    return p;
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function getProject(id: string) {
    return projects().find((p) => p.id === id);
  }

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
  };
}

export type ProjectStore = ReturnType<typeof createProjectStore>;
