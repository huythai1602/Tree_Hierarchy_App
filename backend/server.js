// File: backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'tree-data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Đảm bảo thư mục data tồn tại
const ensureDataDirectory = async () => {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Dữ liệu mặc định
const DEFAULT_DATA = {
  nodes: {
    'root': {
      text: 'Root',
      cha: null,
      con: ['chuong1', 'chuong2']
    },
    'chuong1': {
      text: 'Chương I',
      cha: 'root',
      con: ['dieu1', 'dieu2']
    },
    'chuong2': {
      text: 'Chương II',
      cha: 'root',
      con: ['dieu3', 'dieu4']
    },
    'dieu1': {
      text: 'Điều 1',
      cha: 'chuong1',
      con: ['chunk1', 'chunk2']
    },
    'dieu2': {
      text: 'Điều 2',
      cha: 'chuong1',
      con: ['chunk3']
    },
    'dieu3': {
      text: 'Điều 3',
      cha: 'chuong2',
      con: []
    },
    'dieu4': {
      text: 'Điều 4',
      cha: 'chuong2',
      con: []
    },
    'chunk1': {
      text: 'chunk 1',
      cha: 'dieu1',
      con: []
    },
    'chunk2': {
      text: 'chunk 2',
      cha: 'dieu1',
      con: []
    },
    'chunk3': {
      text: 'chunk 3',
      cha: 'dieu2',
      con: []
    }
  },
  customPositions: {},
  disconnectedNodes: [],
  metadata: {
    lastModified: new Date().toISOString(),
    version: '1.0.0'
  }
};

// Helper functions
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Tạo file dữ liệu mới với dữ liệu mặc định');
    await writeData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
};

const writeData = async (data) => {
  await ensureDataDirectory();
  data.metadata = {
    ...data.metadata,
    lastModified: new Date().toISOString()
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

// Validation functions
const validateNodeData = (nodes) => {
  const errors = [];
  
  // Kiểm tra root node
  if (!nodes.root) {
    errors.push('Root node không tồn tại');
  }
  
  // Kiểm tra cấu trúc của từng node
  Object.keys(nodes).forEach(nodeId => {
    const node = nodes[nodeId];
    
    if (!node.text || typeof node.text !== 'string') {
      errors.push(`Node ${nodeId}: text không hợp lệ`);
    }
    
    if (node.cha && !nodes[node.cha]) {
      errors.push(`Node ${nodeId}: parent ${node.cha} không tồn tại`);
    }
    
    if (!Array.isArray(node.con)) {
      errors.push(`Node ${nodeId}: con phải là array`);
    }
    
    // Kiểm tra tính nhất quán parent-child
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

// API Routes

// GET /api/tree - Lấy toàn bộ dữ liệu cây
app.get('/api/tree', async (req, res) => {
  try {
    const data = await readData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể đọc dữ liệu',
      message: error.message
    });
  }
});

// POST /api/tree - Lưu toàn bộ dữ liệu cây
app.post('/api/tree', async (req, res) => {
  try {
    const { nodes, customPositions, disconnectedNodes } = req.body;
    
    // Validation
    if (!nodes || typeof nodes !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu nodes không hợp lệ'
      });
    }
    
    const validationErrors = validateNodeData(nodes);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: validationErrors
      });
    }
    
    const data = {
      nodes,
      customPositions: customPositions || {},
      disconnectedNodes: disconnectedNodes || [],
      metadata: {
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    await writeData(data);
    
    res.json({
      success: true,
      message: 'Dữ liệu đã được lưu thành công',
      timestamp: data.metadata.lastModified
    });
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lưu dữ liệu',
      message: error.message
    });
  }
});

// PUT /api/tree/node/:nodeId - Cập nhật một node cụ thể
app.put('/api/tree/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { text, cha, con } = req.body;
    
    const data = await readData();
    
    if (!data.nodes[nodeId]) {
      return res.status(404).json({
        success: false,
        error: `Node ${nodeId} không tồn tại`
      });
    }
    
    // Cập nhật node
    data.nodes[nodeId] = {
      ...data.nodes[nodeId],
      ...(text !== undefined && { text }),
      ...(cha !== undefined && { cha }),
      ...(con !== undefined && { con })
    };
    
    await writeData(data);
    
    res.json({
      success: true,
      message: `Node ${nodeId} đã được cập nhật`,
      node: data.nodes[nodeId]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật node:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật node',
      message: error.message
    });
  }
});

// POST /api/tree/node - Thêm node mới
app.post('/api/tree/node', async (req, res) => {
  try {
    const { nodeId, text, parentId } = req.body;
    
    if (!nodeId || !text || !parentId) {
      return res.status(400).json({
        success: false,
        error: 'nodeId, text và parentId là bắt buộc'
      });
    }
    
    const data = await readData();
    
    if (data.nodes[nodeId]) {
      return res.status(409).json({
        success: false,
        error: `Node ${nodeId} đã tồn tại`
      });
    }
    
    if (!data.nodes[parentId]) {
      return res.status(404).json({
        success: false,
        error: `Parent node ${parentId} không tồn tại`
      });
    }
    
    // Tạo node mới
    data.nodes[nodeId] = {
      text,
      cha: parentId,
      con: []
    };
    
    // Thêm vào children list của parent
    data.nodes[parentId].con.push(nodeId);
    
    await writeData(data);
    
    res.json({
      success: true,
      message: `Node ${nodeId} đã được thêm`,
      node: data.nodes[nodeId]
    });
  } catch (error) {
    console.error('Lỗi khi thêm node:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể thêm node',
      message: error.message
    });
  }
});

// DELETE /api/tree/node/:nodeId - Xóa node
app.delete('/api/tree/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    if (nodeId === 'root') {
      return res.status(400).json({
        success: false,
        error: 'Không thể xóa root node'
      });
    }
    
    const data = await readData();
    
    if (!data.nodes[nodeId]) {
      return res.status(404).json({
        success: false,
        error: `Node ${nodeId} không tồn tại`
      });
    }
    
    // Xóa recursively
    const deleteRecursive = (id) => {
      const node = data.nodes[id];
      if (!node) return;
      
      // Xóa tất cả children trước
      if (node.con && node.con.length > 0) {
        node.con.forEach(childId => deleteRecursive(childId));
      }
      
      // Xóa khỏi parent
      if (node.cha && data.nodes[node.cha]) {
        data.nodes[node.cha].con = data.nodes[node.cha].con.filter(id => id !== id);
      }
      
      // Xóa khỏi disconnected list
      data.disconnectedNodes = data.disconnectedNodes.filter(id => id !== id);
      
      // Xóa node
      delete data.nodes[id];
    };
    
    deleteRecursive(nodeId);
    await writeData(data);
    
    res.json({
      success: true,
      message: `Node ${nodeId} và tất cả children đã được xóa`
    });
  } catch (error) {
    console.error('Lỗi khi xóa node:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa node',
      message: error.message
    });
  }
});

// POST /api/tree/reset - Reset về dữ liệu mặc định
app.post('/api/tree/reset', async (req, res) => {
  try {
    await writeData(DEFAULT_DATA);
    res.json({
      success: true,
      message: 'Dữ liệu đã được reset về mặc định',
      data: DEFAULT_DATA
    });
  } catch (error) {
    console.error('Lỗi khi reset dữ liệu:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể reset dữ liệu',
      message: error.message
    });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint không tìm thấy'
  });
});

// Start server
const startServer = async () => {
  await ensureDataDirectory();
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📁 Dữ liệu được lưu tại: ${DATA_FILE}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch(console.error);