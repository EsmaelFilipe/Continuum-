
import { create } from 'zustand';



interface StoreState {

  updateNodeLabel: (id: string, label: string) => void;

  branchFromNode: (id: string, role: string) => void;

}



export const useStore = create<StoreState>((set) => ({

  updateNodeLabel: (id: string, label: string) => {

    // Implement your logic to update node label

    console.log(`Updating node ${id} with label: ${label}`);

  },

  branchFromNode: (id: string, role: string) => {

    // Implement your logic to branch from node

    console.log(`Branching from node ${id} with role: ${role}`);

  },

}));

