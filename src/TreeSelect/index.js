import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AutoSizer, List } from 'react-virtualized';
import {
  checkedCheckedList,
  childrenChain,
  delMapItem,
  findAllChildren,
  generateTreeDataMap, getRealNode, getSelectedCount,
  isEmptyArray,
  parentChain, ToggleAll,
} from './helper';
import styles from './index.module.scss';

class TreeSelect extends Component {
  state = {
    showDropDown: true,
    treeData: [],
    treeDataMap: {},
    idList: [],
    renderIdList: [],
    checkedList: new Map(),
    checkbox: {},
    updateListState: true,
    loading: true,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const defaultConfig = {
      showLevel: nextProps.showLevel,
      checkbox: nextProps.checkbox,
    };
    if (nextProps.treeData !== prevState.treeData) {
      const initCheckedListVal = defaultConfig.checkbox.enable
        ? defaultConfig.checkbox.initCheckedList.map((item) => [item.toString(), item.toString()]) : [];
      const initCheckedList = new Map(initCheckedListVal);
      const {
        map, idList, renderIdList, checkedList,
      } = generateTreeDataMap({}, nextProps.treeData, defaultConfig, initCheckedList, prevState.checkedList);

      defaultConfig.checkbox.enable && checkedCheckedList(map, checkedList, defaultConfig.checkbox);

      return {
        treeData: nextProps.treeData,
        treeDataMap: map,
        idList,
        renderIdList,
        checkbox: defaultConfig.checkbox,
        showLevel: defaultConfig.showLevel,
        checkedList,
        loading: false,
      };
    }
    return null;
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setWrapperRef = (node) => {
    this.wrapperRef = node;
  };

  handleClickOutside = (event) => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({ showDropDown: false });
    }
  };

  onClickRowExpand = (item, e) => {
    const { onExpand } = this.props;
    const { renderIdList, treeDataMap, updateListState } = this.state;
    const { value } = item;
    let _renderIdList = renderIdList.concat([]);
    // eslint-disable-next-line no-multi-assign
    const isExpand = treeDataMap[item.value].isExpand = !treeDataMap[item.value].isExpand;
    if (isExpand) {
      // 展开
      if (!isEmptyArray(item.children)) {
        // 找到这个val在renderIdList中的索引
        const idx = this.findIdListInValIdx(value, _renderIdList);
        const _children = item
          .children
          .concat([]);
          // 如果搜索框有值，要过滤一次
          // 在这个val后面插入
        _children.unshift(idx + 1, 0);
        Array
          .prototype
          .splice
          .apply(_renderIdList, _children);
      }
    } else if (!isEmptyArray(item.children)) {
      // 找到children的所有子节点
      const map = new Map();

      _renderIdList.forEach((_item) => {
        map.set(_item, _item);
      });

      const arr = findAllChildren(item.children, treeDataMap);

      arr.forEach((_item) => {
        treeDataMap[_item].isExpand = false;
        map.delete(_item);
      });

      _renderIdList = Array.from(map.values());
    }

    this.setState({
      renderIdList: _renderIdList,
      treeDataMap,
      updateListState: !updateListState,
    }, () => {
      onExpand && onExpand(item, e);
    });
  };

  handleOnChecked = (item, e) => {
    e && e.stopPropagation();
    e.preventDefault();
    const { onChecked } = this.props;
    const {
      treeDataMap, checkedList, updateListState, checkbox,
    } = this.state;
    const { checkStatus, value } = item;
    const { checked } = checkStatus;

    const { disabled } = item;
    if (disabled) {
      return;
    }
    const newTreeDataMap = treeDataMap;

    const _checked = !checked;
    const newCheckedList = new Map(checkedList);

    if (_checked) {
      newCheckedList.set(value, value);
    } else {
      delMapItem(newCheckedList, value);
    }

    newTreeDataMap[value] = {
      ...newTreeDataMap[value],
      checkStatus: {
        ...newTreeDataMap[value].checkStatus,
        checked: _checked,
        halfChecked: false,
      },
    };

    e && checkbox.parentChain && parentChain(newTreeDataMap, newTreeDataMap[item.parentVal], checkbox, newCheckedList);
    e && checkbox.childrenChain && childrenChain(newTreeDataMap, item.children, _checked, newCheckedList);
    this.setState({
      treeDataMap: newTreeDataMap,
      checkedList: newCheckedList,
      updateListState: !updateListState,
    }, () => {
      // eslint-disable-next-line react/destructuring-assignment
      e && onChecked && onChecked(Array.from(this.state.checkedList.keys()), e);
    });
  };

  findIdListInValIdx = (val, idList) => idList.indexOf(val);

  treeNodeRender = ({ index, style }) => {
    const {
      checkbox, expand, prefixClassName, paddingLeftLevel,
    } = this.props;
    const { treeDataMap, renderIdList, selectVal } = this.state;
    const idx = renderIdList[index];
    const item = treeDataMap[idx];
    if (!item) return;
    if (item.parentVal && !treeDataMap[item.parentVal].isExpand) {
      throw new Error('this item should not be show');
    }
    const _style = {
      ...style,
      paddingLeft: (paddingLeftLevel * item.level),
    };
    const checkedClassName = item.checkStatus.checked
      ? `${prefixClassName}-checkbox-checked`
      : '';
    const halfCheckedClassName = !item.checkStatus.checked && item.checkStatus.halfChecked
      ? `${prefixClassName}-checkbox-halfChecked`
      : '';
    const disabled = item.disabled && (!item.children || !isEmptyArray(item.children));
    const isSelectVal = selectVal === item.value;
    return (
      <div
        key={item.value}
        style={{
          ..._style,
          width: 'auto',
        }}
        className={styles[`${prefixClassName}-TreeNode`]}
      >
        <div
          className={`${styles[`${prefixClassName}-fadeIn`]} ${styles[`${item.disabled
            ? 'disabled'
            : ''}`]}`}
        >
          {expand ? (
            <div className={styles[`${prefixClassName}-expandIcon`]} onClick={(e) => this.onClickRowExpand(item, e)}>
              {!isEmptyArray(item.children) && (<i className={styles[`${item.isExpand && `${prefixClassName}-expand`}`]} />
              )}
            </div>
          ) : null}
          {checkbox.enable && !disabled && (
            <div
              onClick={(e) => this.handleOnChecked(item, e)}
              className={`${styles[`${prefixClassName}-checkbox`]} ${styles[checkedClassName]} ${styles[halfCheckedClassName]}`}
            >
              <span
                className={`${styles[`${prefixClassName}-checkbox-inner`]} ${styles[`${disabled
                  ? 'disabled'
                  : ''}`]}`}
              />
            </div>
          )}
          <div
            onClick={(e) => this.handleOnChecked(item, e)}
            title={item.title}
            className={styles[`${prefixClassName}-title ${isSelectVal
              ? 'active'
              : ''}`]}
          >
            {item.title}
          </div>
        </div>
      </div>
    );
  };

  toggleDropdownList = (e) => {
    e.target.focus();
    const { showDropDown } = this.state;
    this.setState({
      showDropDown: !showDropDown,
    });
  };

  hideOptions = () => {
    this.setState({
      showDropDown: false,
    });
  };

  convertArrToMap = (arr) => {
    const newArr = arr.map((item) => [item, item]);
    return new Map(newArr);
  };

  onApply = () => {
    const { handleApply } = this.props;
    handleApply();
    this.hideOptions();
  };

  toggleAll = () => {
    const { idList, checkedList, treeDataMap } = this.state;
    const { onChecked } = this.props;
    const allOptions = this.convertArrToMap(idList);
    if (checkedList.size < allOptions.size) {
      const newTreeDataMap = ToggleAll(treeDataMap, true);
      this.setState({
        checkedList: allOptions,
        treeDataMap: newTreeDataMap,
      });
      onChecked(idList);
    } else {
      const newTreeDataMap = ToggleAll(treeDataMap, false);
      this.setState({
        checkedList: new Map(),
        treeDataMap: newTreeDataMap,
      });
      onChecked({});
    }
  };

  renderValues = () => {
    const { label } = this.props;
    const {
      checkedList,
      treeDataMap,
    } = this.state;
    const totalLength = Object.keys(getRealNode(treeDataMap)).length;
    const selectedOptionsLength = getSelectedCount(getRealNode(treeDataMap), [...new Map([...checkedList]).values()]);
    return (
      <div className={styles.placeholder}>
        {`${label}: ${selectedOptionsLength} of ${totalLength} selected`}
      </div>
    );
  };

  renderTreeSelector = () => {
    const {
      style, checkbox, prefixClassName, showApply,
    } = this.props;
    const {
      treeDataMap,
      renderIdList,
      updateListState,
      loading,
      showDropDown,
    } = this.state;
    const _style = style || style;
    if (loading) {
      return (
        <div
          className={styles[`${prefixClassName}-TreeSelect`]}
          style={{
            width: _style.width,
          }}
        >
          <div className={styles.spinner}>
            <div className={`${styles.spinnerContainer} ${styles.container1}`}>
              <div className={styles.circle1} />
              <div className={styles.circle2} />
              <div className={styles.circle3} />
              <div className={styles.circle4} />
            </div>
            <div className={`${styles.spinnerContainer} ${styles.container2}`}>
              <div className={styles.circle1} />
              <div className={styles.circle2} />
              <div className={styles.circle3} />
              <div className={styles.circle4} />
            </div>
            <div className={`${styles.spinnerContainer} ${styles.container3}`}>
              <div className={styles.circle1} />
              <div className={styles.circle2} />
              <div className={styles.circle3} />
              <div className={styles.circle4} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`${showDropDown ? styles.animateIn : styles.animateOut}`}
      >
        {showDropDown ? (
          <div
            className={`${styles[`${prefixClassName}-TreeSelect`]} ${showDropDown ? styles.animateIn : styles.animateOut}`}
            style={{
              width: _style.width,
            }}
          >
            <div className={styles.toggleAll} onClick={this.toggleAll}>TOGGLE ALL</div>
            <div
              className={styles[`${prefixClassName}-TreeSelectList`]}
              style={{
                ..._style,
                overflow: 'unset',
              }}
            >
              <AutoSizer>
                {({ height, width }) => {
                  let actualWidth = width;
                  let actualHeight = height;
                  if (process.env.NODE_ENV === 'test') {
                    actualWidth = window.innerWidth;
                    actualHeight = window.innerHeight;
                  }
                  return (
                    <List
                      width={actualWidth}
                      height={actualHeight}
                      rowCount={renderIdList.length}
                      rowHeight={30}
                      rowRenderer={this.treeNodeRender}
                      overscanRowCount={20}
                      autoContainerWidth
                      treeDataMap={treeDataMap}
                      updateListState={updateListState}
                      checkbox={checkbox}
                    />
                  );
                }}
              </AutoSizer>
            </div>
            {showApply ? (<div className={styles.applyButton} onClick={this.onApply}>APPLY</div>) : null}
          </div>
        ) : null}
      </div>
    );
  };

  render() {
    const { showDropDown } = this.state;
    return (
      <div
        className={styles.select}
        ref={this.setWrapperRef}
      >
        <div className={styles.selection} onClick={this.toggleDropdownList}>
          {this.renderValues()}
          <span className={styles.arrowWrapper}>
            <i className={`${styles.arrow} ${showDropDown ? styles.upArrow : styles.downArrow}`} />
          </span>
        </div>
        {this.renderTreeSelector()}
      </div>
    );
  }
}

TreeSelect.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  treeData: PropTypes.array,
  expand: PropTypes.bool,
  style: PropTypes.shape(),
  checkbox: PropTypes.shape(),
  showLevel: PropTypes.number,
  label: PropTypes.string.isRequired,
  onExpand: PropTypes.func,
  onChecked: PropTypes.func,
  prefixClassName: PropTypes.string,
  paddingLeftLevel: PropTypes.number,
  showApply: PropTypes.bool,
  handleApply: PropTypes.func,
};

TreeSelect.defaultProps = {
  treeData: [],
  expand: true,
  onExpand: () => {},
  onChecked: () => {},
  style: {
    width: 320,
    height: 800,
    overflow: 'auto',
  },
  showLevel: 2,
  checkbox: {
    enable: false,
    parentChain: true,
    childrenChain: true,
    halfChain: true,
    initCheckedList: [],
  },
  prefixClassName: 'do',
  paddingLeftLevel: 20,
  showApply: true,
  handleApply: () => {},
};

export default TreeSelect;
