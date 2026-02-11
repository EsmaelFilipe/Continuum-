import { create } from 'zustand';

interface Node {
    id: string;
    label: string;
    role: string;
    [key: string]: any;
}

interface StoreState {
    nodes: Node[];
    updateNodeLabel: (id: string, label: string) => void;
    branchFromNode: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
    nodes: [],

    updateNodeLabel: (id: string, label: string) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, label } : node
            ),
        }));
    },

    branchFromNode: (id: string) => {
        // Implement branching logic here
        set((state) => ({
            nodes: [...state.nodes], // Update as needed
        }));
    },
}));