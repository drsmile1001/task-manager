import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Panel, { PanelList } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { usePersonStore } from "@frontend/stores/personStore";
import { ulid } from "ulid";

export default function PersonListPanel() {
  const { persons, setPerson } = usePersonStore();
  const { pushPanel } = usePanelController();

  async function createPerson() {
    const userId = ulid();
    const result = await client.api.persons.post({
      id: userId,
      name: "新成員",
      order: undefined,
      email: "",
    });
    if (result.error || !result.data) {
      throw new Error("CREATE_PERSON_FAILED");
    }
    await setPerson(result.data);
    pushPanel({ type: "PERSON_DETAILS", personId: result.data.id });
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
              pushPanel({ type: "PERSON_DETAILS", personId: person.id })
            }
          >
            {person.name}
          </div>
        )}
      </PanelList>
    </Panel>
  );
}
