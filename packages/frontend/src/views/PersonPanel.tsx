import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Input from "@frontend/components/Input";
import Panel, { PanelList } from "@frontend/components/Panel";
import { usePersonStore } from "@frontend/stores/personStore";
import { debounce } from "lodash";
import { createEffect } from "solid-js";
import { ulid } from "ulid";

import type { Person } from "@backend/schemas/Person";

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

  function handleUpdatePerson(personId: string, update: Partial<Person>) {
    client.api.persons({ id: personId }).patch(update);
  }

  function handleDeletePerson(personId: string) {
    client.api.persons({ id: personId }).delete();
  }

  return (
    <Panel
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
              onInput={debounce(
                (e) =>
                  handleUpdatePerson(person.id, {
                    name: e.currentTarget.value,
                  }),
                300
              )}
              placeholder="人員名稱"
            />
            <Input
              class="w-20"
              type="number"
              min="1"
              value={person.order ?? ""}
              onInput={(e) => {
                const value = e.currentTarget.value;
                handleUpdatePerson(person.id, {
                  order: value ? parseInt(value) : null,
                });
              }}
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
    </Panel>
  );
}
