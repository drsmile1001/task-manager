import { client } from "@frontend/client";
import { usePersonStore } from "@frontend/stores/personStore";
import { createEffect } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel, { PanelList } from "./DetailPanel";
import Input from "./Input";

export default function PersonPanel() {
  const { persons } = usePersonStore();
  const nameInputRefs = new Map<string, HTMLInputElement>();
  let toFocusUserId: string | null = null;
  async function createPerson() {
    const userId = ulid();
    toFocusUserId = userId;
    await client.api.persons.post({
      id: userId,
      name: "新成員",
      order: undefined,
    });
  }

  createEffect(() => {
    persons();
    if (toFocusUserId) {
      const inputRef = nameInputRefs.get(toFocusUserId);
      if (inputRef) {
        inputRef.focus();
        toFocusUserId = null;
      }
    }
  });

  function setPersonName(personId: string, name: string) {
    client.api.persons({ id: personId }).patch({
      name,
    });
  }

  function setPersonOrder(personId: string, order: string) {
    const orderNumber = order ? parseInt(order) : null;
    client.api.persons({ id: personId }).patch({
      order: orderNumber,
    });
  }

  function handleDeletePerson(personId: string) {
    client.api.persons({ id: personId }).delete();
  }

  return (
    <DetailPanel
      title="人員"
      actions={
        <div class="flex items-center justify-between">
          <div></div>
          <Button variant="secondary" size="small" onclick={createPerson}>
            + 新增
          </Button>
        </div>
      }
    >
      <PanelList items={persons}>
        {(person) => (
          <>
            <Input
              ref={(el) => nameInputRefs.set(person.id, el)}
              class="flex-1"
              value={person.name}
              onBlur={(e) => setPersonName(person.id, e.currentTarget.value)}
              placeholder="人員名稱"
            />
            <Input
              class="w-20"
              type="number"
              min="1"
              value={person.order ?? ""}
              onInput={(e) => setPersonOrder(person.id, e.currentTarget.value)}
              placeholder="排序"
            />
            <Button
              variant="danger"
              size="small"
              onClick={() => handleDeletePerson(person.id)}
            >
              刪除
            </Button>
          </>
        )}
      </PanelList>
    </DetailPanel>
  );
}
