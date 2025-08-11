import { faker } from "@faker-js/faker";

export type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  progress: number;
  status: "relationship" | "complicated" | "single";
  subRows?: Person[];
  birthday: string;
  activeDate: string;
};

const range = (len: number) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const newPerson = (): Person => {
  /** Always ensure to return string instead of object date to prevent slowness */
  const _activeDate = faker.date.between({
    from: "1950-01-01",
    to: "2002-12-31",
  });
  const _birthday = faker.date.birthdate({ min: 18, max: 65, mode: "age" });
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int(40),
    visits: faker.number.int(1000),
    progress: faker.number.int(100),
    status: faker.helpers.shuffle<Person["status"]>([
      "relationship",
      "complicated",
      "single",
    ])[0]!,
    birthday: `${_birthday.getFullYear()}-${_birthday.getMonth() + 1}-${_birthday.getDate()}`,
    activeDate: `${_activeDate.getMonth() + 1}-${_activeDate.getDate()}-${_activeDate.getFullYear()}`,
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!;
    return range(len).map((): Person => {
      return {
        ...newPerson(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      };
    });
  };

  return makeDataLevel();
}
