import { createContext, useContext, ReactNode } from "react";
import { Agency, Client, Document, Property, User, Task } from "@/types/crm";
import { monthlyData } from "@/data/mockData";
import {
  useProperties, useClients, useAgencies, useTeamMembers, useTasks, useDocuments,
  usePropertyMutations, useClientMutations, useAgencyMutations, useTeamMemberMutations, useTaskMutations, useDocumentMutations,
} from "@/hooks/useQueryData";

interface DataContextType {
  agencies: Agency[];
  clients: Client[];
  properties: Property[];
  users: User[];
  tasks: Task[];
  documents: Document[];
  monthlyData: typeof monthlyData;
  loading: boolean;
  addAgency: (a: Omit<Agency, "id">) => Promise<void>;
  updateAgency: (a: Agency) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  updateClient: (c: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProperty: (p: Omit<Property, "id">) => Promise<void>;
  updateProperty: (p: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addUser: (u: Omit<User, "id">) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addTask: (t: Omit<Task, "id">) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addDocument: (d: Omit<Document, "id">) => Promise<void>;
  updateDocument: (d: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  // React Query hooks for data fetching
  const { data: properties = [], isLoading: loadingProps } = useProperties();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: agencies = [], isLoading: loadingAgencies } = useAgencies();
  const { data: users = [], isLoading: loadingUsers } = useTeamMembers();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: documents = [], isLoading: loadingDocs } = useDocuments();

  // Mutation hooks
  const { addProperty, updateProperty, deleteProperty } = usePropertyMutations();
  const { addClient, updateClient, deleteClient } = useClientMutations();
  const { addAgency, updateAgency, deleteAgency } = useAgencyMutations();
  const { addUser, updateUser, deleteUser } = useTeamMemberMutations();
  const { addTask, updateTask, deleteTask } = useTaskMutations();
  const { addDocument, updateDocument, deleteDocument } = useDocumentMutations();

  const loading = loadingProps || loadingClients || loadingAgencies || loadingUsers || loadingTasks || loadingDocs;

  return (
    <DataContext.Provider value={{
      agencies, clients, properties, users, tasks, documents, monthlyData, loading,
      addAgency, updateAgency, deleteAgency,
      addClient, updateClient, deleteClient,
      addProperty, updateProperty, deleteProperty,
      addUser, updateUser, deleteUser,
      addTask, updateTask, deleteTask,
      addDocument, updateDocument, deleteDocument,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
