import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Project } from "@backend/schemas/Project";

import { useFilterStore } from "./filterStore";

function createProjectStore() {
  const [map, setMap] = createStore({} as Record<string, Project | undefined>);

  const projects = createMemo(() => {
    return Object.values(map)
      .filter((p): p is Project => p !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
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

  const filteredProjects = createMemo(() => {
    const filter = useFilterStore().filter();
    return projects().filter(
      (p) =>
        !filter.projectIds ||
        filter.projectIds.length === 0 ||
        filter.projectIds.includes(p.id)
    );
  });

  return {
    projects,
    setProject,
    deleteProject,
    getProject,
    filteredProjects,
  };
}

export const useProjectStore = singulation(createProjectStore);
