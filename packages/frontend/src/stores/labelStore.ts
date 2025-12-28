import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Label } from "@backend/schemas/Label";

export function getLabelTextColor(backgroundColor: string): string {
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 125 ? "#000000" : "#FFFFFF";
}

function createLabelStore() {
  const [map, setMap] = createStore({} as Record<string, Label | undefined>);
  const labels = createMemo(() => {
    const labels = Object.values(map).filter(
      (label): label is Label => label !== undefined
    );
    labels.sort((a, b) => {
      const ap = a.priority ?? Number.MAX_SAFE_INTEGER;
      const bp = b.priority ?? Number.MAX_SAFE_INTEGER;
      if (ap !== bp) {
        return ap - bp;
      }
      return a.name.localeCompare(b.name);
    });
    return labels;
  });

  async function loadLabels() {
    const result = await client.api.labels.get();
    if (result.error) {
      throw new Error("Failed to load projects");
    }
    setMap(Object.fromEntries(result.data.map((label) => [label.id, label])));
  }
  loadLabels();

  function getLabel(id: string): Label | undefined {
    return map[id];
  }

  function setLabel(label: Label) {
    setMap(label.id, label);
  }

  function deleteLabel(id: string) {
    setMap(id, undefined);
  }

  return {
    labels,
    setLabel,
    deleteLabel,
    getLabel,
  };
}

export const useLabelStore = singulation(createLabelStore);
