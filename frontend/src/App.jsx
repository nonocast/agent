import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [useMarkdown, setUseMarkdown] = useState(true);
  const textareaRef = useRef(null);
  const replyRef = useRef(null);
  const socket = useRef(null);
  const fullTextRef = useRef("");

  useEffect(() => {
    document.title = "agent / nonocast";
    textareaRef.current?.focus();

    const savedQuery = localStorage.getItem("lastQuery");
    const savedReply = localStorage.getItem("lastReply");

    if (savedQuery) setQuery(savedQuery);
    if (savedReply) {
      setReply(savedReply);
      fullTextRef.current = savedReply;
    }
  }, []);

  useEffect(() => {
    socket.current = io("http://localhost:7005");

    socket.current.on("connect", () => {
      console.log("🟢 Connected:", socket.current.id);
    });

    socket.current.on("chunk", (token) => {
      fullTextRef.current += token;
      setReply(fullTextRef.current);

      setTimeout(() => {
        replyRef.current?.scrollTo({
          top: replyRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    });

    socket.current.on("done", () => {
      setSending(false);
      localStorage.setItem("lastReply", fullTextRef.current);
    });

    socket.current.on("error", (msg) => {
      setReply("错误：" + msg);
      setSending(false);
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!query.trim()) return;
    setSending(true);
    setReply("");
    fullTextRef.current = "";
    localStorage.setItem("lastQuery", query);
    socket.current.emit("chat", { message: query });
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page-wrapper">
      <div className="panel">
        <h2>输入内容</h2>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入提问内容...（Enter 发送，Shift+Enter 换行）"
          rows={6}
        />
        <button onClick={handleSend} disabled={sending}>
          {sending ? "执行中..." : "执行（Enter）"}
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>AI 回复</h2>
          <button
            className="toggle-mode-btn"
            onClick={() => setUseMarkdown(!useMarkdown)}
          >
            {useMarkdown ? "显示原始文本" : "使用 Markdown 渲染"}
          </button>
        </div>

        <div className="response-box" ref={replyRef}>
          {useMarkdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {reply}
            </ReactMarkdown>
          ) : (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                lineHeight: "1.5",
                minHeight: "100px",
              }}
            >
              {reply}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
