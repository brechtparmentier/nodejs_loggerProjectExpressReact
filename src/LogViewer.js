import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';

function LogModal({ isOpen, onClose, logContent }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="bg-white p-4 max-w-3xl w-full mx-auto my-8">
        <button onClick={onClose} className="float-right">Sluiten</button>
        <pre className="whitespace-pre-wrap overflow-y-scroll max-h-[80vh]">{logContent}</pre>
      </div>
    </div>
  );
}

function LogViewer() {
  const [availableLogs, setAvailableLogs] = useState([]);
  const [logsContent, setLogsContent] = useState({});
  const [activeLogs, setActiveLogs] = useState([]);
  const [textSize, setTextSize] = useState('text-sm');
  const [numColumns, setNumColumns] = useState('md:grid-cols-2'); 
  const [numRows, setNumRows] = useState(50);
  
  const toggleAccordion = (logName) => {
    setActiveLogs(activeLogs =>
      activeLogs.includes(logName)
        ? activeLogs.filter(name => name !== logName) 
        : [...activeLogs, logName] 
    );
  };

  // Update text size
  const handleTextSizeChange = (event) => {
    setTextSize(event.target.value);
  };

  // Update the number of lines
const handleNumRowsChange = (event) => {
  setNumRows(event.target.value);
};
  // Update het aantal kolommen
  const handleNumColumnsChange = (event) => {
    setNumColumns(event.target.value);
  };

  useEffect(() => {
    console.log("Fetching available logs from the server...");
    fetch('/api/logs')
      .then(response => {
        console.log("Response received from /api/logs");
        return response.json();
      })
      .then(data => {
        console.log("Logs data received:", data);
        setAvailableLogs(data);

        data.forEach(log => {
          console.log(`Setting up WebSocket connection for log: ${log.name}`);
          const ws = new WebSocket(`wss://logs.brechtparmentier.be/`);
          
          ws.onopen = () => {
            console.log(`WebSocket connection opened for log: ${log.name}`);
            ws.send(JSON.stringify({ logName: log.name, numLines: numRows })); // Verstuur numRows als numLines
          };

          ws.onmessage = (event) => {
            console.log(`Message received for log: ${log.name}`, event.data);
            const message = JSON.parse(event.data);
            
            if (message.error) {
              console.error(`Error for log: ${log.name} - ${message.error}`);
              return; // Stop verdere verwerking als er een fout is
            }
            
            // Aanname: Als er geen fout is, verwerk dan de logKey en lines normaal
            const logKey = message.logKey; // Gebruik logKey direct als string
            
            if (logKey && message.lines) {
              setLogsContent((prevContent) => ({
                ...prevContent,
                [logKey]: (prevContent[logKey] || '') + '\n' + message.lines,
              }));
            }
          };
          
          

          ws.onerror = (error) => {
            console.error(`WebSocket error for log: ${log.name}`, error);
          };

          ws.onclose = () => {
            console.log(`WebSocket connection closed for log: ${log.name}`);
          };

          return () => {
            console.log(`Cleaning up WebSocket connection for log: ${log.name}`);
            ws.close();
          };
        });
      })
      .catch(error => console.error("Fetching logs failed", error));
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* Navbar met dropdowns */}
      <nav className="flex justify-between mb-4">
        <div>
          <label htmlFor="text-size" className="mr-2">Text size:</label>
          <select id="text-size" value={textSize} onChange={handleTextSizeChange}>
            <option value="text-xs">Small</option>
            <option value="text-sm">Medium</option>
            <option value="text-lg">Large</option>
          </select>
        </div>
        <div>
          <label htmlFor="num-rows" className="mr-2">Aantal log rijen:</label>
          <select id="text-size" value={numRows} onChange={handleNumRowsChange}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
          </select>
        </div>
        <div>
          <label htmlFor="num-columns" className="mr-2">Number of columns:</label>
          <select id="num-columns" value={numColumns} onChange={handleNumColumnsChange}>
            <option value="md:grid-cols-1">1 Column</option>
            <option value="md:grid-cols-2">2 Columns</option>
            <option value="md:grid-cols-3">3 Columns</option>
            <option value="md:grid-cols-4">4 Columns</option>
          </select>
        </div>
      </nav>

      {/* Log berichten */}
      <div className={`grid grid-cols-1 ${numColumns} gap-4`}>
        {availableLogs.map((log) => (
          <div key={log.name} className={`bg-white shadow-lg rounded-lg ${textSize}`}>
            <button 
              onClick={() => toggleAccordion(log.name)}
              className="w-full text-left p-4 font-bold text-lg"
            >
              {log.description || log.name}
              <span className="float-right">
                {activeLogs.includes(log.name) ? '-' : '+'}
              </span>
            </button>
            <LogModal 
  isOpen={activeLogs.includes(log.name)} 
  onClose={() => toggleAccordion(log.name)} 
  logContent={logsContent[log.name]} 
/>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogViewer;
