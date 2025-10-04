import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { Dashboard } from './components/Dashboard';
import { MeetingView } from './components/MeetingView';
import { ProjectManager } from './components/ProjectManager';
import './styles/App.css';

function App() {
  const { selectedView, setConnected, addTranscription } = useAppStore();

  useEffect(() => {
    // Check if we're in Electron environment
    if (!window.electron) {
      console.error('Electron API not available');
      return;
    }

    console.log('🔧 App.tsx: Setting up listeners');

    // Set up WebSocket status listener
    window.electron.onWsStatus((status) => {
      setConnected(status.connected);
    });

    // Set up transcription listener
    window.electron.onTranscription((data) => {
      console.log('📝 Frontend: Received transcription from IPC:', {
        id: data.transcriptionId,
        content: data.content?.substring(0, 50)
      });
      addTranscription(data);
    });

    // Get initial WebSocket status
    window.electron.getWsStatus().then((status) => {
      setConnected(status.connected);
    });

    console.log('✅ App.tsx: Listeners set up complete');
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="app">
      {selectedView === 'dashboard' && <Dashboard />}
      {selectedView === 'meeting' && <MeetingView />}
      {selectedView === 'settings' && <ProjectManager />}
    </div>
  );
}

export default App;
