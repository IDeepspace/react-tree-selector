import React, { useState, useEffect } from 'react';
import Data from './data';
import TreeSelect from './TreeSelect';

const App = () => {
  const [treeData, setTreeData] = useState(Data);
  const [showLevel] = useState(1);
  const [selectVal] = useState('1');
  const [statuses, setStatuses] = useState([]);

  const checkbox = {
    enable: true,
    parentChain: true,
    childrenChain: true,
    halfChain: false,
    initCheckedList: ['1', '1-1', '1-2', '1-3', '2-3', '3-1', '3-2', '3-3', '4-0'],
  };

  useEffect(() => {
    const data = Data;
    setTreeData(data);
  }, []);

  const onExpand = (val) => {
    // console.log(val);
  };

  const onChecked = (val) => {
    console.log(val);
    setStatuses(val);
  };

  return (
    <TreeSelect
      treeData={treeData}
      style={{ width: 271, height: 431 }}
      selectVal={selectVal}
      onExpand={onExpand}
      onChecked={onChecked}
      checkbox={checkbox}
      showLevel={showLevel}
      label="Status"
      expand
    />
  );
};

export default App;
