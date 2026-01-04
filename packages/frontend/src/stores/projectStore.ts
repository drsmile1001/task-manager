import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Project } from "@backend/schemas/Project";

function createProjectStore() {
  const [map, setMap] = createStore({} as Record<string, Project | undefined>);

  const projects = createMemo(() => {
    return Object.values(map)
      .filter((p): p is Project => p !== undefined)
      .sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return a.name.localeCompare(b.name);
      });
  });

  async function loadProjects() {
    const result = await client.api.projects.get();
    if (result.error) {
      throw new Error("Failed to load projects");
    }
    setMap(
      Object.fromEntries(result.data.map((project) => [project.id, project]))
    );
  }
  loadProjects();

  async function setProject(project: Project) {
    setMap(project.id, project);
  }

  async function deleteProject(id: string) {
    setMap(id, undefined);
  }

  function getProject(id: string): Project | undefined {
    return map[id];
  }

  const nonArchivedProjects = createMemo(() => {
    return projects().filter((p) => !p.isArchived);
  });

  return {
    projects,
    setProject,
    deleteProject,
    getProject,
    nonArchivedProjects,
  };
}

export const useProjectStore = singulation(createProjectStore);
