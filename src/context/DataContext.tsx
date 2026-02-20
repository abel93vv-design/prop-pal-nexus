import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Agency, Client, Document, Property, User, Task } from "@/types/crm";
import {
  agencies as initialAgencies,
  clients as initialClients,
  properties as initialProperties,
  users as initialUsers,
  tasks as initialTasks,
  documents as initialDocuments,
  monthlyData,
} from "@/data/mockData";

function loadState<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

interface DataContextType {
  agencies: Agency[];
  clients: Client[];
  properties: Property[];
  users: User[];
  tasks: Task[];
  documents: Document[];
  monthlyData: typeof monthlyData;
  addAgency: (a: Omit<Agency, "id">) => void;
  updateAgency: (a: Agency) => void;
  deleteAgency: (id: string) => void;
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
  addDocument: (d: Omit<Document, "id">) => void;
  updateDocument: (d: Document) => void;
  deleteDocument: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

let idCounter = 100;
const genId = (prefix: string) => `${prefix}${++idCounter}`;

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [agencies, setAgencies] = useState<Agency[]>(() => loadState("crm_agencies", initialAgencies));
  const [clients, setClients] = useState<Client[]>(() => loadState("crm_clients", initialClients));
  const [properties, setProperties] = useState<Property[]>(() => loadState("crm_properties", initialProperties));
  const [users, setUsers] = useState<User[]>(() => loadState("crm_users", initialUsers));
  const [tasks, setTasks] = useState<Task[]>(() => loadState("crm_tasks", initialTasks));
  const [documents, setDocuments] = useState<Document[]>(() => loadState("crm_documents", initialDocuments));

  useEffect(() => { localStorage.setItem("crm_agencies", JSON.stringify(agencies)); }, [agencies]);
  useEffect(() => { localStorage.setItem("crm_clients", JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem("crm_properties", JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem("crm_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("crm_tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("crm_documents", JSON.stringify(documents)); }, [documents]);

  return (
    <DataContext.Provider
      value={{
        agencies,
        clients,
        properties,
        users,
        tasks,
        documents,
        monthlyData,
        addAgency: (a) => setAgencies((prev) => [...prev, { ...a, id: genId("a") }]),
        updateAgency: (a) => setAgencies((prev) => prev.map((x) => (x.id === a.id ? a : x))),
        deleteAgency: (id) => setAgencies((prev) => prev.filter((x) => x.id !== id)),
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
        addDocument: (d) => setDocuments((prev) => [...prev, { ...d, id: genId("d") }]),
        updateDocument: (d) => setDocuments((prev) => prev.map((x) => (x.id === d.id ? d : x))),
        deleteDocument: (id) => setDocuments((prev) => prev.filter((x) => x.id !== id)),
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
