import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Milestone } from "@backend/schemas/Milestone";

function createMilestoneStore() {
  const [map, setMap] = createStore(
    {} as Record<string, Milestone | undefined>
  );

  const byProjectId = createMemo(() => {
    const result: Record<string, Milestone[]> = {};
    for (const milestone of Object.values(map)) {
      if (!milestone) continue;
      if (!result[milestone.projectId]) {
        result[milestone.projectId] = [];
      }
      result[milestone.projectId].push(milestone);
    }
    return result;
  });

  async function loadMilestones() {
    const result = await client.api.milestones.get();
    if (result.error) {
      throw new Error("Failed to load milestones");
    }
    setMap(
      Object.fromEntries(
        result.data.map((milestone) => [
          milestone.id,
          {
            ...milestone,
            dueDate:
              (milestone.dueDate as unknown as Date | null)
                ?.toISOString()
                .split("T")[0] ?? null,
          },
        ])
      )
    );
  }
  loadMilestones();

  async function setMilestone(milestone: Milestone) {
    setMap(milestone.id, milestone);
  }

  async function deleteMilestone(id: string) {
    setMap(id, undefined);
  }

  function getMilestone(id: string): Milestone | undefined {
    return map[id];
  }

  function getMilestonesByProjectId(projectId: string): Milestone[] {
    return (byProjectId()[projectId] ?? []).sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).valueOf() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).valueOf() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return a.name.localeCompare(b.name);
    });
  }

  function milestones(): Milestone[] {
    return Object.values(map).filter(
      (milestone): milestone is Milestone => milestone !== undefined
    );
  }

  return {
    milestones,
    setMilestone,
    deleteMilestone,
    getMilestone,
    getMilestonesByProjectId,
  };
}

export const useMilestoneStore = singulation(createMilestoneStore);
