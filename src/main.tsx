import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupChatTables, testChatSystem, fixChatTables } from './utils/setupChatTables'
import { supabase } from './integrations/supabase/client'

// Make chat setup functions available globally for debugging
declare global {
  interface Window {
    setupChatTables: typeof setupChatTables;
    testChatSystem: typeof testChatSystem;
    fixChatTables: typeof fixChatTables;
    supabase: typeof supabase;
  }
}

window.setupChatTables = setupChatTables;
window.testChatSystem = testChatSystem;
window.fixChatTables = fixChatTables;
window.supabase = supabase;

createRoot(document.getElementById("root")!).render(<App />);
