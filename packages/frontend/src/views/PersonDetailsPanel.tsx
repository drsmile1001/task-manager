import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import { Input, baseInputClass } from "@frontend/components/Input";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { usePersonStore } from "@frontend/stores/personStore";
import { onMount } from "solid-js";

import type { Person } from "@backend/schemas/Person";

export type PersonDetailsPanelProps = {
  personId: string;
};

export default function PersonDetailsPanel(props: PersonDetailsPanelProps) {
  const { popPanel } = usePanelController();
  const { getPerson } = usePersonStore();
  const person = () => getPerson(props.personId!);
  let nameInputRef: HTMLInputElement | undefined;
  onMount(() => {
    nameInputRef?.focus();
  });

  function handleUpdatePerson(update: Partial<Person>) {
    client.api.persons({ id: props.personId! }).patch(update);
  }

  async function removePerson() {
    await client.api.persons({ id: props.personId! }).delete();
    popPanel();
  }

  return (
    <Panel title={`人員詳情 - ${person()?.name || ""}`}>
      <PanelSections>
        <SectionLabel>名稱</SectionLabel>
        <Input
          ref={nameInputRef}
          value={person()?.name}
          onConfirm={(value) =>
            handleUpdatePerson({
              name: value,
            })
          }
        />

        <SectionLabel>排序</SectionLabel>
        <input
          class={baseInputClass}
          type="number"
          min="1"
          value={person()?.order ?? ""}
          onInput={(e) => {
            const value = e.currentTarget.value;
            handleUpdatePerson({ order: value ? parseInt(value) : null });
          }}
        />

        <SectionLabel>Email</SectionLabel>
        <Input
          type="email"
          value={person()?.email ?? ""}
          onConfirm={(value) =>
            handleUpdatePerson({
              email: value,
            })
          }
        />

        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
          <Button variant="danger" onclick={removePerson}>
            刪除
          </Button>
        </div>
      </PanelSections>
    </Panel>
  );
}
