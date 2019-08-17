import _ from 'loadsh';

export const isEmptyArray = (arr) => {
  if (!arr) return true;
  if (arr instanceof Array) {
    return arr.length <= 0;
  }
  return true;
};

export const addMapItem = (arr, node) => {
  arr.set(node, node);
};

export const delMapItem = (map, node) => {
  if (map.has(node)) {
    map.delete(node);
  }
};

export const generateTreeDataMap = (
  parent, treeData, defaultConfig, initCheckedList, _checkedList, level = 0, _map = {}, _idList = [], _renderIdList = [],
) => {
  const map = _map;
  const _level = level;
  const { showLevel } = defaultConfig;
  const idList = _idList;
  const renderIdList = _renderIdList;
  const checkedList = _checkedList;

  treeData.forEach((item) => {
    const _value = item.value.toString();
    if (map[_value]) {
      throw new Error('The value must be unique');
    }

    const isShow = showLevel >= level;
    if (isShow) {
      renderIdList.push(_value);
    }

    idList.push(_value);
    const checked = initCheckedList.has(item.value);
    checked && checkedList.set(item.value, item.value);
    map[_value] = {
      ...item,
      level: _level,
      isExpand: showLevel > level,
      checkStatus: {
        checked,
        halfChecked: false,
      },
      value: item.value.toString(),
      title: item.title.toString(),
      parentVal: (parent && parent.value) || null,
    };
    if (!isEmptyArray(item.children)) {
      map[_value].children = item
        .children
        .map((_item) => _item.value);
      generateTreeDataMap(
        item, item.children, defaultConfig, initCheckedList, checkedList, _level + 1, map, idList, renderIdList,
      );
    }
  });
  return {
    map, idList, renderIdList, checkedList,
  };
};

export const childCheckedStatus = (children, TreeDataMap, checkbox) => {
  const { halfChain } = checkbox;
  let checked = !halfChain;
  let halfChecked = false;

  children.forEach((item) => {
    const { checkStatus } = TreeDataMap[item];
    if (checkStatus.halfChecked || checkStatus.checked) {
      halfChecked = true;
    }
    if (!checkStatus.checked) {
      checked = false;
    }
  });

  if (checked && halfChecked) {
    if (halfChain) {
      checked = false;
    } else {
      halfChecked = false;
    }
  }
  return { checked, halfChecked };
};

export const parentChain = (TreeDataMap, parentNode, config, checkedList) => {
  if (parentNode) {
    const checkStatus = childCheckedStatus(parentNode.children, TreeDataMap, config);
    Object.assign(parentNode, { checkStatus });

    if (checkStatus.checked) {
      addMapItem(checkedList, parentNode.value);
    } else {
      delMapItem(checkedList, parentNode.value);
    }

    if (typeof parentNode.parentVal !== 'undefined') {
      parentChain(TreeDataMap, TreeDataMap[parentNode.parentVal], config, checkedList);
    }
  }
};

export const childrenChain = (TreeDataMap, children, checked, checkedList) => {
  if (!children) {
    return;
  }
  children.forEach((id) => {
    const node = TreeDataMap[id];
    if (node.disabled) {
      // 被禁用的无法选中 return
    } else {
      node.checkStatus = {
        checked,
        halfChecked: false,
      };
      if (checked) {
        addMapItem(checkedList, node.value);
      } else {
        delMapItem(checkedList, node.value);
      }
    }
    if (node.children) {
      childrenChain(TreeDataMap, node.children, checked, checkedList);
    }
  });
};

export const findAllChildren = (children, treeDataMap, _arr = []) => {
  const arr = _arr;
  children.forEach((item) => {
    const _item = treeDataMap[item];
    arr.push(item);
    if (!isEmptyArray(_item.children)) {
      findAllChildren(_item.children, treeDataMap, arr);
    }
  });
  return arr;
};

export const filterListCheckChildren = (_children, treeDataMap, val) => _children.some((item) => {
  const { title, children } = treeDataMap[item];
  if (title.indexOf(val) > -1) {
    return true;
  }
  if (!isEmptyArray(children)) {
    return filterListCheckChildren(children, treeDataMap, val);
  }
  return false;
});

export const _parentChain = (treeDataMap, parentNode) => {
  if (parentNode) {
    // eslint-disable-next-line no-param-reassign
    parentNode.checkStatus.halfChecked = parentNode.children.some((item) => {
      const currentNode = treeDataMap[item];
      return !!(currentNode.checkStatus.checked || currentNode.checkStatus.halfChecked);
    });
    if (typeof parentNode.parentVal !== 'undefined') {
      _parentChain(treeDataMap, treeDataMap[parentNode.parentVal]);
    }
  }
};

export const checkedCheckedList = (treeDataMap, checkedList, checkbox) => {
  checkedList.forEach((value) => {
    const treeItem = treeDataMap[value];
    const { parentVal } = treeItem;
    checkbox.parentChain && parentVal && _parentChain(treeDataMap, treeDataMap[parentVal], checkbox, checkedList);
  });
};

export const ToggleAll = (data, flag) => {
  const newTreeMapData = _.mapValues(data, (value, key) => ({
    [key]: {
      ...value,
      checkStatus: {
        checked: flag,
        halfChecked: flag,
      },
    },
  }));
  return _.mapValues(newTreeMapData, (value, key) => Object.values(newTreeMapData[key])[0]);
};


export const getRealNode = (data) => _.chain(data)
  .pickBy((value) => !value.children || value.parentVal !== null).keys().value();

export const getSelectedCount = (collectionA, collectionB) => {
  const notOptions = [];
  for (let i = 0; i < collectionB.length; i += 1) {
    if (!collectionA.includes(collectionB[i])) {
      notOptions.push(collectionB[i]);
    }
  }
  return collectionB.length - notOptions.length;
};
