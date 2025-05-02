import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import hotkeys from "hotkeys-js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [useMarkdown, setUseMarkdown] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    document.title = "agent/nonocast";
  }, []);

  // 记录最后一次
  useEffect(() => {
    textareaRef.current?.focus();
  
    const savedQuery = localStorage.getItem('lastQuery');
    const savedReply = localStorage.getItem('lastReply');
  
    if (savedQuery) setQuery(savedQuery);
    if (savedReply) setReply(savedReply);
  }, []);

  // 自动聚焦输入框
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 提交逻辑（useCallback 避免闭包依赖问题）
  const handleSend = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setReply("");

    try {
      const res = await axios.post("/chat", { message: query });
      setReply(res.data.reply || "(无返回)");

      localStorage.setItem('lastQuery', query);
      localStorage.setItem('lastReply', res.data.reply || '');
    } catch (err) {
      setReply("错误：" + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }


  }, [query]);

  // 绑定快捷键：⌘ + Enter 或 Ctrl + Enter 提交
  useEffect(() => {
    // 允许在 textarea 中生效
    hotkeys.filter = () => true;

    hotkeys("command+enter, ctrl+enter", (event) => {
      event.preventDefault();
      handleSend();
    });

    return () => {
      hotkeys.unbind("command+enter, ctrl+enter");
    };
  }, [handleSend]);

  return (
    <>
      {/* <header className="app-header">agent / nonocast</header> */}

      <div className="page-wrapper">
        <div className="panel">
          <h2>输入内容</h2>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="请输入提问内容..."
            rows={6}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "执行中..." : "执行（⌘ + Enter）"}
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

          <div className="response-box">
            {loading ? (
              <div className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            ) : useMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply}</ReactMarkdown>
            ) : (
              <pre>{reply}</pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
