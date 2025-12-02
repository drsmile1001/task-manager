import { client } from "@frontend/client";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

import type { Person } from "@backend/schemas/Person";

export type PersonStore = ReturnType<typeof createPersonStore>;

export function createPersonStore() {
  const [persons, setPersons] = createSignal<Person[]>([]);

  async function loadPersons() {
    const result = await client.api.persons.get();
    if (result.error) {
      throw new Error("Failed to load persons");
    }
    setPersons(result.data);
  }
  loadPersons();

  async function createPerson(input: Omit<Person, "id">) {
    const id = ulid();
    const p: Person = { id, ...input };
    const result = await client.api.persons.post(p);
    if (result.error) {
      throw new Error("Failed to create person");
    }
    setPersons((prev) => [...prev, p]);
    return p;
  }

  async function updatePerson(id: string, patch: Partial<Person>) {
    const result = await client.api.persons({ id }).patch(patch);
    if (result.error) {
      throw new Error("Failed to update person");
    }
    setPersons((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }

  async function deletePerson(id: string) {
    const result = await client.api.persons({ id }).delete();
    if (result.error) {
      throw new Error("Failed to delete person");
    }
    setPersons((prev) => prev.filter((p) => p.id !== id));
  }

  function getPerson(id: string) {
    return persons().find((p) => p.id === id);
  }

  return {
    persons,
    createPerson,
    updatePerson,
    deletePerson,
    getPerson,
  };
}
