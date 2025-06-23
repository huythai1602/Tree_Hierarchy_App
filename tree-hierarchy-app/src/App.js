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

// TreeSelectorModal: popup chọn cây
const TreeSelectorModal = ({ trees, selectedTree, onSelect, onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: 0, marginBottom: 16, fontSize: 20, color: '#1d4ed8' }}>Chọn cây dữ liệu để hiển thị</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.keys(trees).map(fileName => (
            <li key={fileName} style={{ marginBottom: 12 }}>
              <button
                onClick={() => { onSelect(fileName); onClose(); }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FolderOpen className="w-4 h-4" />
                {fileName}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} style={{ marginTop: 20, background: '#e5e7eb', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', color: '#374151', fontWeight: 500 }}>Đóng</button>
      </div>
    </div>
  );
};

// Welcome Screen for first-time users
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
      <div style={{ maxWidth: '600px', padding: '0 24px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          textShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          🌳 Tree Hierarchy Manager
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          marginBottom: '32px',
          opacity: 0.9,
          lineHeight: 1.6
        }}>
          Chào mừng bạn đến với ứng dụng quản lý cây phân cấp! 
          Hãy bắt đầu bằng cách import các file JSON chứa dữ liệu cây của bạn.
        </p>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
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
            Import Dữ Liệu JSON
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
          <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>💡 Tính năng chính:</h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px'
          }}>
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
  console.log('🔄 App render');

  // Multi-tree state
  const [trees, setTrees] = useState({}); 
  const [selectedTree, setSelectedTree] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('canvas');
  const [importLoading, setImportLoading] = useState(false);
  const [dfsScroll, setDfsScroll] = useState(0);
  const dfsViewRef = useRef(null);

  // Modal chọn cây
  const [showTreeSelector, setShowTreeSelector] = useState(false);
  
  // First time user flag
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Get current tree
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
      
      // Save to localStorage
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

  // Initial data load with first-time user detection
  useEffect(() => {
    console.log('🚀 Initial data load effect');
    
    const checkAndLoadData = async () => {
      setIsLoading(true);
      
      // Check if user has used the app before
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
          console.log('📁 Restored trees from localStorage:', Object.keys(parsedTrees));
          setTrees(parsedTrees);
          
          // Auto-select first tree
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

  // Multi-file import handler
  const handleJsonImport = useCallback(async (importedTrees) => {
    console.log('📥 Import started:', importedTrees);
    
    if (!Array.isArray(importedTrees)) return;
    
    setImportLoading(true);
    const newTrees = {};
    
    importedTrees.forEach(item => {
      if (item.fileName && item.data && item.data.nodes && item.data.nodes.root) {
        newTrees[item.fileName] = item.data;
      }
    });
    
    if (Object.keys(newTrees).length > 0) {
      setTrees(newTrees);
      localStorage.setItem('trees', JSON.stringify(newTrees));
      
      // Mark as no longer first time user
      localStorage.setItem('hasUsedTreeApp', 'true');
      
      // Auto-select first imported tree
      const firstImportedTree = Object.keys(newTrees)[0];
      setSelectedTree(firstImportedTree);
      
      // Exit first time user mode
      setIsFirstTimeUser(false);
      
      console.log('✅ Import successful:', Object.keys(newTrees));
      alert(`✅ Import thành công ${Object.keys(newTrees).length} file JSON!`);
    }
    
    setImportLoading(false);
  }, []);

  // CRUD operations
  const handleAddNode = useCallback((fileName, parentId, text) => {
    console.log('➕ Add node:', { fileName, parentId, text });
    
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
              con: []
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
    console.log('✏️ Edit node:', { fileName, nodeId, newText: newText.substring(0, 50) + '...' });
    
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
              text: newText.trim()
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
    console.log('🔄 Move node:', { fileName, nodeId, newParentId });
    
    if (nodeId === newParentId || nodeId === 'root') return false;
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[nodeId] || !tree.nodes[newParentId]) return prev;
      
      // Remove from old parent
      const oldParentId = tree.nodes[nodeId].cha;
      let newNodes = { ...tree.nodes };
      
      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId] = {
          ...newNodes[oldParentId],
          con: newNodes[oldParentId].con.filter(id => id !== nodeId)
        };
      }
      
      // Add to new parent
      newNodes[newParentId] = {
        ...newNodes[newParentId],
        con: [...newNodes[newParentId].con, nodeId]
      };
      
      // Update node's parent
      newNodes[nodeId] = {
        ...newNodes[nodeId],
        cha: newParentId
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

  // Handle reordering children within same parent
  const handleReorderChildren = useCallback((fileName, parentId, newChildrenOrder) => {
    console.log('📋 Reorder children:', { fileName, parentId, newChildrenOrder });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[parentId]) return prev;
      
      const newNodes = {
        ...tree.nodes,
        [parentId]: {
          ...tree.nodes[parentId],
          con: newChildrenOrder
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

  // Handle merging leaf nodes
  const handleMergeNodes = useCallback((fileName, nodeIds) => {
    console.log('🔗 handleMergeNodes called:', { fileName, nodeIds });
    
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
      
      console.log('📋 Current tree nodes:', Object.keys(tree.nodes));
      
      // Validate all nodes are leaf nodes and have same parent
      const firstParent = tree.nodes[nodeIds[0]]?.cha;
      console.log('👨‍👧‍👦 First parent:', firstParent);
      
      const allValid = nodeIds.every(nodeId => {
        const node = tree.nodes[nodeId];
        const isLeaf = !node.con || node.con.length === 0;
        const sameParent = node.cha === firstParent;
        console.log(`✅ Node ${nodeId}: isLeaf=${isLeaf}, sameParent=${sameParent}`);
        return node && isLeaf && sameParent;
      });
      
      if (!allValid) {
        console.log('❌ Validation failed');
        return prev;
      }
      
      // Sort nodes by current order in parent's children array
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
      
      console.log('📋 Sorted node IDs:', sortedNodeIds);
      
      // Merge content: combine all texts with double newlines
      const mergedContent = sortedNodeIds
        .map(nodeId => tree.nodes[nodeId].text)
        .join('\n\n');
      
      console.log('📝 Merged content length:', mergedContent.length);
      
      // Create new merged node
      const mergedNodeId = `merged_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      
      // Create new nodes object
      let newNodes = { ...tree.nodes };
      
      // Add merged node with metadata
      newNodes[mergedNodeId] = {
        text: mergedContent,
        cha: firstParent,
        con: [],
        // NEW: Store merge metadata for proper splitting
        mergeMetadata: {
          originalCount: sortedNodeIds.length,
          originalTexts: sortedNodeIds.map(nodeId => tree.nodes[nodeId].text),
          mergedAt: Date.now()
        }
      };
      
      // Remove original nodes from nodes object
      sortedNodeIds.forEach(nodeId => {
        delete newNodes[nodeId];
      });
      
      // Update parent's children array
      const newParentChildren = parentNode.con.filter(childId => !nodeIds.includes(childId));
      
      // Insert merged node at position of first original node
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
      console.log('✅ Merge completed successfully');
      return updated;
    });
    
    return true;
  }, []);

  // NEW: Handle splitting merged nodes
  const handleSplitNode = useCallback((fileName, nodeId) => {
    console.log('✂️ handleSplitNode called:', { fileName, nodeId });
    
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
      
      // Check if node has merge metadata (proper merged node)
      if (node.mergeMetadata && node.mergeMetadata.originalTexts) {
        console.log('📋 Splitting merged node using metadata');
        return splitUsingMetadata(prev, fileName, nodeId, node);
      } else {
        // Fallback: split by paragraphs for manually created multi-paragraph nodes
        console.log('📋 Splitting by paragraphs (fallback)');
        return splitByParagraphs(prev, fileName, nodeId, node);
      }
    });
    
    return true;
  }, []);

  // Helper function: Split using stored metadata
  const splitUsingMetadata = (trees, fileName, nodeId, node) => {
    const tree = trees[fileName];
    const { originalTexts, originalCount } = node.mergeMetadata;
    
    console.log('🔄 Splitting into original texts:', originalCount);
    
    const parentId = node.cha;
    const parentNode = tree.nodes[parentId];
    
    if (!parentNode) {
      console.log('❌ Parent node not found');
      return trees;
    }
    
    // Create new nodes object
    let newNodes = { ...tree.nodes };
    
    // Update the original node with first original text
    newNodes[nodeId] = {
      ...node,
      text: originalTexts[0].trim(),
      mergeMetadata: undefined // Remove metadata
    };
    
    // Create new nodes for remaining original texts
    const newNodeIds = [];
    originalTexts.slice(1).forEach((originalText, index) => {
      const newNodeId = `split_${Date.now()}_${index}_${Math.floor(Math.random()*10000)}`;
      newNodeIds.push(newNodeId);
      
      newNodes[newNodeId] = {
        text: originalText.trim(),
        cha: parentId,
        con: []
      };
    });
    
    // Update parent's children array
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
    console.log(`✅ Split completed: ${originalCount} nodes restored`);
    return updated;
  };

  // Helper function: Split by paragraphs (fallback)
  const splitByParagraphs = (trees, fileName, nodeId, node) => {
    const tree = trees[fileName];
    
    // Split by double newlines
    const paragraphs = node.text.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length < 2) {
      console.log('❌ Node does not contain multiple paragraphs');
      return trees;
    }
    
    console.log('📋 Splitting into paragraphs:', paragraphs.length);
    
    const parentId = node.cha;
    const parentNode = tree.nodes[parentId];
    
    if (!parentNode) {
      console.log('❌ Parent node not found');
      return trees;
    }
    
    // Create new nodes object
    let newNodes = { ...tree.nodes };
    
    // Update the original node with first paragraph
    newNodes[nodeId] = {
      ...node,
      text: paragraphs[0].trim()
    };
    
    // Create new nodes for remaining paragraphs
    const newNodeIds = [];
    paragraphs.slice(1).forEach((paragraph, index) => {
      const newNodeId = `split_${Date.now()}_${index}_${Math.floor(Math.random()*10000)}`;
      newNodeIds.push(newNodeId);
      
      newNodes[newNodeId] = {
        text: paragraph.trim(),
        cha: parentId,
        con: []
      };
    });
    
    // Update parent's children array
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
    console.log('✅ Split by paragraphs completed');
    return updated;
  };

  // NEW: Handle merging leaf node with parent
  const handleMergeWithParent = useCallback((fileName, nodeId) => {
    console.log('⬆️ handleMergeWithParent called:', { fileName, nodeId });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree) {
        console.log('❌ Tree not found:', fileName);
        return prev;
      }
      
      const node = tree.nodes[nodeId];
      if (!node) {
        console.log('❌ Node not found:', nodeId);
        return prev;
      }
      
      const parentId = node.cha;
      const parentNode = tree.nodes[parentId];
      
      if (!parentNode || parentId === 'root') {
        console.log('❌ Cannot merge with root or parent not found:', parentId);
        return prev;
      }
      
      // Check if node is leaf
      if (node.con && node.con.length > 0) {
        console.log('❌ Can only merge leaf nodes');
        return prev;
      }
      
      console.log('🔗 Merging node with parent');
      
      // Create new nodes object
      let newNodes = { ...tree.nodes };
      
      // Combine parent and child text
      const combinedText = parentNode.text + '\n\n' + node.text;
      
      // NEW: Enhanced metadata handling for multiple merges
      const existingMetadata = parentNode.parentMergeMetadata;
      let newMetadata;
      
      if (existingMetadata) {
        // Parent already has merged children - add this one to the list
        newMetadata = {
          originalParentText: existingMetadata.originalParentText, // Keep original parent text
          mergedChildren: [
            ...existingMetadata.mergedChildren,
            {
              childText: node.text,
              childId: nodeId,
              mergedAt: Date.now()
            }
          ]
        };
      } else {
        // First merge with this parent
        newMetadata = {
          originalParentText: parentNode.text,
          mergedChildren: [
            {
              childText: node.text,
              childId: nodeId,
              mergedAt: Date.now()
            }
          ]
        };
      }
      
      // Update parent with combined text and metadata
      newNodes[parentId] = {
        ...parentNode,
        text: combinedText,
        parentMergeMetadata: newMetadata
      };
      
      // Remove the child node from nodes
      delete newNodes[nodeId];
      
      // Remove child from parent's children array
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
      console.log('✅ Merge with parent completed successfully');
      return updated;
    });
    
    return true;
  }, []);

  // NEW: Handle splitting ALL parent-child merged nodes
  const handleSplitFromParent = useCallback((fileName, nodeId) => {
    console.log('↙️ handleSplitFromParent called:', { fileName, nodeId });
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree) {
        console.log('❌ Tree not found:', fileName);
        return prev;
      }
      
      const node = tree.nodes[nodeId];
      if (!node || !node.parentMergeMetadata) {
        console.log('❌ Node not found or no parent merge metadata:', nodeId);
        return prev;
      }
      
      const { originalParentText, mergedChildren } = node.parentMergeMetadata;
      
      console.log(`🔄 Splitting parent-child merge: ${mergedChildren.length} children`);
      
      // Create new nodes object
      let newNodes = { ...tree.nodes };
      
      // Restore parent to original text
      newNodes[nodeId] = {
        ...node,
        text: originalParentText,
        parentMergeMetadata: undefined // Remove metadata
      };
      
      // Create new child nodes for each merged child
      const newChildIds = [];
      mergedChildren.forEach((childData, index) => {
        const newChildId = `split_child_${Date.now()}_${index}_${Math.floor(Math.random()*10000)}`;
        newChildIds.push(newChildId);
        
        newNodes[newChildId] = {
          text: childData.childText,
          cha: nodeId,
          con: []
        };
      });
      
      // Add all children to parent's children array
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
      console.log(`✅ Split from parent completed: restored ${mergedChildren.length} children`);
      return updated;
    });
    
    return true;
  }, []);

  const handleDeleteNode = useCallback((fileName, nodeId) => {
    console.log('🗑️ Delete node:', { fileName, nodeId });
    
    if (nodeId === 'root') return false;
    
    setTrees(prev => {
      const tree = prev[fileName];
      if (!tree || !tree.nodes[nodeId]) return prev;
      
      // Recursive delete
      const deleteRecursive = (nodes, id) => {
        const node = nodes[id];
        if (!node) return;
        
        if (node.con && node.con.length > 0) {
          node.con.forEach(childId => deleteRecursive(nodes, childId));
        }
        delete nodes[id];
      };
      
      let newNodes = { ...tree.nodes };
      deleteRecursive(newNodes, nodeId);
      
      // Remove from all parents
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

  // Helper functions
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

  // Mouse events
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

  // Tree selector handlers
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
        <div className="text-lg font-semibold text-gray-700">Đang khởi động ứng dụng...</div>
        <div className="text-sm text-gray-500">Vui lòng đợi trong giây lát</div>
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

  console.log('✅ Rendering main UI with tree:', selectedTree, 'nodes:', Object.keys(currentTree.nodes).length);

  return (
    <div className="tree-hierarchy">
      <div className="tree-header">
        <h1 className="tree-title">🌳 Tree Hierarchy Manager</h1>
        
        {/* Import button only */}
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

        {/* File count indicator */}
        {Object.keys(trees).length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            color: '#9ca3af',
            marginBottom: '8px'
          }}>
            📁 {Object.keys(trees).length} file(s) • {Object.keys(currentTree.nodes).length} node(s) • Hiện tại: <strong>{selectedTree}</strong>
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