import { client } from "@frontend/client";
import { createSignal } from "solid-js";

import type { Project } from "@backend/schemas/Project";

export function createProjectStore() {
  const [projects, setProjects] = createSignal<Project[]>([]);

  async function loadProjects() {
    const result = await client.api.projects.get();
    if (result.error) {
      throw new Error("Failed to load projects");
    }
    setProjects(result.data);
  }
  loadProjects();

  async function createProject(p: Project) {
    setProjects((prev) => [...prev, p]);
    return p;
  }

  async function updateProject(project: Project) {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
  }

  async function deleteProject(id: string) {
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
