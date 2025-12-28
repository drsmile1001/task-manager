import { client } from "@frontend/client";
import { usePersonStore } from "@frontend/stores/personStore";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type PersonPanelProps = {
  onClose: () => void;
};

export default function PersonPanel(props: PersonPanelProps) {
  const persons = () => usePersonStore().persons();

  async function createPerson() {
    await client.api.persons.post({
      id: ulid(),
      name: "新成員",
      order: undefined,
    });
  }

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
    <DetailPanel title="人員" onClose={props.onClose}>
      <div class="p-2 flex flex-col gap-4">
        <label class="font-bold">已建立的人員</label>
        {persons().map((person) => (
          <div class="flex items-center gap-2">
            <input
              class="border px-2 py-1 w-30 rounded"
              value={person.name}
              onBlur={(e) => setPersonName(person.id, e.currentTarget.value)}
              placeholder="人員名稱"
            />
            <input
              class="border px-2 py-1 w-30 rounded"
              type="number"
              min="1"
              value={person.order ?? ""}
              onInput={(e) => setPersonOrder(person.id, e.currentTarget.value)}
              placeholder="排序 (可選)"
            />
            <Button
              variant="danger"
              size="small"
              onClick={() => handleDeletePerson(person.id)}
            >
              刪除
            </Button>
          </div>
        ))}
        <div>
          <Button variant="secondary" onclick={createPerson}>
            新增
          </Button>
        </div>
      </div>
    </DetailPanel>
  );
}
