import React from 'react';
import LogViewer from './LogViewer'; // Zorg ervoor dat het pad overeenkomt met waar je LogViewer.js hebt opgeslagen

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <LogViewer />
      </header>
    </div>
  );
}

export default App;
