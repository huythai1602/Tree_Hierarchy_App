import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';

const JsonImporter = ({ onImport, isLoading, currentData, hideButtons = false }) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Validate JSON structure
  const validateJsonStructure = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('File JSON phải chứa một object');
    }

    // Check current app format
    if (data.nodes && typeof data.nodes === 'object') {
      if (!data.nodes.root) {
        throw new Error('Dữ liệu phải có node "root"');
      }
      return true;
    }

    // Check document format
    if (data.root_id && data.tree && typeof data.tree === 'object') {
      return validateDocumentFormat(data);
    }

    throw new Error('File JSON không đúng format. Cần có "nodes" hoặc "root_id + tree"');
  };

  const validateDocumentFormat = (data) => {
    const { root_id, tree } = data;

    if (!root_id || typeof root_id !== 'string') {
      throw new Error('Phải có "root_id" (string)');
    }

    if (!tree[root_id]) {
      throw new Error(`Root node "${root_id}" không tồn tại trong tree`);
    }

    return true;
  };

  // Convert document format to app format
  const convertDocumentToAppFormat = (data) => {
    const { root_id, tree } = data;
    
    const convertedData = {
      nodes: {},
      disconnectedNodes: [],
      customPositions: {}
    };

    // Convert structure
    Object.keys(tree).forEach(nodeId => {
      const node = tree[nodeId];
      const newNodeId = nodeId === root_id ? 'root' : nodeId;
      
      convertedData.nodes[newNodeId] = {
        text: node.text || '',
        cha: nodeId === root_id ? null : 
             node.cha === root_id ? 'root' : 
             node.cha,
        con: (node.con || []).map(childId => childId === root_id ? 'root' : childId)
      };
    });

    return convertedData;
  };

  // File selection and processing
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    setError(null);
    setPreview(null);
    const previews = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        setError('Chỉ chấp nhận file .json');
        continue;
      }
      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        validateJsonStructure(jsonData);
        let processedData = jsonData;
        if (jsonData.root_id && jsonData.tree) {
          processedData = convertDocumentToAppFormat(jsonData);
        }
        const nodeCount = Object.keys(processedData.nodes).length;
        previews.push({
          fileName: file.name,
          nodeCount,
          hasRoot: !!processedData.nodes.root,
          data: processedData
        });
      } catch (error) {
        console.error('❌ Error processing file:', error);
        setError(`File ${file.name}: ${error.message}`);
      }
    }
    setPreview(previews);
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    handleFileSelect(files);
    event.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));
    
    if (jsonFile) {
      handleFileSelect(files);
    } else {
      setError('Vui lòng thả file .json');
    }
  };

  const handleImport = () => {
    if (preview && preview.data) {
      onImport(preview.data);
      setPreview(null);
      setError(null);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
  };

  const handleExport = () => {
    if (!currentData) return;

    const exportData = {
      nodes: currentData.nodes || {},
      disconnectedNodes: currentData.disconnectedNodes || [],
      customPositions: currentData.customPositions || {}
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="json-importer">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        multiple
        style={{ display: 'none' }}
      />

      {/* Buttons - only show if hideButtons is false */}
      {!hideButtons && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <Upload className="w-4 h-4" />
            Import JSON (Full Content)
          </button>

          <button
            onClick={handleExport}
            disabled={!currentData?.nodes}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !currentData?.nodes ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: !currentData?.nodes ? 0.6 : 1
            }}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      )}

      {/* Drag & Drop Area - always visible */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: '16px',
          border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: '8px',
          backgroundColor: isDragOver ? '#eff6ff' : '#f9fafb',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: isDragOver ? '#3b82f6' : '#6b7280',
          fontWeight: '500'
        }}>
          {isDragOver ? 'Thả file JSON vào đây' : 'Kéo thả file JSON hoặc click để chọn'}
        </p>
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '12px', 
          color: '#9ca3af'
        }}>
          Hỗ trợ cả App format và Document format
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Dialog for multiple files */}
      {preview && Array.isArray(preview) && preview.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '95%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                📋 Xác nhận Import nhiều file JSON
              </h3>
              <button onClick={handleCancel} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {preview.map((item, idx) => (
                <div key={item.fileName + idx} style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
                  <div><strong>File:</strong> {item.fileName}</div>
                  <div><strong>Tổng số nodes:</strong> {item.nodeCount}</div>
                  <div><strong>Node root:</strong> {item.hasRoot ? '✅ Có' : '❌ Không'}</div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#92400e',
              border: '1px solid #f59e0b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <AlertCircle className="w-4 h-4" />
                <strong>Cảnh báo</strong>
              </div>
              <div>
                Thao tác này sẽ thay thế hoàn toàn dữ liệu hiện tại.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (preview && preview.length > 0) {
                    onImport(preview.map(item => ({
                      fileName: item.fileName,
                      data: item.data
                    })));
                    setPreview(null);
                    setError(null);
                  }
                }}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                <CheckCircle className="w-4 h-4" />
                {isLoading ? 'Đang import...' : 'Xác nhận Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonImporter;