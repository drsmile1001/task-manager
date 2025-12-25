import { client } from "@frontend/client";
import { createSignal } from "solid-js";

import type { Label } from "@backend/schemas/Label";

export function getLabelTextColor(backgroundColor: string): string {
  const r = parseInt(backgroundColor.slice(1, 3), 16);
  const g = parseInt(backgroundColor.slice(3, 5), 16);
  const b = parseInt(backgroundColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 125 ? "#000000" : "#FFFFFF";
}

function createLabelStore() {
  const [labels, setLabels] = createSignal<Label[]>([]);

  async function loadLabels() {
    const result = await client.api.labels.get();
    if (result.error) {
      throw new Error("Failed to load projects");
    }
    setLabels(result.data);
  }
  loadLabels();

  function createLabel(label: Label) {
    const newLabels = [...labels(), label];
    newLabels.sort((a, b) => {
      return (
        (a.priority ?? Number.MAX_SAFE_INTEGER) -
        (b.priority ?? Number.MAX_SAFE_INTEGER)
      );
    });
    setLabels(newLabels);
  }

  function updateLabel(updatedLabel: Label) {
    const newLabels = labels().map((label) =>
      label.id === updatedLabel.id ? updatedLabel : label
    );
    newLabels.sort((a, b) => {
      return (
        (a.priority ?? Number.MAX_SAFE_INTEGER) -
        (b.priority ?? Number.MAX_SAFE_INTEGER)
      );
    });
    setLabels(newLabels);
  }

  function deleteLabel(id: string) {
    setLabels(labels().filter((label) => label.id !== id));
  }

  return {
    labels,
    createLabel,
    updateLabel,
    deleteLabel,
  };
}

export const labelStore = createLabelStore();
