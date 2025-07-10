// File: src/components/DfsTextView.js (WITH EDIT MODAL AND EXPORT)
import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Download, FileText } from 'lucide-react';

const DfsTextView = forwardRef(({
  nodes,
  disconnectedNodes,
  isNodeDisconnected = () => false, // ✅ FIXED: Default fallback function
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
  const [showExportSuccess, setShowExportSuccess] = useState(false); // Export success notification
  const [showExportOptions, setShowExportOptions] = useState(false); // Export options modal

  // Export function to download DFS content as JSON
  const handleExportToJson = (customFileName = null) => {
    // Chuẩn hóa key node gốc nếu cần (như đã làm ở trên)
    let nodesToExport = { ...nodes };
    if (
      nodesToExport.root &&
      (nodesToExport.root.cha === null || nodesToExport.root.cha === undefined) &&
      nodesToExport.root.id && nodesToExport.root.id !== 'root'
    ) {
      nodesToExport[nodesToExport.root.id] = { ...nodesToExport.root };
      delete nodesToExport.root;
    }

    // Tìm key node gốc thực sự
    let rootKey = Object.keys(nodesToExport).find(
      id => !('cha' in nodesToExport[id]) || nodesToExport[id].cha === null || nodesToExport[id].cha === undefined
    ) || Object.keys(nodesToExport)[0];

    let rootId = rootKey;
    if (
      nodesToExport[rootKey] &&
      nodesToExport[rootKey].id &&
      nodesToExport[rootKey].id !== 'root'
    ) {
      rootId = nodesToExport[rootKey].id;
      nodesToExport[rootId] = { ...nodesToExport[rootKey] };
      delete nodesToExport[rootKey];
      rootKey = rootId;
    }

    // Build tree: chỉ giữ các trường gốc, bỏ qua additionalFields, luôn có document và token_length
    const treeData = {};
    Object.keys(nodesToExport).forEach(nodeId => {
      const node = nodesToExport[nodeId];
      const nodeObj = {};
      Object.keys(node).forEach(key => {
        if (key === 'id' || key === 'additionalFields') return;
        if ((key === 'parent' || key === 'cha') && node[key] === 'root') {
          nodeObj[key] = rootId;
        } else {
          nodeObj[key] = node[key];
        }
      });
      if (!('document' in nodeObj)) nodeObj.document = "";
      if (!('token_length' in nodeObj)) nodeObj.token_length = nodeObj.text ? nodeObj.text.length : 0;
      treeData[nodeId] = nodeObj;
    });
    const exportData = {
      root_id: rootId,
      tree: treeData
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const defaultFileName = `${selectedTree || 'tree'}-${new Date().toISOString().split('T')[0]}.json`;
    link.download = customFileName || defaultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
    setShowExportOptions(false);
  };

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

  // Tìm id node gốc thực sự
  const rootId = useMemo(() => {
    return Object.keys(nodes).find(
      id => !('cha' in nodes[id]) || nodes[id].cha === null || nodes[id].cha === undefined
    ) || Object.keys(nodes)[0];
  }, [nodes]);

  // CRITICAL: Ensure we're getting FULL content from nodes
  const dfsTraversal = useMemo(() => {
    const visitedNodes = [];
    const visited = new Set();
    
    const dfs = (nodeId) => {
      if (!nodes[nodeId] || visited.has(nodeId)) return;
      
      visited.add(nodeId);
      
      // CRITICAL: Get FULL text content - NO TRUNCATION
      const nodeText = nodes[nodeId].text || '';
      
      // ✅ FIXED: Safe call to isNodeDisconnected with fallback
      let nodeIsDisconnected = false;
      try {
        if (typeof isNodeDisconnected === 'function') {
          // For multi-tree mode, need to pass selectedTree and nodeId
          if (selectedTree) {
            nodeIsDisconnected = isNodeDisconnected(selectedTree, nodeId);
          } else {
            // For single tree mode, just pass nodeId
            nodeIsDisconnected = isNodeDisconnected(nodeId);
          }
        }
      } catch (error) {
        console.warn('Error calling isNodeDisconnected:', error);
        nodeIsDisconnected = false;
      }
      
      visitedNodes.push({
        id: nodeId,
        text: nodeText, // FULL CONTENT - NO TRUNCATION
        originalText: nodeText, // Keep original for reference
        isDisconnected: nodeIsDisconnected,
        isRoot: nodeId === rootId, // Sửa ở đây
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
    dfs(rootId);
    
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
  }, [nodes, disconnectedNodes, isNodeDisconnected, contentDisplay, selectedTree, rootId]);

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
        width: '100%',
        height: '100%', // ✅ CRITICAL: Take full height
        overflowY: 'auto', // ✅ Always show vertical scrollbar when needed
        overflowX: 'auto', // ✅ Always show horizontal scrollbar when needed  
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative' // For notification positioning
      }}
    >
      {/* Export success notification */}
      {showExportSuccess && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: '#059669',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <FileText className="w-4 h-4" />
                     ✅ Export thành công! File đã được tải xuống.
        </div>
      )}
      {/* Header with file selector and export button */}
      <div style={{ padding: '16px 24px 0 24px', background: 'white', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          {/* File selector */}
          {trees && Object.keys(trees).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label htmlFor="dfs-file-select" style={{ fontWeight: 600, marginRight: 8, color: '#374151' }}>Chọn file JSON:</label>
              <select
                id="dfs-file-select"
                value={selectedTree || Object.keys(trees)[0]}
                onChange={e => setSelectedTree(e.target.value)}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #d1d5db', 
                  fontSize: 15,
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  minWidth: '200px'
                }}
              >
                {Object.keys(trees).map(fileName => (
                  <option key={fileName} value={fileName}>{fileName}</option>
                ))}
              </select>
              {Object.keys(trees).length > 1 && (
                <span style={{ marginLeft: 8, fontSize: '12px', color: '#6b7280' }}>
                  ({Object.keys(trees).length} files available)
                </span>
              )}
            </div>
          )}
          
          {/* Export button */}
          <button
            onClick={() => setShowExportOptions(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#047857';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#059669';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
        
        {/* Statistics display */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '12px',
          color: '#6b7280',
          paddingBottom: '8px'
        }}>
          <div>
            📊 {stats.total} nodes • {stats.connected} connected • {stats.disconnected} disconnected
          </div>
          <div>
            📝 {stats.totalChars} chars • avg: {stats.avgLength} • max: {stats.longestNode}
          </div>
        </div>
      </div>
      <pre style={{
        background: 'white',
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#1f2937',
        margin: 0,
        padding: '24px',
        border: 'none',
        boxShadow: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        flex: 1, // ✅ Take remaining space
        overflow: 'auto' // ✅ Allow scrolling within pre
      }}>
        {filteredResult.noResults ? (
          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            {filteredResult.noResults ? 'Không tìm thấy kết quả phù hợp...' : 'Chưa có dữ liệu để duyệt...'}
          </span>
        ) : (
          filteredResult.content
        )}
      </pre>
      
      {/* Export Options Modal */}
      {showExportOptions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: '20px',
              fontSize: '18px',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Download className="w-5 h-5" />
              Export DFS Content
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                File Name (optional):
              </label>
                             <input
                 type="text"
                 placeholder={`${selectedTree || 'tree'}-${new Date().toISOString().split('T')[0]}.json`}
                 style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                id="customFileName"
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowExportOptions(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const customFileName = document.getElementById('customFileName')?.value || null;
                  handleExportToJson(customFileName);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DfsTextView;