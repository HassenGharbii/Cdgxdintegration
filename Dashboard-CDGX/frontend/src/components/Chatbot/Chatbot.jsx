import React, { useState } from "react";

const Chatbot = ({ darkMode, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! Ask me about your sales database." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim() === "") return;
    setMessages([...messages, { sender: "user", text: input }]);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      setMessages(msgs => [
        ...msgs,
        { sender: "bot", text: data.answer }
      ]);
    } catch (err) {
      setMessages(msgs => [
        ...msgs,
        { sender: "bot", text: "Error connecting to backend." }
      ]);
    }
    setLoading(false);
  };

  return (
    <div className={`fixed bottom-6 right-6 w-80 shadow-md rounded-md ${darkMode ? "bg-gray-800 text-slate-200 " : "bg-white text-gray-900"} z-50`}>
      <div className="p-4 border-b font-bold flex justify-between items-center">
        <span>Sales Chatbot</span>
        <button
          className={`ml-2 px-2 py-1 rounded ${darkMode ? "bg-gray-700 text-slate-200 " : "bg-gray-200 text-gray-900"}`}
          onClick={onClose}
          aria-label="Close chatbot"
        >
          ×
        </button>
      </div>
      <div className="p-4 h-64 overflow-y-auto flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`text-sm ${msg.sender === "user" ? "text-right" : "text-left"}`}>
            <span className={`inline-block px-3 py-2 rounded ${msg.sender === "user" ? (darkMode ? "bg-blue-700" : "bg-blue-200") : (darkMode ? "bg-gray-700" : "bg-gray-100")}`}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400">Bot is thinking...</div>}
      </div>
      <div className="flex p-2 border-t">
        <input
          className={`flex-1 px-2 py-1 rounded ${darkMode ? "bg-gray-900 text-slate-200 " : "bg-gray-200 text-gray-900"}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type your question about the database..."
          disabled={loading}
        />
        <button
          className={`ml-2 px-4 py-1 rounded ${darkMode ? "bg-blue-600 text-slate-200 " : "bg-blue-500 text-slate-200 "}`}
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;