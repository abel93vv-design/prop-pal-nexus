import { createContext, useContext, useState, ReactNode } from "react";
import { Client, Property, User, Task } from "@/types/crm";
import {
  clients as initialClients,
  properties as initialProperties,
  users as initialUsers,
  tasks as initialTasks,
  monthlyData,
} from "@/data/mockData";

interface DataContextType {
  clients: Client[];
  properties: Property[];
  users: User[];
  tasks: Task[];
  monthlyData: typeof monthlyData;
  addClient: (c: Omit<Client, "id">) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addProperty: (p: Omit<Property, "id">) => void;
  updateProperty: (p: Property) => void;
  deleteProperty: (id: string) => void;
  addUser: (u: Omit<User, "id">) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

let idCounter = 100;
const genId = (prefix: string) => `${prefix}${++idCounter}`;

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  return (
    <DataContext.Provider
      value={{
        clients,
        properties,
        users,
        tasks,
        monthlyData,
        addClient: (c) => setClients((prev) => [...prev, { ...c, id: genId("c") }]),
        updateClient: (c) => setClients((prev) => prev.map((x) => (x.id === c.id ? c : x))),
        deleteClient: (id) => setClients((prev) => prev.filter((x) => x.id !== id)),
        addProperty: (p) => setProperties((prev) => [...prev, { ...p, id: genId("p") }]),
        updateProperty: (p) => setProperties((prev) => prev.map((x) => (x.id === p.id ? p : x))),
        deleteProperty: (id) => setProperties((prev) => prev.filter((x) => x.id !== id)),
        addUser: (u) => setUsers((prev) => [...prev, { ...u, id: genId("u") }]),
        updateUser: (u) => setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x))),
        deleteUser: (id) => setUsers((prev) => prev.filter((x) => x.id !== id)),
        addTask: (t) => setTasks((prev) => [...prev, { ...t, id: genId("t") }]),
        updateTask: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        deleteTask: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
