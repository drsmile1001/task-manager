import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import type { Person } from "@backend/schemas/Person";

function createPersonStore() {
  const [map, setMap] = createStore({} as Record<string, Person | undefined>);

  const persons = createMemo(() => {
    const ps = Object.values(map)
      .filter((p): p is Person => !!p)
      .sort((a, b) => {
        if (typeof a.order === "number" && typeof b.order === "number") {
          return a.order - b.order;
        } else if (typeof a.order === "number") {
          return -1;
        } else if (typeof b.order === "number") {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      });
    return ps;
  });

  async function loadPersons() {
    const result = await client.api.persons.get();
    if (result.error) {
      throw new Error("Failed to load persons");
    }
    setMap(
      Object.fromEntries(result.data.map((person) => [person.id, person]))
    );
  }
  loadPersons();

  async function setPerson(person: Person) {
    setMap(person.id, person);
  }

  async function deletePerson(id: string) {
    setMap(id, undefined);
  }

  function getPerson(id: string): Person | undefined {
    return map[id];
  }

  return {
    persons,
    setPerson,
    deletePerson,
    getPerson,
  };
}

export const usePersonStore = singulation(createPersonStore);
