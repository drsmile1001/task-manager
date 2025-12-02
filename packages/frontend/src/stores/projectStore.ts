import { client } from "@frontend/client";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

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

  async function createProject(input: Omit<Project, "id">) {
    const id = ulid();
    const p: Project = { id, ...input };
    const result = await client.api.projects.post(p);
    if (result.error) {
      throw new Error("Failed to create project");
    }
    setProjects((prev) => [...prev, p]);
    return p;
  }

  async function updateProject(id: string, patch: Partial<Project>) {
    const result = await client.api.projects({ id }).patch(patch);
    if (result.error) {
      throw new Error("Failed to update project");
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  async function deleteProject(id: string) {
    const result = await client.api.projects({ id }).delete();
    if (result.error) {
      throw new Error("Failed to delete project");
    }
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
