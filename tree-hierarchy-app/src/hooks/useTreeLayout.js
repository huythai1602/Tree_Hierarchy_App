// File: src/hooks/useTreeLayout.js (IMPROVED SPACING VERSION)
import { useMemo } from 'react';
import { NODE_CONFIG } from '../utils/constants';

export const useTreeLayout = (nodes, customPositions = {}) => {
  const positions = useMemo(() => {
    // Auto-layout algorithm với improved spacing
    const calculateAutoLayout = (nodes) => {
      const positions = {};
      const levels = {}; // Track nodes at each level
      const nodeWidths = {}; // Track width needed for each node's subtree

      // Step 1: Calculate levels (depth) for each node
      const calculateLevels = (nodeId, level = 0) => {
        if (!nodes[nodeId]) return;
        
        levels[nodeId] = level;
        
        if (nodes[nodeId].con && nodes[nodeId].con.length > 0) {
          const childrenInJsonOrder = nodes[nodeId].con;
          
          childrenInJsonOrder.forEach(childId => {
            calculateLevels(childId, level + 1);
          });
        }
      };

      // Step 2: Calculate subtree width with improved spacing
      const calculateSubtreeWidth = (nodeId) => {
        if (!nodes[nodeId]) return NODE_CONFIG.WIDTH;
        
        const node = nodes[nodeId];
        
        if (!node.con || node.con.length === 0) {
          // Leaf node
          nodeWidths[nodeId] = NODE_CONFIG.WIDTH;
          return NODE_CONFIG.WIDTH;
        }
        
        // IMPROVED: Better spacing calculation
        const childCount = node.con.length;
        let horizontalSpacing;
        
        if (childCount === 1) {
          horizontalSpacing = 60; // Single child
        } else if (childCount === 2) {
          horizontalSpacing = 100; // Two children - more space
        } else if (childCount <= 4) {
          horizontalSpacing = 80; // 3-4 children
        } else if (childCount <= 6) {
          horizontalSpacing = 70; // 5-6 children
        } else {
          horizontalSpacing = 60; // Many children - compact but not overlapping
        }
        
        // Calculate total width needed for all children
        let totalChildWidth = 0;
        node.con.forEach(childId => {
          totalChildWidth += calculateSubtreeWidth(childId);
        });
        
        // Use the larger of: calculated child width or spacing-based width
        const spacingBasedWidth = (childCount * NODE_CONFIG.WIDTH) + ((childCount - 1) * horizontalSpacing);
        const finalWidth = Math.max(NODE_CONFIG.WIDTH, spacingBasedWidth, totalChildWidth + (childCount - 1) * 40);
        
        nodeWidths[nodeId] = finalWidth;
        return finalWidth;
      };

      // Step 3: Position nodes with improved spacing
      const positionNodes = (nodeId, startX = 0, y = 50) => {
        if (!nodes[nodeId]) return;
        
        const node = nodes[nodeId];
        const subtreeWidth = nodeWidths[nodeId];
        
        // Position current node at center of its subtree
        const nodeX = startX + (subtreeWidth - NODE_CONFIG.WIDTH) / 2;
        positions[nodeId] = {
          x: Math.max(20, nodeX), // Increased minimum margin
          y: y,
          level: levels[nodeId]
        };
        
        // Position children
        if (node.con && node.con.length > 0) {
          const childrenInJsonOrder = node.con;
          
          const childY = y + 120; // Increased vertical spacing from 90 to 120
          let currentX = startX;
          
          // IMPROVED: Dynamic horizontal spacing based on child count and subtree sizes
          const childCount = childrenInJsonOrder.length;
          
          childrenInJsonOrder.forEach((childId, index) => {
            if (nodes[childId]) {
              positionNodes(childId, currentX, childY);
              
              // Calculate spacing for next child
              const childSubtreeWidth = nodeWidths[childId] || NODE_CONFIG.WIDTH;
              let spacing;
              
              if (childCount === 1) {
                spacing = 0; // No spacing needed for single child
              } else if (childCount === 2) {
                spacing = 120; // Extra space for 2 children
              } else if (childCount <= 4) {
                spacing = 100; // Good spacing for 3-4 children
              } else if (childCount <= 6) {
                spacing = 80; // Moderate spacing for 5-6 children
              } else {
                spacing = 60; // Compact but readable for many children
              }
              
              currentX += childSubtreeWidth + (index < childCount - 1 ? spacing : 0);
            }
          });
        }
      };

      // Execute the algorithm
      if (nodes.root) {
        calculateLevels('root');
        calculateSubtreeWidth('root');
        positionNodes('root');
      }

      // Position disconnected nodes in a better organized area
      const disconnectedNodes = Object.keys(nodes).filter(nodeId => 
        nodeId !== 'root' && (!nodes[nodeId].cha || !nodes[nodes[nodeId].cha])
      );

      if (disconnectedNodes.length > 0) {
        const maxY = Math.max(...Object.values(positions).map(p => p.y), 0);
        const disconnectedStartY = maxY + 150; // More space before disconnected area
        
        // Better grid layout for disconnected nodes
        const nodesPerRow = Math.min(6, Math.ceil(Math.sqrt(disconnectedNodes.length))); // Dynamic grid
        
        disconnectedNodes.forEach((nodeId, index) => {
          if (!positions[nodeId]) {
            const row = Math.floor(index / nodesPerRow);
            const col = index % nodesPerRow;
            const x = 50 + col * (NODE_CONFIG.WIDTH + 30); // More spacing between disconnected nodes
            const y = disconnectedStartY + row * (NODE_CONFIG.HEIGHT + 20);
            
            positions[nodeId] = {
              x: x,
              y: y,
              level: -1 // Special level for disconnected
            };
          }
        });
      }

      return positions;
    };

    // Calculate auto layout
    const autoPositions = calculateAutoLayout(nodes);
    
    // Merge with custom positions (custom positions override auto positions)
    const finalPositions = {};
    Object.keys(nodes).forEach(nodeId => {
      if (customPositions[nodeId]) {
        // Use custom position if available
        finalPositions[nodeId] = {
          ...autoPositions[nodeId],
          ...customPositions[nodeId]
        };
      } else if (autoPositions[nodeId]) {
        // Use auto-calculated position
        finalPositions[nodeId] = autoPositions[nodeId];
      } else {
        // Fallback position for nodes not handled by auto-layout
        finalPositions[nodeId] = {
          x: 50,
          y: 200 + Object.keys(finalPositions).length * 80, // Increased fallback spacing
          level: 0
        };
      }
    });
    
    return finalPositions;
  }, [nodes, customPositions]);
  
  // Canvas size calculation với more generous sizing
  const canvasSize = useMemo(() => {
    const xValues = Object.values(positions).map(p => p.x);
    const yValues = Object.values(positions).map(p => p.y);
    
    if (xValues.length === 0) {
      return { width: 1200, height: 800 };
    }
    
    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);
    
    // Generous sizing with more padding
    const calculatedWidth = maxX + NODE_CONFIG.WIDTH + 200; // Increased padding
    const calculatedHeight = maxY + NODE_CONFIG.HEIGHT + 150; // Increased padding
    
    // Allow larger canvas to accommodate better spacing
    const finalWidth = Math.max(1200, calculatedWidth); // Increased minimum
    const finalHeight = Math.max(700, calculatedHeight); // Increased minimum
    
    console.log('📐 Canvas Size (Improved Spacing):', {
      nodePositions: { maxX, maxY },
      calculated: { width: calculatedWidth, height: calculatedHeight },
      final: { width: finalWidth, height: finalHeight },
      nodeCount: Object.keys(positions).length
    });
    
    return { 
      width: finalWidth,
      height: finalHeight
    };
  }, [positions]);

  // DFS order theo JSON order (không sort)
  const alignByDfsOrder = useMemo(() => {
    const dfsOrder = [];
    const visited = new Set();
    
    const dfs = (nodeId) => {
      if (!nodes[nodeId] || visited.has(nodeId)) return;
      visited.add(nodeId);
      dfsOrder.push(nodeId);
      
      if (nodes[nodeId].con && nodes[nodeId].con.length > 0) {
        const childrenInJsonOrder = nodes[nodeId].con;
        
        childrenInJsonOrder.forEach(childId => {
          if (nodes[childId]) {
            dfs(childId);
          }
        });
      }
    };
    
    if (nodes.root) {
      dfs('root');
    }
    
    // Add disconnected nodes at the end
    const disconnectedNodes = Object.keys(nodes).filter(nodeId => 
      nodeId !== 'root' && 
      !visited.has(nodeId) && 
      (!nodes[nodeId].cha || !nodes[nodes[nodeId].cha])
    );
    
    dfsOrder.push(...disconnectedNodes);
    
    return dfsOrder;
  }, [nodes]);
  
  return { 
    positions, 
    canvasSize,
    dfsOrder: alignByDfsOrder
  };
};