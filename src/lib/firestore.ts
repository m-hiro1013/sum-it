import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Agent, AgentInput } from "../types/agent";

const AGENTS_COLLECTION = "agents";

export const getAgents = async (): Promise<Agent[]> => {
    const q = query(collection(db, AGENTS_COLLECTION), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Agent[];
};

export const getAgent = async (id: string): Promise<Agent | null> => {
    const docRef = doc(db, AGENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Agent;
    }
    return null;
};

export const createAgent = async (agent: AgentInput): Promise<string> => {
    const docRef = await addDoc(collection(db, AGENTS_COLLECTION), {
        ...agent,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    });
    return docRef.id;
};

export const updateAgent = async (id: string, agent: Partial<AgentInput>): Promise<void> => {
    const docRef = doc(db, AGENTS_COLLECTION, id);
    await updateDoc(docRef, {
        ...agent,
        updated_at: serverTimestamp(),
    });
};

export const deleteAgent = async (id: string): Promise<void> => {
    const docRef = doc(db, AGENTS_COLLECTION, id);
    await deleteDoc(docRef);
};
