// File: src/utils/jsonExportTest.js

// Giả sử bạn đã require file json export ra, ví dụ:
// const jsonData = require('./path/to/exported.json');
// Hoặc nếu dùng ES6:
const jsonData = require('./417VSP-000-ATMT-486,pb00(1.2020).docx.json-2025-07-10.json');

function testJsonTree(jsonData) {
  // 1. Lấy id node gốc
  const rootId = jsonData.root_id;
  console.log('Root ID:', rootId);

  // 2. Lấy danh sách con của node gốc
  const children = jsonData.tree[rootId].con || jsonData.tree[rootId].child;
  console.log('Children of root:', children);

  // 3. Lấy id thằng con đầu tiên
  const firstChildId = children[0];
  console.log('First child ID:', firstChildId);

  // 4. Lấy parent_id của node con đầu tiên
  const parentId = jsonData.tree[firstChildId].cha || jsonData.tree[firstChildId].parent;
  console.log('Parent ID of first child:', parentId);

  // 5. Gán lại parent của node con đầu tiên về lại root
  jsonData.tree[firstChildId].cha = rootId;
  if ('parent' in jsonData.tree[firstChildId]) jsonData.tree[firstChildId].parent = rootId;
  console.log('After re-assign, parent of first child:', jsonData.tree[firstChildId].cha || jsonData.tree[firstChildId].parent);

  // Nếu muốn xuất ra file mới:
  // const fs = require('fs');
  // fs.writeFileSync('test-output.json', JSON.stringify(jsonData, null, 2));
}

testJsonTree(jsonData);

// Để sử dụng:
// const jsonData = require('./path/to/exported.json');
// testJsonTree(jsonData);

module.exports = testJsonTree; 