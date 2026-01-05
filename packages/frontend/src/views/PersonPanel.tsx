import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Panel, { PanelList } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { usePersonStore } from "@frontend/stores/personStore";
import { ulid } from "ulid";

export default function PersonListPanel() {
  const { persons } = usePersonStore();
  const { pushPanel } = usePanelController();

  async function createPerson() {
    const userId = ulid();
    await client.api.persons.post({
      id: userId,
      name: "新成員",
      order: undefined,
      email: "",
    });
    pushPanel({ type: "PersonDetails", personId: userId });
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
          <div
            class="w-full p-1 border rounded text-sm shadow cursor-pointer select-none bg-blue-50 border-blue-400 hover:bg-blue-100"
            onClick={() =>
              pushPanel({ type: "PersonDetails", personId: person.id })
            }
          >
            {person.name}
          </div>
        )}
      </PanelList>
    </Panel>
  );
}
