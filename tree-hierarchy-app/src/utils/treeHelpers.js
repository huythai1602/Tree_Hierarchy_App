// Kiểm tra xem nodeA có là tổ tiên của nodeB không
export const isAncestor = (nodes, ancestorId, nodeId) => {
  if (!nodes[nodeId] || !nodes[nodeId].cha) return false;
  if (nodes[nodeId].cha === ancestorId) return true;
  return isAncestor(nodes, ancestorId, nodes[nodeId].cha);
};

// Tạo ID mới cho node
export const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Xóa node và tất cả các node con
export const deleteNodeRecursive = (nodes, nodeId) => {
  const newNodes = { ...nodes };
  const nodeToDelete = newNodes[nodeId];
  
  if (!nodeToDelete) return newNodes;
  
  // Xóa tất cả các node con trước
  if (nodeToDelete.con && nodeToDelete.con.length > 0) {
    nodeToDelete.con.forEach(childId => {
      Object.assign(newNodes, deleteNodeRecursive(newNodes, childId));
    });
  }
  
  // Xóa node khỏi parent
  if (nodeToDelete.cha && newNodes[nodeToDelete.cha]) {
    newNodes[nodeToDelete.cha] = {
      ...newNodes[nodeToDelete.cha],
      con: newNodes[nodeToDelete.cha].con.filter(id => id !== nodeId)
    };
  }
  
  // Xóa node
  delete newNodes[nodeId];
  
  return newNodes;
};

// Validate dữ liệu cây
export const validateTreeData = (nodes) => {
  const errors = [];
  
  Object.keys(nodes).forEach(nodeId => {
    const node = nodes[nodeId];
    
    // Kiểm tra cấu trúc node
    if (!node.text || typeof node.text !== 'string') {
      errors.push(`Node ${nodeId}: text không hợp lệ`);
    }
    
    if (node.cha && !nodes[node.cha]) {
      errors.push(`Node ${nodeId}: parent ${node.cha} không tồn tại`);
    }
    
    if (!Array.isArray(node.con)) {
      errors.push(`Node ${nodeId}: con phải là array`);
    }
    
    // Kiểm tra tính nhất quán
    if (node.con) {
      node.con.forEach(childId => {
        if (!nodes[childId]) {
          errors.push(`Node ${nodeId}: child ${childId} không tồn tại`);
        } else if (nodes[childId].cha !== nodeId) {
          errors.push(`Node ${childId}: parent không khớp với ${nodeId}`);
        }
      });
    }
  });
  
  return errors;
};