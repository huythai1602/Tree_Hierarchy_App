// File: src/components/DfsTextView.js (WITH EDIT MODAL)
import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const DfsTextView = forwardRef(({
  nodes,
  disconnectedNodes,
  isNodeDisconnected,
  dfsOrder, // Get consistent DFS order from useTreeLayout
  onEditNode, // Add this prop for editing
  dfsScroll = 0, // New prop for scroll position
  setDfsScroll = () => {}, // New prop for setting scroll position
  trees = {},
  selectedTree = null,
  setSelectedTree = () => {},
}, ref) => {
  const [separator] = useState('block'); // Only use separator for DFS formatting
  const [contentDisplay] = useState('full'); // Only use contentDisplay for DFS formatting
  const scrollRef = useRef(null); // Ref for scrollable container

  // Save scroll position on every scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const pos = scrollRef.current.scrollTop;
        setDfsScroll(pos);
      }
    };
    const node = scrollRef.current;
    if (node) {
      node.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (node) {
        node.removeEventListener('scroll', handleScroll);
      }
    };
  }, [setDfsScroll]);

  // Restore scroll position on mount (robust with setTimeout)
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = dfsScroll;
      }, 0);
    }
  }, [dfsScroll]);

  // Expose getScrollPosition method to parent
  useImperativeHandle(ref, () => ({
    getScrollPosition: () => {
      const pos = scrollRef.current ? scrollRef.current.scrollTop : 0;
      return pos;
    }
  }), []);

  // CRITICAL: Ensure we're getting FULL content from nodes
  const dfsTraversal = useMemo(() => {
    const visitedNodes = [];
    const visited = new Set();
    
    const dfs = (nodeId) => {
      if (!nodes[nodeId] || visited.has(nodeId)) return;
      
      visited.add(nodeId);
      
      // CRITICAL: Get FULL text content - NO TRUNCATION
      const nodeText = nodes[nodeId].text || '';
      
      visitedNodes.push({
        id: nodeId,
        text: nodeText, // FULL CONTENT - NO TRUNCATION
        originalText: nodeText, // Keep original for reference
        isDisconnected: isNodeDisconnected(nodeId),
        isRoot: nodeId === 'root',
        textLength: nodeText.length
      });
      
      // Traverse children in current tree structure order
      if (nodes[nodeId].con && nodes[nodeId].con.length > 0) {
        const currentChildren = nodes[nodeId].con;
        
        currentChildren.forEach(childId => {
          if (nodes[childId]) {
            dfs(childId);
          }
        });
      }
    };
    
    // Start DFS from root
    dfs('root');
    
    // Add disconnected nodes at the end if not filtered out
    if (!contentDisplay) {
      disconnectedNodes.forEach(nodeId => {
        if (nodes[nodeId] && !visited.has(nodeId)) {
          const nodeText = nodes[nodeId].text || '';
          visitedNodes.push({
            id: nodeId,
            text: `⚡ ${nodeText}`, // Prefix for disconnected
            originalText: nodeText,
            isDisconnected: true,
            isRoot: false,
            textLength: nodeText.length
          });
        }
      });
    }
    
    return visitedNodes;
  }, [nodes, disconnectedNodes, isNodeDisconnected, contentDisplay]);

  // Create display text based on content mode - PRESERVE FULL CONTENT
  const getDisplayResult = useMemo(() => {
    let nodeTexts;
    
    switch(contentDisplay) {
      case 'titles':
        // Show only first 50 chars of each node as title
        nodeTexts = dfsTraversal.map(node => ({
          id: node.id,
          text: node.originalText.substring(0, 50) + (node.originalText.length > 50 ? '...' : ''),
          fullText: node.originalText
        }));
        break;
        
      case 'summary':
        // Show first sentence or first 150 chars
        nodeTexts = dfsTraversal.map(node => {
          const sentences = node.originalText.split(/[.!?]/);
          const firstSentence = sentences[0];
          
          let summaryText;
          if (firstSentence.length > 0 && firstSentence.length < 150) {
            summaryText = firstSentence + '.';
          } else {
            summaryText = node.originalText.substring(0, 150) + (node.originalText.length > 150 ? '...' : '');
          }
          
          return {
            id: node.id,
            text: summaryText,
            fullText: node.originalText
          };
        });
        break;
        
      case 'full':
      default:
        // CRITICAL: Show FULL content - NO TRUNCATION AT ALL
        nodeTexts = dfsTraversal.map(node => ({
          id: node.id,
          text: node.originalText,
          fullText: node.originalText
        }));
        break;
    }
    
    // SIMPLIFIED: Only handle line and block formats - NO FALLBACK
    if (separator === 'line') {
      // Line format: each node on separate line
      const content = nodeTexts.map(node => node.text).join('\n');
      
      return {
        type: 'string',
        content: content,
        nodeTexts: nodeTexts,
        separator: 'line',
        hasNewlines: true
      };
    } else {
      // Block format: each node in separate block with double spacing (DEFAULT)
      const content = nodeTexts.map(node => node.text).join('\n\n');
      
      return {
        type: 'string',
        content: content,
        nodeTexts: nodeTexts,
        separator: 'block',
        hasNewlines: true
      };
    }
  }, [dfsTraversal, separator, contentDisplay]);

  // Filter based on search - simplified (no search UI but keep logic)
  const filteredResult = useMemo(() => {
    // Since no search UI, just return original result
    return getDisplayResult;
  }, [getDisplayResult]);

  // Statistics
  const stats = useMemo(() => {
    const total = dfsTraversal.length;
    const connected = dfsTraversal.filter(node => !node.isDisconnected).length;
    const disconnected = total - connected;
    const totalChars = dfsTraversal.reduce((sum, node) => sum + node.textLength, 0);
    const avgLength = total > 0 ? Math.round(totalChars / total) : 0;
    const longestNode = Math.max(...dfsTraversal.map(node => node.textLength), 0);
    
    return { total, connected, disconnected, totalChars, avgLength, longestNode };
  }, [dfsTraversal]);

  return (
    <div
      ref={scrollRef}
      style={{
        overflowY: 'scroll', // Always show vertical scrollbar
        overflowX: 'auto',   // Only show horizontal scrollbar when needed
        background: 'white',
      }}
    >
      {/* Dropdown chọn file JSON nếu có nhiều file */}
      {trees && Object.keys(trees).length > 1 && (
        <div style={{ padding: '16px 24px 0 24px', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
          <label htmlFor="dfs-file-select" style={{ fontWeight: 600, marginRight: 8 }}>Chọn file JSON:</label>
          <select
            id="dfs-file-select"
            value={selectedTree || Object.keys(trees)[0]}
            onChange={e => setSelectedTree(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 15 }}
          >
            {Object.keys(trees).map(fileName => (
              <option key={fileName} value={fileName}>{fileName}</option>
            ))}
          </select>
        </div>
      )}
      <pre style={{
        background: 'white',
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#1f2937',
        margin: 0,
        padding: '24px 24px 0 24px',
        border: 'none',
        boxShadow: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {filteredResult.noResults ? (
          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            {filteredResult.noResults ? 'Không tìm thấy kết quả phù hợp...' : 'Chưa có dữ liệu để duyệt...'}
          </span>
        ) : (
          filteredResult.content
        )}
      </pre>
    </div>
  );
});

export default DfsTextView;