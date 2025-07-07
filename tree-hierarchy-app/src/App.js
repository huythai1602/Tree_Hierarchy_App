// File: src/App.js (CLEANED VERSION WITHOUT DEMO)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import TreeCanvas from './components/TreeCanvas';
import TreeView from './components/TreeView';
import DfsTextView from './components/DfsTextView';
import JsonImporter from './components/JsonImporter';
import { useTreeLayout } from './hooks/useTreeLayout';
import { useDragDrop } from './hooks/useDragDrop';
import { 
  LayoutGrid, 
  List, 
  FileText,
  Loader,
  Database,
  Eye,
  ChevronDown,
  Upload,
  FolderOpen
} from 'lucide-react';
import './styles/TreeHierarchy.css';

// Enhanced TreeSelectorModal with additional fields info
const TreeSelectorModal = ({ trees, selectedTree, onSelect, onClose }) => {
  const getTreeStats = (tree) => {
    if (!tree || !tree.nodes) return { nodes: 0, additionalFields: 0 };
    
    const nodeCount = Object.keys(tree.nodes).length;
    const additionalFieldsCount = Object.values(tree.nodes).reduce((count, node) => 
      count + (node.additionalFields ? Object.keys(node.additionalFields).length : 0), 0
    );
    
    return { nodes: nodeCount, additionalFields: additionalFieldsCount };
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        padding: 32, 
        minWidth: 400, 
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)' 
      }}>
        <h3 style={{ margin: 0, marginBottom: 16, fontSize: 20, color: '#1d4ed8' }}>
          Chọn cây dữ liệu để hiển thị
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.entries(trees).map(([fileName, tree]) => {
            const stats = getTreeStats(tree);
            return (
              <li key={fileName} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => { onSelect(fileName); onClose(); }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 8,
                    border: fileName === selectedTree ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: fileName === selectedTree ? '#eff6ff' : '#f9fafb',
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '8px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen className="w-4 h-4" />
                    <span>{fileName}</span>
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#6b7280', 
                    fontWeight: 400,
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <span>📊 {stats.nodes} nodes</span>
                    {stats.additionalFields > 0 && (
                      <span style={{ color: '#059669' }}>
                        🆕 {stats.additionalFields} additional fields
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <button 
          onClick={onClose} 
          style={{ 
            marginTop: 20, 
            background: '#e5e7eb', 
            border: 'none', 
            borderRadius: 6, 
            padding: '8px 20px', 
            cursor: 'pointer', 
            color: '#374151', 
            fontWeight: 500 
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

// Enhanced Welcome Screen
const WelcomeScreen = ({ onImport, isLoading }) => {
  return (
    <div className="tree-hierarchy" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'column', 
      gap: '32px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '700px', padding: '0 24px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          textShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          🌳 Enhanced Tree Hierarchy Manager
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          marginBottom: '32px',
          opacity: 0.9,
          lineHeight: 1.6
        }}>
          Chào mừng bạn đến với phiên bản nâng cao! 
          Hỗ trợ JSON linh hoạt với parent/child hoặc cha/con và lưu trữ các trường bổ sung.
        </p>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <Upload className="w-6 h-6" />
            Import Dữ Liệu JSON Linh Hoạt
          </h3>
          
          <JsonImporter 
            onImport={onImport}
            isLoading={isLoading}
            currentData={{}}
            hideButtons={false}
          />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          fontSize: '14px',
          opacity: 0.8
        }}>
          <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>💡 Tính năng mới:</h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '8px'
          }}>
            <li>🔄 Hỗ trợ parent/child & cha/con</li>
            <li>🆕 Lưu trữ trường bổ sung</li>
            <li>📊 Canvas View - Xem cây trực quan</li>
            <li>📁 Tree View - Duyệt cây dạng folder</li>
            <li>📄 DFS View - Xem nội dung đầy đủ</li>
            <li>✏️ Chỉnh sửa nodes trực tiếp</li>
            <li>🔄 Di chuyển và sắp xếp nodes</li>
            <li>🔗 Gộp và tách nodes</li>
            <li>💾 Tự động lưu vào localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

function App() {
  console.log('🔄 Enhanced App render');

  // Enhanced multi-tree state
  const [trees, setTrees] = useState({}); 
  const [selectedTree, setSelectedTree] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('canvas');
  const [importLoading, setImportLoading] = useState(false);
  const [dfsScroll, setDfsScroll] = useState(0);
  const dfsViewRef = useRef(null);

  // Modal state
  const [showTreeSelector, setShowTreeSelector] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Get current tree with enhanced schema support
  const currentTree = selectedTree && trees[selectedTree] ? trees[selectedTree] : Object.values(trees)[0];
  
  // Layout hooks
  const { positions, canvasSize, dfsOrder } = useTreeLayout(currentTree?.nodes || {}, currentTree?.customPositions || {});
  
  const { 
    customPositions: dragPositions,
    dragState, 
    startDrag, 
    updateDrag, 
    endDrag, 
    updatePositions 
  } = useDragDrop(currentTree?.customPositions || {}, (newPositions) => {
    if (selectedTree && trees[selectedTree]) {
      setTrees(prev => ({
        ...prev,
        [selectedTree]: {
          ...prev[selectedTree],
          customPositions: newPositions
        }
      }));
      
      // Enhanced save to localStorage with metadata
      const updatedTrees = {
        ...trees,
        [selectedTree]: {
          ...trees[selectedTree],
          customPositions: newPositions
        }
      };
      localStorage.setItem('trees', JSON.stringify(updatedTrees));
    }
  });
  
  const [movingNode, setMovingNode] = useState(null);
  const [connectingNode, setConnectingNode] = useState(null);

  // Enhanced initial data load with schema detection
  useEffect(() => {
    console.log('🚀 Enhanced initial data load effect');
    
    const checkAndLoadData = async () => {
      setIsLoading(true);
      
      const hasUsedBefore = localStorage.getItem('hasUsedTreeApp');
      const savedTrees = localStorage.getItem('trees');
      
      if (!hasUsedBefore || !savedTrees) {
        console.log('👋 First time user detected');
        setIsFirstTimeUser(true);
        setIsLoading(false);
        return;
      }
      
      try {
        const parsedTrees = JSON.parse(savedTrees);
        if (parsedTrees && typeof parsedTrees === 'object' && Object.keys(parsedTrees).length > 0) {
          console.log('📁 Restored enhanced trees from localStorage:', Object.keys(parsedTrees));
          
          // Enhanced logging for schema detection
          Object.entries(parsedTrees).forEach(([fileName, tree]) => {
            if (tree.nodes) {
              const hasAdditionalFields = Object.values(tree.nodes).some(node => node.additionalFields);
              const fieldTypes = new Set();
              
              Object.values(tree.nodes).forEach(node => {
                if (node.additionalFields) {
                  Object.keys(node.additionalFields).forEach(field => fieldTypes.add(field));
                }
              });
              
              console.log(`📊 Tree ${fileName}:`, {
                nodes: Object.keys(tree.nodes).length,
                hasAdditionalFields,
                additionalFieldTypes: Array.from(fieldTypes)
              });
            }
          });
          
          setTrees(parsedTrees);
          
          const firstTreeName = Object.keys(parsedTrees)[0];
          setSelectedTree(firstTreeName);
          console.log('🎯 Auto-selected first tree:', firstTreeName);
          
          setIsFirstTimeUser(false);
        } else {
          console.log('📁 Invalid localStorage data, treating as first time user');
          setIsFirstTimeUser(true);
        }
      } catch (e) {
        console.error('❌ Parse error:', e);
        setIsFirstTimeUser(true);
      }
      
      setIsLoading(false);
    };
    
    checkAndLoadData();
  }, []);

  // Enhanced multi-file import handler with flexible schema support
  const handleJsonImport = useCallback(async (importedTrees) => {
    console.log('📥 Enhanced import started:', importedTrees);
    
    if (!Array.isArray(importedTrees)) return;
    
    setImportLoading(true);
    const newTrees = {};
    let totalAdditionalFields = 0;
    const allAdditionalFieldTypes = new Set();
    
    importedTrees.forEach(item => {
      if (item.fileName && item.data && item.data.nodes && item.data.nodes.root) {
        newTrees[item.fileName] = item.data;
        
        // Enhanced logging for additional fields
        Object.values(item.data.nodes).forEach(node => {
          if (node.additionalFields) {
            const fieldCount = Object.keys(node.additionalFields).length;
            totalAdditionalFields += fieldCount;
            Object.keys(node.additionalFields).forEach(field => {
              allAdditionalFieldTypes.add(field);
            });
          }
        });
      }
    });
    
    if (Object.keys(newTrees).length > 0) {
      setTrees(newTrees);
      
      // Enhanced localStorage save with metadata
      const enhancedSaveData = {
        ...newTrees,
        metadata: {
          importedAt: new Date().toISOString(),
          totalAdditionalFields,
          additionalFieldTypes: Array.from(allAdditionalFieldTypes),
          schemaVersion: '2.0'
        }
      };
      localStorage.setItem('trees', JSON.stringify(enhancedSaveData));
      
      localStorage.setItem('hasUsedTreeApp', 'true');
      
      const firstImportedTree = Object.keys(newTrees)[0];
      setSelectedTree(firstImportedTree);
      
      setIsFirstTimeUser(false);
      
      console.log('✅ Enhanced import successful:', {
        files: Object.keys(newTrees).length,
        totalNodes: Object.values(newTrees).reduce((sum, tree) => sum + Object.keys(tree.nodes).length, 0),
        totalAdditionalFields,
        additionalFieldTypes: Array.from(allAdditionalFieldTypes)
      });
      
      const message = totalAdditionalFields > 0 
        ? `✅ Import thành công ${Object.keys(newTrees).length} file JSON với ${totalAdditionalFields} trường bổ sung!`
        : `✅ Import thành công ${Object.keys(newTrees).length} file JSON!`;
      
      alert(message);
    }
    
    setImportLoading(false);
  }, []);

  // Enhanced CRUD operations with additional fields preservation
  const handleAddNode = useCallback((fileName, parentId, text) => {
    console.log('➕ Enhanced add node:', { fileName, parentId, text });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[parentId]) return prev;
      
      const newId = `node_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: {
            ...tree.nodes,
            [newId]: {
              text: text.trim(),
              cha: parentId,
              con: [],
              // Preserve any additional fields from parent context if needed
              ...(tree.nodes[parentId].additionalFields && tree.nodes[parentId].additionalFields.inheritToChildren 
                  ? { additionalFields: { inherited: true, fromParent: parentId } } 
                  : {})
            },
            [parentId]: {
              ...tree.nodes[parentId],
              con: [...tree.nodes[parentId].con, newId]
            }
          }
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      return updated;
    });
    
    return true;
  }, []);

  const handleEditNode = useCallback((fileName, nodeId, newText) => {
    console.log('✏️ Enhanced edit node:', { fileName, nodeId, newText: newText.substring(0, 50) + '...' });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[nodeId]) return prev;
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: {
            ...tree.nodes,
            [nodeId]: {
              ...tree.nodes[nodeId],
              text: newText.trim(),
              // Preserve additional fields during edit
              ...(tree.nodes[nodeId].additionalFields ? {
                additionalFields: {
                  ...tree.nodes[nodeId].additionalFields,
                  lastModified: new Date().toISOString()
                }
              } : {})
            }
          }
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      return updated;
    });
    
    return true;
  }, []);

  const handleMoveNode = useCallback((fileName, nodeId, newParentId) => {
    console.log('🔄 Enhanced move node:', { fileName, nodeId, newParentId });
    
    if (nodeId === newParentId || nodeId === 'root') return false;
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[nodeId] || !tree.nodes[newParentId]) return prev;
      
      const oldParentId = tree.nodes[nodeId].cha;
      let newNodes = { ...tree.nodes };
      
      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId] = {
          ...newNodes[oldParentId],
          con: newNodes[oldParentId].con.filter(id => id !== nodeId)
        };
      }
      
      newNodes[newParentId] = {
        ...newNodes[newParentId],
        con: [...newNodes[newParentId].con, nodeId]
      };
      
      newNodes[nodeId] = {
        ...newNodes[nodeId],
        cha: newParentId,
        // Enhanced: Update additional fields for move operation
        ...(newNodes[nodeId].additionalFields ? {
          additionalFields: {
            ...newNodes[nodeId].additionalFields,
            lastMoved: new Date().toISOString(),
            previousParent: oldParentId
          }
        } : {})
      };
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: newNodes
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      return updated;
    });
    
    return true;
  }, []);

  // Enhanced reordering with additional fields preservation
  const handleReorderChildren = useCallback((fileName, parentId, newChildrenOrder) => {
    console.log('📋 Enhanced reorder children:', { fileName, parentId, newChildrenOrder });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[parentId]) return prev;
      
      const newNodes = {
        ...tree.nodes,
        [parentId]: {
          ...tree.nodes[parentId],
          con: newChildrenOrder,
          // Enhanced: Track reorder operations
          ...(tree.nodes[parentId].additionalFields ? {
            additionalFields: {
              ...tree.nodes[parentId].additionalFields,
              lastReordered: new Date().toISOString()
            }
          } : {})
        }
      };
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: newNodes
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      return updated;
    });
    
    return true;
  }, []);

  // Enhanced merging with metadata preservation
  const handleMergeNodes = useCallback((fileName, nodeIds) => {
    console.log('🔗 Enhanced handleMergeNodes called:', { fileName, nodeIds });
    
    if (nodeIds.length < 2) {
      console.log('❌ Not enough nodes to merge');
      return false;
    }
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree) {
        console.log('❌ Tree not found:', fileName);
        return prev;
      }
      
      const firstParent = tree.nodes[nodeIds[0]]?.cha;
      
      const allValid = nodeIds.every(nodeId => {
        const node = tree.nodes[nodeId];
        const isLeaf = !node.con || node.con.length === 0;
        const sameParent = node.cha === firstParent;
        return node && isLeaf && sameParent;
      });
      
      if (!allValid) {
        console.log('❌ Validation failed');
        return prev;
      }
      
      const parentNode = tree.nodes[firstParent];
      if (!parentNode) {
        console.log('❌ Parent node not found:', firstParent);
        return prev;
      }
      
      const sortedNodeIds = nodeIds.sort((a, b) => {
        const indexA = parentNode.con.indexOf(a);
        const indexB = parentNode.con.indexOf(b);
        return indexA - indexB;
      });
      
      const mergedContent = sortedNodeIds
        .map(nodeId => tree.nodes[nodeId].text)
        .join('\n\n');
      
      const mergedNodeId = `merged_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      
      let newNodes = { ...tree.nodes };
      
      // Enhanced: Combine additional fields from all merged nodes
      const combinedAdditionalFields = {};
      sortedNodeIds.forEach((nodeId, index) => {
        const node = tree.nodes[nodeId];
        if (node.additionalFields) {
          Object.entries(node.additionalFields).forEach(([key, value]) => {
            if (combinedAdditionalFields[key]) {
              // If field exists, make it an array
              if (!Array.isArray(combinedAdditionalFields[key])) {
                combinedAdditionalFields[key] = [combinedAdditionalFields[key]];
              }
              combinedAdditionalFields[key].push(value);
            } else {
              combinedAdditionalFields[key] = value;
            }
          });
        }
      });
      
      newNodes[mergedNodeId] = {
        text: mergedContent,
        cha: firstParent,
        con: [],
        mergeMetadata: {
          originalCount: sortedNodeIds.length,
          originalTexts: sortedNodeIds.map(nodeId => tree.nodes[nodeId].text),
          mergedAt: Date.now()
        },
        // Enhanced: Include combined additional fields
        ...(Object.keys(combinedAdditionalFields).length > 0 ? {
          additionalFields: {
            ...combinedAdditionalFields,
            mergedFrom: sortedNodeIds,
            mergeOperation: true
          }
        } : {})
      };
      
      sortedNodeIds.forEach(nodeId => {
        delete newNodes[nodeId];
      });
      
      const newParentChildren = parentNode.con.filter(childId => !nodeIds.includes(childId));
      const firstNodeIndex = parentNode.con.indexOf(sortedNodeIds[0]);
      newParentChildren.splice(firstNodeIndex, 0, mergedNodeId);
      
      newNodes[firstParent] = {
        ...newNodes[firstParent],
        con: newParentChildren
      };
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: newNodes
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      console.log('✅ Enhanced merge completed successfully');
      return updated;
    });
    
    return true;
  }, []);

  // Enhanced split with additional fields restoration
  const handleSplitNode = useCallback((fileName, nodeId) => {
    console.log('✂️ Enhanced handleSplitNode called:', { fileName, nodeId });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree) {
        console.log('❌ Tree not found:', fileName);
        return prev;
      }
      
      const node = tree.nodes[nodeId];
      if (!node || !node.text) {
        console.log('❌ Node not found or no text:', nodeId);
        return prev;
      }
      
      if (node.mergeMetadata && node.mergeMetadata.originalTexts) {
        console.log('📋 Enhanced splitting merged node using metadata');
        return splitUsingMetadata(prev, fileName, nodeId, node);
      } else {
        console.log('📋 Enhanced splitting by paragraphs (fallback)');
        return splitByParagraphs(prev, fileName, nodeId, node);
      }
    });
    
    return true;
  }, []);

  // Enhanced split helper functions
  const splitUsingMetadata = (trees, fileName, nodeId, node) => {
    const tree = trees[fileName];
    const { originalTexts, originalCount } = node.mergeMetadata;
    
    const parentId = node.cha;
    const parentNode = tree.nodes[parentId];
    
    if (!parentNode) {
      console.log('❌ Parent node not found');
      return trees;
    }
    
    let newNodes = { ...tree.nodes };
    
    newNodes[nodeId] = {
      ...node,
      text: originalTexts[0].trim(),
      mergeMetadata: undefined,
      // Enhanced: Restore original additional fields if available
      ...(node.additionalFields && node.additionalFields.mergedFrom ? {
        additionalFields: {
          ...node.additionalFields,
          splitOperation: true,
          splitAt: new Date().toISOString(),
          originalIndex: 0
        }
      } : {})
    };
    
    const newNodeIds = [];
    originalTexts.slice(1).forEach((originalText, index) => {
      const newNodeId = `split_${Date.now()}_${index}_${Math.floor(Math.random()*10000)}`;
      newNodeIds.push(newNodeId);
      
      newNodes[newNodeId] = {
        text: originalText.trim(),
        cha: parentId,
        con: [],
        // Enhanced: Add split metadata
        ...(node.additionalFields ? {
          additionalFields: {
            splitOperation: true,
            splitAt: new Date().toISOString(),
            originalIndex: index + 1,
            splitFromNode: nodeId
          }
        } : {})
      };
    });
    
    const currentChildren = [...parentNode.con];
    const originalIndex = currentChildren.indexOf(nodeId);
    
    if (originalIndex !== -1) {
      currentChildren.splice(originalIndex + 1, 0, ...newNodeIds);
      newNodes[parentId] = {
        ...newNodes[parentId],
        con: currentChildren
      };
    }
    
    const updated = {
      ...trees,
      [fileName]: {
        ...tree,
        nodes: newNodes
      }
    };
    
    localStorage.setItem('trees', JSON.stringify(updated));
    console.log(`✅ Enhanced split completed: ${originalCount} nodes restored`);
    return updated;
  };

  const splitByParagraphs = (trees, fileName, nodeId, node) => {
    const tree = trees[fileName];
    
    const paragraphs = node.text.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length < 2) {
      console.log('❌ Node does not contain multiple paragraphs');
      return trees;
    }
    
    const parentId = node.cha;
    const parentNode = tree.nodes[parentId];
    
    if (!parentNode) {
      console.log('❌ Parent node not found');
      return trees;
    }
    
    let newNodes = { ...tree.nodes };
    
    newNodes[nodeId] = {
      ...node,
      text: paragraphs[0].trim()
    };
    
    const newNodeIds = [];
    paragraphs.slice(1).forEach((paragraph, index) => {
      const newNodeId = `split_${Date.now()}_${index}_${Math.floor(Math.random()*10000)}`;
      newNodeIds.push(newNodeId);
      
      newNodes[newNodeId] = {
        text: paragraph.trim(),
        cha: parentId,
        con: [],
        // Enhanced: Add paragraph split metadata
        ...(node.additionalFields ? {
          additionalFields: {
            paragraphSplit: true,
            splitAt: new Date().toISOString(),
            paragraphIndex: index + 1,
            splitFromNode: nodeId
          }
        } : {})
      };
    });
    
    const currentChildren = [...parentNode.con];
    const originalIndex = currentChildren.indexOf(nodeId);
    
    if (originalIndex !== -1) {
      currentChildren.splice(originalIndex + 1, 0, ...newNodeIds);
      newNodes[parentId] = {
        ...newNodes[parentId],
        con: currentChildren
      };
    }
    
    const updated = {
      ...trees,
      [fileName]: {
        ...tree,
        nodes: newNodes
      }
    };
    
    localStorage.setItem('trees', JSON.stringify(updated));
    console.log('✅ Enhanced split by paragraphs completed');
    return updated;
  };

  const handleMergeWithParent = useCallback((fileName, nodeId) => {
    console.log('⬆️ Enhanced handleMergeWithParent called:', { fileName, nodeId });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree) return prev;
      
      const node = tree.nodes[nodeId];
      if (!node) return prev;
      
      const parentId = node.cha;
      const parentNode = tree.nodes[parentId];
      
      if (!parentNode || parentId === 'root') return prev;
      
      if (node.con && node.con.length > 0) return prev;
      
      let newNodes = { ...tree.nodes };
      
      const combinedText = parentNode.text + '\n\n' + node.text;
      
      const existingMetadata = parentNode.parentMergeMetadata;
      let newMetadata;
      
      if (existingMetadata) {
        newMetadata = {
          originalParentText: existingMetadata.originalParentText,
          mergedChildren: [
            ...existingMetadata.mergedChildren,
            {
              childText: node.text,
              childId: nodeId,
              mergedAt: Date.now(),
              // Enhanced: Include child's additional fields
              childAdditionalFields: node.additionalFields || {}
            }
          ]
        };
      } else {
        newMetadata = {
          originalParentText: parentNode.text,
          mergedChildren: [
            {
              childText: node.text,
              childId: nodeId,
              mergedAt: Date.now(),
              childAdditionalFields: node.additionalFields || {}
            }
          ]
        };
      }
      
      newNodes[parentId] = {
        ...parentNode,
        text: combinedText,
        parentMergeMetadata: newMetadata,
        // Enhanced: Combine additional fields
        ...(parentNode.additionalFields || node.additionalFields ? {
          additionalFields: {
            ...parentNode.additionalFields,
            ...node.additionalFields,
            parentChildMerge: true,
            mergedAt: new Date().toISOString()
          }
        } : {})
      };
      
      delete newNodes[nodeId];
      
      newNodes[parentId] = {
        ...newNodes[parentId],
        con: newNodes[parentId].con.filter(childId => childId !== nodeId)
      };
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: newNodes
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      console.log('✅ Enhanced merge with parent completed successfully');
      return updated;
    });
    
    return true;
  }, []);

  const handleSplitFromParent = useCallback((fileName, nodeId) => {
    console.log('↙️ Enhanced handleSplitFromParent called:', { fileName, nodeId });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree) return prev;
      
      const node = tree.nodes[nodeId];
      if (!node || !node.parentMergeMetadata) return prev;
      
      const { originalParentText, mergedChildren } = node.parentMergeMetadata;
      
      let newNodes = { ...tree.nodes };
      
      newNodes[nodeId] = {
        ...node,
        text: originalParentText,
        parentMergeMetadata: undefined
      };
      
      const newChildIds = [];
      mergedChildren.forEach((childData, index) => {
        const newChildId = `split_child_${Date.now()}_${index}_${Math.floor(Math.random()*10000)}`;
        newChildIds.push(newChildId);
        
        newNodes[newChildId] = {
          text: childData.childText,
          cha: nodeId,
          con: [],
          // Enhanced: Restore child's additional fields
          ...(childData.childAdditionalFields && Object.keys(childData.childAdditionalFields).length > 0 ? {
            additionalFields: {
              ...childData.childAdditionalFields,
              restoredFromParent: true,
              restoredAt: new Date().toISOString()
            }
          } : {})
        };
      });
      
      newNodes[nodeId] = {
        ...newNodes[nodeId],
        con: [...newNodes[nodeId].con, ...newChildIds]
      };
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: newNodes
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      console.log(`✅ Enhanced split from parent completed: restored ${mergedChildren.length} children`);
      return updated;
    });
    
    return true;
  }, []);

  const handleDeleteNode = useCallback((fileName, nodeId) => {
    console.log('🗑️ Enhanced delete node:', { fileName, nodeId });
    
    if (nodeId === 'root') return false;
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[nodeId]) return prev;
      
      const deleteRecursive = (nodes, id) => {
        const node = nodes[id];
        if (!node) return;
        
        // Enhanced: Log deletion of nodes with additional fields
        if (node.additionalFields) {
          console.log(`🗑️ Deleting node ${id} with additional fields:`, Object.keys(node.additionalFields));
        }
        
        if (node.con && node.con.length > 0) {
          node.con.forEach(childId => deleteRecursive(nodes, childId));
        }
        delete nodes[id];
      };
      
      let newNodes = { ...tree.nodes };
      deleteRecursive(newNodes, nodeId);
      
      Object.keys(newNodes).forEach(id => {
        if (newNodes[id].con) {
          newNodes[id] = {
            ...newNodes[id],
            con: newNodes[id].con.filter(cid => cid !== nodeId)
          };
        }
      });
      
      const updated = {
        ...prev,
        [fileName]: {
          ...tree,
          nodes: newNodes
        }
      };
      
      localStorage.setItem('trees', JSON.stringify(updated));
      return updated;
    });
    
    return true;
  }, []);

  // Enhanced helper functions
  const handleIsNodeDisconnected = useCallback((fileName, nodeId) => {
    const tree = trees[fileName];
    return tree?.disconnectedNodes?.includes(nodeId) || false;
  }, [trees]);

  const handleDragStart = useCallback((nodeId, mouseEvent, currentPosition) => {
    startDrag(nodeId, mouseEvent, currentPosition);
  }, [startDrag]);

  const handleSetViewMode = useCallback((mode) => {
    if (viewMode === 'dfs' && mode !== 'dfs' && dfsViewRef.current?.getScrollPosition) {
      setDfsScroll(dfsViewRef.current.getScrollPosition());
    }
    setViewMode(mode);
  }, [viewMode]);

  const handleMouseMove = useCallback((e) => {
    if (dragState.isDragging) updateDrag(e);
  }, [dragState.isDragging, updateDrag]);

  const handleMouseUp = useCallback((e) => {
    if (dragState.isDragging) endDrag();
  }, [dragState.isDragging, endDrag]);

  useEffect(() => {
    if (viewMode === 'canvas' && dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [viewMode, dragState.isDragging, handleMouseMove, handleMouseUp]);

  const handleShowTreeSelector = () => {
    if (Object.keys(trees).length > 1) {
      setShowTreeSelector(true);
    }
  };

  const handleSelectTree = (fileName) => {
    setSelectedTree(fileName);
    setShowTreeSelector(false);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="tree-hierarchy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
        <div className="text-lg font-semibold text-gray-700">Đang khởi động ứng dụng nâng cao...</div>
        <div className="text-sm text-gray-500">Đang tải hỗ trợ schema linh hoạt...</div>
      </div>
    );
  }

  // First time user screen
  if (isFirstTimeUser) {
    return <WelcomeScreen onImport={handleJsonImport} isLoading={importLoading} />;
  }

  // No valid data screen (fallback)
  if (!currentTree || !currentTree.nodes || !currentTree.nodes.root) {
    return (
      <div className="tree-hierarchy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="text-lg font-semibold text-gray-700">Dữ liệu cây bị lỗi</div>
        <div className="text-sm text-gray-500">Vui lòng import lại file JSON</div>
        <JsonImporter 
          onImport={handleJsonImport}
          isLoading={importLoading}
          currentData={{ trees, selectedTree }}
          hideButtons={false}
        />
      </div>
    );
  }

  console.log('✅ Rendering enhanced main UI with tree:', selectedTree, 'nodes:', Object.keys(currentTree.nodes).length);

  // Enhanced statistics for current tree
  const currentTreeStats = (() => {
    if (!currentTree.nodes) return { nodes: 0, additionalFields: 0, fieldTypes: [] };
    
    const nodeCount = Object.keys(currentTree.nodes).length;
    let additionalFieldsCount = 0;
    const fieldTypes = new Set();
    
    Object.values(currentTree.nodes).forEach(node => {
      if (node.additionalFields) {
        additionalFieldsCount += Object.keys(node.additionalFields).length;
        Object.keys(node.additionalFields).forEach(field => fieldTypes.add(field));
      }
    });
    
    return {
      nodes: nodeCount,
      additionalFields: additionalFieldsCount,
      fieldTypes: Array.from(fieldTypes)
    };
  })();

  return (
    <div className="tree-hierarchy">
      <div className="tree-header">
        <h1 className="tree-title">🌳 Enhanced Tree Hierarchy Manager</h1>
        
        {/* Enhanced Import section */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <JsonImporter 
            onImport={handleJsonImport}
            isLoading={importLoading}
            currentData={{ trees, selectedTree }}
            hideButtons={true}
          />
        </div>

        {/* View mode buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            <button
              onClick={() => { handleSetViewMode('canvas'); setMovingNode(null); setConnectingNode(null); if (dragState.isDragging) endDrag(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: viewMode === 'canvas' ? '#3b82f6' : 'transparent',
                color: viewMode === 'canvas' ? 'white' : '#6b7280'
              }}
            >
              <LayoutGrid className="w-4 h-4" />
              Canvas View
            </button>
            <button
              onClick={() => { handleSetViewMode('tree'); setMovingNode(null); setConnectingNode(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: viewMode === 'tree' ? '#3b82f6' : 'transparent',
                color: viewMode === 'tree' ? 'white' : '#6b7280'
              }}
            >
              <List className="w-4 h-4" />
              Tree View
            </button>
            <button
              onClick={() => { handleSetViewMode('dfs'); setMovingNode(null); setConnectingNode(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: viewMode === 'dfs' ? '#3b82f6' : 'transparent',
                color: viewMode === 'dfs' ? 'white' : '#6b7280'
              }}
            >
              <FileText className="w-4 h-4" />
              <span>DFS Full Content</span>
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Enhanced file count indicator with additional fields info */}
        {Object.keys(trees).length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            <div>
              📁 {Object.keys(trees).length} file(s) • {currentTreeStats.nodes} node(s) • 
              Hiện tại: <strong>{selectedTree}</strong>
            </div>
            {currentTreeStats.additionalFields > 0 && (
              <div style={{ color: '#059669', fontSize: '11px', marginTop: '2px' }}>
                🆕 {currentTreeStats.additionalFields} additional fields 
                ({currentTreeStats.fieldTypes.slice(0, 3).join(', ')}
                {currentTreeStats.fieldTypes.length > 3 ? '...' : ''})
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render views */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {viewMode === 'dfs' ? (
          <div style={{ 
            flex: 1, 
            height: '100%',
            border: '2px solid #e5e7eb',
            borderRadius: '1rem',
            background: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <DfsTextView
              ref={dfsViewRef}
              nodes={currentTree.nodes}
              disconnectedNodes={currentTree.disconnectedNodes || []}
              dfsOrder={dfsOrder}
              onEditNode={handleEditNode}
              dfsScroll={dfsScroll}
              setDfsScroll={setDfsScroll}
              trees={trees}
              selectedTree={selectedTree}
              setSelectedTree={setSelectedTree}
              isNodeDisconnected={handleIsNodeDisconnected}
            />
          </div>
        ) : viewMode === 'canvas' ? (
          <div className="tree-canvas-container" style={{ 
            flex: 1, 
            overflow: 'auto',
            border: '2px solid #e5e7eb',
            borderRadius: '1rem',
            background: 'white',
            position: 'relative'
          }}>
            <TreeCanvas
              nodes={currentTree.nodes}
              positions={positions}
              canvasSize={canvasSize}
              dragState={dragState}
              onDragStart={handleDragStart}
              movingNode={movingNode}
              connectingNode={connectingNode}
              disconnectedNodes={currentTree.disconnectedNodes || []}
              onAddNode={handleAddNode}
              onEditNode={handleEditNode}
              onMoveNode={handleMoveNode}
              onDeleteNode={handleDeleteNode}
              onDisconnectNode={() => false}
              onConnectNode={() => false}
              isNodeDisconnected={() => false}
            />
          </div>
        ) : viewMode === 'tree' ? (
          <div style={{ 
            flex: 1, 
            height: '100%',
            overflow: 'auto',
            border: '2px solid #e5e7eb',
            borderRadius: '1rem',
            background: 'white'
          }}>
            <TreeView
              trees={trees}
              selectedTree={selectedTree}
              onEditNode={handleEditNode}
              onAddNode={handleAddNode}
              onMoveNode={handleMoveNode}
              onDeleteNode={handleDeleteNode}
              isNodeDisconnected={handleIsNodeDisconnected}
              onReorderChildren={handleReorderChildren}
              onMergeNodes={handleMergeNodes}
              onSplitNode={handleSplitNode}
              onMergeWithParent={handleMergeWithParent}
              onSplitFromParent={handleSplitFromParent}
            />
          </div>
        ) : null}
      </div>

      {/* Enhanced tree selector modal */}
      {showTreeSelector && (
        <TreeSelectorModal
          trees={trees}
          selectedTree={selectedTree}
          onSelect={handleSelectTree}
          onClose={() => setShowTreeSelector(false)}
        />
      )}
    </div>
  );
}

export default App;