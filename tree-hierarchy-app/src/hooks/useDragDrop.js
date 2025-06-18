// File: src/hooks/useDragDrop.js (ENHANCED WITH PERSISTENCE)
import { useState, useCallback, useRef } from 'react';

export const useDragDrop = (initialPositions = {}, onPositionsChange = null) => {
  const [customPositions, setCustomPositions] = useState(initialPositions);
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    mousePosition: { x: 0, y: 0 }
  });
  
  // Ref để lưu SVG element
  const svgRef = useRef(null);

  // Hàm helper để tìm SVG element
  const findSvgElement = useCallback((element) => {
    const svg = document.querySelector('.tree-svg') || 
                document.querySelector('svg') ||
                (element && element.closest && element.closest('svg'));
    return svg;
  }, []);

  // Bắt đầu drag
  const startDrag = useCallback((nodeId, mouseEvent, currentPosition) => {
    try {
      const svgElement = findSvgElement(mouseEvent.target);
      if (!svgElement) {
        console.warn('Không tìm thấy SVG element');
        return;
      }

      svgRef.current = svgElement;
      
      const svgRect = svgElement.getBoundingClientRect();
      const mouseX = mouseEvent.clientX - svgRect.left;
      const mouseY = mouseEvent.clientY - svgRect.top;
      
      const dragOffset = {
        x: mouseX - currentPosition.x,
        y: mouseY - currentPosition.y
      };

      setDragState({
        isDragging: true,
        draggedNode: nodeId,
        dragOffset,
        mousePosition: { x: mouseX, y: mouseY }
      });

      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      
    } catch (error) {
      console.error('Error starting drag:', error);
    }
  }, [findSvgElement]);

  // Cập nhật vị trí khi drag
  const updateDrag = useCallback((mouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedNode) return;

    try {
      const svgElement = svgRef.current || findSvgElement(null);
      if (!svgElement) {
        console.warn('Không tìm thấy SVG element trong updateDrag');
        return;
      }

      const svgRect = svgElement.getBoundingClientRect();
      const mouseX = mouseEvent.clientX - svgRect.left;
      const mouseY = mouseEvent.clientY - svgRect.top;

      // Tính vị trí mới với bounds checking
      const newX = Math.max(0, Math.min(mouseX - dragState.dragOffset.x, svgRect.width - 150));
      const newY = Math.max(0, Math.min(mouseY - dragState.dragOffset.y, svgRect.height - 40));

      // Cập nhật mouse position cho guidelines
      setDragState(prev => ({
        ...prev,
        mousePosition: { x: mouseX, y: mouseY }
      }));

      // Cập nhật vị trí node
      const newPositions = {
        ...customPositions,
        [dragState.draggedNode]: {
          ...customPositions[dragState.draggedNode],
          x: newX,
          y: newY
        }
      };

      setCustomPositions(newPositions);
      
      // Callback để notify parent component về thay đổi
      if (onPositionsChange) {
        onPositionsChange(newPositions);
      }
      
    } catch (error) {
      console.error('Error updating drag:', error);
    }
  }, [dragState, findSvgElement, customPositions, onPositionsChange]);

  // Kết thúc drag
  const endDrag = useCallback(() => {
    if (dragState.isDragging) {
      // Trigger final save khi kết thúc drag
      if (onPositionsChange && dragState.draggedNode) {
        onPositionsChange(customPositions, true); // true = finalSave
      }

      setDragState({
        isDragging: false,
        draggedNode: null,
        dragOffset: { x: 0, y: 0 },
        mousePosition: { x: 0, y: 0 }
      });
      
      svgRef.current = null;
    }
  }, [dragState, customPositions, onPositionsChange]);

  // Update positions từ external source (API load)
  const updatePositions = useCallback((newPositions) => {
    setCustomPositions(newPositions || {});
  }, []);

  // Reset về vị trí mặc định
  const resetPositions = useCallback(() => {
    const emptyPositions = {};
    setCustomPositions(emptyPositions);
    
    // Force end drag nếu đang drag
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        draggedNode: null,
        dragOffset: { x: 0, y: 0 },
        mousePosition: { x: 0, y: 0 }
      });
      svgRef.current = null;
    }

    // Notify parent component
    if (onPositionsChange) {
      onPositionsChange(emptyPositions, true); // true = finalSave
    }
  }, [dragState.isDragging, onPositionsChange]);

  // Set vị trí cụ thể cho một node
  const setNodePosition = useCallback((nodeId, x, y, shouldSave = false) => {
    const newPositions = {
      ...customPositions,
      [nodeId]: { 
        ...customPositions[nodeId], 
        x: Math.max(0, x), 
        y: Math.max(0, y) 
      }
    };
    
    setCustomPositions(newPositions);
    
    if (onPositionsChange && shouldSave) {
      onPositionsChange(newPositions, true);
    }
  }, [customPositions, onPositionsChange]);

  // Helper để check nếu node có custom position
  const hasCustomPosition = useCallback((nodeId) => {
    return customPositions[nodeId] !== undefined;
  }, [customPositions]);

  // Get all custom positions
  const getAllPositions = useCallback(() => {
    return customPositions;
  }, [customPositions]);

  return {
    customPositions,
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    resetPositions,
    setNodePosition,
    hasCustomPosition,
    updatePositions,
    getAllPositions
  };
};