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
    where,
    serverTimestamp,
    onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Agent, AgentInput } from "../types/agent";
import { Meeting, MeetingInput, Message } from "../types/meeting";
import { LLMModel } from "../types/model";
import { OutputStyle, OutputStyleInput } from "../types/style";
import { Facilitator, FacilitatorInput } from "../types/facilitator";
import { MeetingTemplate, MeetingTemplateInput } from "../types/template";
import { MeetingWorkflow, MeetingWorkflowInput } from "../types/workflow";

const AGENTS_COLLECTION = "agents";
const MEETINGS_COLLECTION = "meetings";
const MESSAGES_COLLECTION = "messages";
const MODELS_COLLECTION = "llm_models";
const STYLES_COLLECTION = "output_styles";
const FACILITATORS_COLLECTION = "facilitators";
const TEMPLATES_COLLECTION = "meeting_templates";
const WORKFLOWS_COLLECTION = "meeting_workflows";

// --- Agents ---
export const getAgents = async (): Promise<Agent[]> => {
    const q = query(collection(db, AGENTS_COLLECTION), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Agent[];
};
export const getAgent = async (id: string): Promise<Agent | null> => {
    const docRef = doc(db, AGENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Agent) : null;
};
export const createAgent = async (agent: AgentInput) => {
    return (await addDoc(collection(db, AGENTS_COLLECTION), { ...agent, created_at: serverTimestamp(), updated_at: serverTimestamp() })).id;
};
export const updateAgent = async (id: string, agent: Partial<AgentInput>) => {
    await updateDoc(doc(db, AGENTS_COLLECTION, id), { ...agent, updated_at: serverTimestamp() });
};
export const deleteAgent = async (id: string) => {
    await deleteDoc(doc(db, AGENTS_COLLECTION, id));
};

// --- LLM Models ---
export const getLLMModels = async (): Promise<LLMModel[]> => {
    const q = query(collection(db, MODELS_COLLECTION), where("is_active", "==", true));
    const querySnapshot = await getDocs(q);
    const models = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LLMModel[];
    return models.sort((a, b) => a.provider !== b.provider ? a.provider.localeCompare(b.provider) : a.tier.localeCompare(b.tier));
};

// --- Output Styles ---
export const getOutputStyles = async (onlyActive = true): Promise<OutputStyle[]> => {
    const q = onlyActive
        ? query(collection(db, STYLES_COLLECTION), where("is_active", "==", true), orderBy("created_at", "asc"))
        : query(collection(db, STYLES_COLLECTION), orderBy("created_at", "asc"));
    return (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() } as OutputStyle));
};
export const getOutputStyle = async (id: string): Promise<OutputStyle | null> => {
    const docRef = doc(db, STYLES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as OutputStyle) : null;
};
export const createOutputStyle = async (style: OutputStyleInput) => {
    return (await addDoc(collection(db, STYLES_COLLECTION), { ...style, created_at: serverTimestamp() })).id;
};
export const updateOutputStyle = async (id: string, style: Partial<OutputStyleInput>) => {
    await updateDoc(doc(db, STYLES_COLLECTION, id), style);
};
export const deleteOutputStyle = async (id: string) => {
    await deleteDoc(doc(db, STYLES_COLLECTION, id));
};

// --- Facilitators ---
export const getFacilitators = async (onlyActive = true): Promise<Facilitator[]> => {
    const q = onlyActive
        ? query(collection(db, FACILITATORS_COLLECTION), where("is_active", "==", true), orderBy("created_at", "asc"))
        : query(collection(db, FACILITATORS_COLLECTION), orderBy("created_at", "asc"));
    return (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() } as Facilitator));
};
export const createFacilitator = async (facilitator: FacilitatorInput) => {
    return (await addDoc(collection(db, FACILITATORS_COLLECTION), { ...facilitator, created_at: serverTimestamp() })).id;
};
export const updateFacilitator = async (id: string, facilitator: Partial<FacilitatorInput>) => {
    await updateDoc(doc(db, FACILITATORS_COLLECTION, id), facilitator);
};
export const getFacilitator = async (id: string): Promise<Facilitator | null> => {
    const docRef = doc(db, FACILITATORS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Facilitator) : null;
};
export const deleteFacilitator = async (id: string) => {
    await deleteDoc(doc(db, FACILITATORS_COLLECTION, id));
};

// --- Meeting Templates ---
export const getMeetingTemplates = async (onlyActive = true): Promise<MeetingTemplate[]> => {
    const q = onlyActive
        ? query(collection(db, TEMPLATES_COLLECTION), where("is_active", "==", true), orderBy("created_at", "asc"))
        : query(collection(db, TEMPLATES_COLLECTION), orderBy("created_at", "asc"));
    return (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingTemplate));
};
export const createMeetingTemplate = async (template: MeetingTemplateInput) => {
    return (await addDoc(collection(db, TEMPLATES_COLLECTION), { ...template, created_at: serverTimestamp() })).id;
};
export const updateMeetingTemplate = async (id: string, template: Partial<MeetingTemplateInput>) => {
    await updateDoc(doc(db, TEMPLATES_COLLECTION, id), template);
};
export const deleteMeetingTemplate = async (id: string) => {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
};

// --- Meetings ---
export const getMeetings = async (): Promise<Meeting[]> => {
    const q = query(collection(db, MEETINGS_COLLECTION), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Meeting[];
};
export const getMeeting = async (id: string): Promise<Meeting | null> => {
    const docRef = doc(db, MEETINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Meeting) : null;
};
export const createMeeting = async (meeting: MeetingInput) => {
    return (await addDoc(collection(db, MEETINGS_COLLECTION), { ...meeting, created_at: serverTimestamp() })).id;
};
export const updateMeeting = async (id: string, meeting: Partial<Meeting>) => {
    await updateDoc(doc(db, MEETINGS_COLLECTION, id), meeting);
};
export const deleteMeeting = async (id: string) => {
    await deleteDoc(doc(db, MEETINGS_COLLECTION, id));
};

// --- Messages ---
export const addMessage = async (message: Omit<Message, "id" | "created_at">) => {
    return (await addDoc(collection(db, MESSAGES_COLLECTION), { ...message, created_at: serverTimestamp() })).id;
};
export const subscribeToMessages = (meeting_id: string, callback: (messages: Message[]) => void) => {
    const q = query(
        collection(db, MESSAGES_COLLECTION),
        where("meeting_id", "==", meeting_id),
        orderBy("created_at", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    });
};
export const getMessages = async (meeting_id: string): Promise<Message[]> => {
    const q = query(
        collection(db, MESSAGES_COLLECTION),
        where("meeting_id", "==", meeting_id),
        orderBy("created_at", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
};

// --- Meeting Workflows ---
export const getMeetingWorkflows = async (onlyActive = true): Promise<MeetingWorkflow[]> => {
    const q = onlyActive
        ? query(collection(db, WORKFLOWS_COLLECTION), where("is_active", "==", true), orderBy("created_at", "asc"))
        : query(collection(db, WORKFLOWS_COLLECTION), orderBy("created_at", "asc"));
    return (await getDocs(q)).docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingWorkflow));
};
export const getMeetingWorkflow = async (id: string): Promise<MeetingWorkflow | null> => {
    const docRef = doc(db, WORKFLOWS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as MeetingWorkflow) : null;
};
export const createMeetingWorkflow = async (workflow: MeetingWorkflowInput) => {
    return (await addDoc(collection(db, WORKFLOWS_COLLECTION), { ...workflow, created_at: serverTimestamp() })).id;
};
export const updateMeetingWorkflow = async (id: string, workflow: Partial<MeetingWorkflowInput>) => {
    await updateDoc(doc(db, WORKFLOWS_COLLECTION, id), workflow);
};
export const deleteMeetingWorkflow = async (id: string) => {
    await deleteDoc(doc(db, WORKFLOWS_COLLECTION, id));
};
