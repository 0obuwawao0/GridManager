import Vue from 'vue';
import $gridManager, { jTool } from '../../../module/index';
import {getSettings} from '@common/cache';
export { $gridManager, jTool };
export default {
    name: 'GridManagerVue',
    props: {
        option: {
            type: Object,
            default: {}
        },
        callback: {
            type: Function,
            default: query => query
        }
    },
	// render: h => {
    // 	return h('table');
	// },
    template: '<table></table>',
    mounted() {
        // 寻找真实的父级组件: 防止多层嵌套后methods丢失问题
        let _parent = this.$parent;
        const setParent = obj => {
            if (!obj) {
                return;
            }
            for (let key in obj) {
                if (obj[key] === this.$props.option) {
                    _parent = obj;
                    return;
                }
            }
            setParent(obj.$parent);
        };
        setParent(_parent);
        const { methods, components } = _parent.$options;

        // 存储Vue实例
        let vueCache = [];

        // 更新Vue存储实例
        const updateVueCache = () => {
            vueCache = vueCache.filter(vm => {
                const { $el } = vm;
                if (!getComputedStyle($el).display) {
                    // 清除framework.send 后存在操作的DOM节点
                    const tree = $el.querySelector('[tree-element]');
                    tree && $el.removeChild(tree);

                    vm.$destroy();
                }
                return !!getComputedStyle($el).display;
            });
        };

		const byteToHex = byte => {
			return ('0' + byte.toString(16)).slice(-2);
		};

		const generateId = (len = 40) => {
			var arr = new Uint8Array(len / 2);
			window.crypto.getRandomValues(arr);
			return Array.from(arr, byteToHex).join('');
		};

        // 解析Vue 模版, data中的row为固定元素
        this.option.compileVue = compileList => {
            // let attributes = null;
            // let children = null;
            updateVueCache();
            return new Promise(resolve => {
                compileList.forEach(item => {
                    const el = item.el;

                    // 继承父对像 methods: 用于通过this调用父对像的方法
                    const methodsMap = {};
                    for (let key in methods) {
                        methodsMap[key] = methods[key].bind(_parent);
                    }

                    // 合并父对像 data
                    const dataMap = {
                        row: item.row,
                        index: item.index
                    };
                    Object.assign(dataMap, _parent.$data);

                    // create new vue
                    vueCache.push(new Vue({
                        parent: _parent,
                        el: el,
                        data: () => dataMap,
                        methods: methodsMap,
                        template: el.outerHTML,
						// todo #001 这里修改时，需要考虑下原生与框架结何时，是否可以直接使用未渲染的字符串进行框架解析
						// render: h => {
                        // 	const attribute = {
						// 		class: 'th-text gm-drag-action',
						// 		attrs: {
						// 			'data-compile-node': ''
						// 		}
						// 	};
						// 	return h('thead', attribute, '<tr><td>11</td><td>11</td></tr>');
						// },

                        // 因为实际上表格组件重新创建了域，所以这块用来解决在表格中无法使用父组件所注册组件的问题
                        components
                    }));
                });
                resolve();
            });
        };

        // 存在错误的 vue文件，其中的模板会污染表格组件中使用到的template
        if (this.$el.nodeName !== 'TABLE') {
            console.error('Wrong .vue: ', this.$el);
            return;
        }

		this.option.gridManagerName = generateId(8);
        // 调用原生组件进行实例化
        new $gridManager(this.$el, this.option, query => {
            typeof (this.callback) === 'function' && this.callback(query);
        });
    },
	methods: {
		/**
		 * 获取指定表格的本地存储数据
		 * 成功后返回本地存储数据,失败则返回空对象
		 *  @returns {{}}
		 */
		getLocalStorage() {
			return $gridManager.getLocalStorage(this.option.gridManagerName);
		},
		/**
		 * 重置表格布局
		 * @param width
		 * @param height
		 */
		resetLayout(width, height) {
			$gridManager.resetLayout(this.option.gridManagerName, width, height);
		},
		/**
		 * 清除指定表的表格记忆数据, 如果未指定删除的table, 则全部清除
		 * @returns {boolean}
		 */
		clear() {
			return $gridManager.clear(this.option.gridManagerName);
		},
		/**
		 * 获取当前渲染时使用的数据
		 * @returns {{}}
		 */
		getTableData() {
			return $gridManager.getTableData(this.option.gridManagerName);
		},
		/**
		 * 获取当前行渲染时使用的数据
		 * @param target 将要获取数据所对应的tr[Element or NodeList]
		 * @returns {{}}
		 */
		getRowData(target) {
			return $gridManager.getRowData(this.option.gridManagerName, target);
		},
		/**
		 * 手动设置排序
		 * @param sortJson 需要排序的json串 如:{th-name:'down'} value需要与参数sortUpText 或 sortDownText值相同
		 * @param callback 回调函数[function]
		 * @param refresh 是否执行完成后对表格进行自动刷新[boolean, 默认为true]
		 */
		setSort(sortJson, callback, refresh) {
			$gridManager.setSort(this.option.gridManagerName, sortJson, callback, refresh);
		},
		/**
		 * 设置表头配置区域可视状态
		 * @param visible
		 */
		setConfigVisible(visible) {
			$gridManager.setConfigVisible(this.option.gridManagerName, visible);
		},
		/**
		 * 显示Th及对应的TD项
		 * @param thName or thNameList
		 */
		showTh(thName) {
			$gridManager.showTh(this.option.gridManagerName, thName);
		},
		/**
		 * 隐藏Th及对应的TD项
		 * @param thName or thNameList
		 */
		hideTh(thName) {
			$gridManager.hideTh(this.option.gridManagerName, thName);
		},
		/**
		 * 导出.xls格式文件
		 * @param fileName 导出后的文件名
		 * @param onlyChecked 是否只导出已选中的表格
		 * @returns {boolean}
		 */
		exportGrid(fileName, onlyChecked) {
			return $gridManager.exportGrid(this.option.gridManagerName, fileName, onlyChecked);
		},
		/**
		 * 设置查询条件
		 * @param query: 配置的数据 [Object]
		 * @param callback: 回调函数
		 * @param gotoPage: [Boolean 是否跳转到第一页] or [Number 跳转的页码]，默认值=true
		 * 注意事项:
		 * - 当query的key与分页及排序等字段冲突时将会被忽略.
		 * - setQuery() 执行后会立即触发刷新操作
		 * - 在此配置的query在分页事件触发时, 会以参数形式传递至pagingAfter(query)事件内
		 * - setQuery方法中对query字段执行的操作是覆盖而不是合并, query参数位传递的任意值都会将原来的值覆盖.
		 * - setQuery() 执行后不会清除已选中的数据，如需清除可以在callback中执行setCheckedData(table, [])
		 */
		setQuery(query, gotoPage, callback) {
			$gridManager.setQuery(this.option.gridManagerName, query, gotoPage, callback);
		},
		/**
		 * 配置静态数ajaxData; 用于再次配置ajaxData数据, 配置后会根据参数ajaxData即时刷新表格
		 * @param ajaxData: 配置的数据
		 * @param callback: 回调函数
		 */
		setAjaxData(ajaxData, callback) {
			if (ajaxData instanceof Array) {
			   const { dataKey } = this.get();
				// 目前如果通过该方法放入数据的话一定要包装一个 data，所以这里只要是数组，就默认包裹
				ajaxData = {
					[dataKey]: ajaxData
				};
			}
			const {checkboxConfig, supportCheckbox} = getSettings(this.option.gridManagerName);
			if  (supportCheckbox &&
				(!checkboxConfig || checkboxConfig.disableStateKeep)) {
				this.setCheckedData([]);
			}

			$gridManager.setAjaxData(this.option.gridManagerName, ajaxData, callback);
		},
		/**
		 * 刷新表格 使用现有参数重新获取数据，对表格数据区域进行渲染，刷新时清空用户选择
		 * @param isGotoFirstPage:  是否刷新时跳转至第一页[boolean类型, 默认true]
		 * @param callback: 回调函数
		 */
		refreshGrid(isGotoFirstPage = true, callback) {
			const {checkboxConfig, supportCheckbox} = getSettings(this.option.gridManagerName);
			if  (supportCheckbox &&
				(!checkboxConfig || checkboxConfig.disableStateKeep)) {
				this.setCheckedData([]);
			}
			$gridManager.refreshGrid(this.option.gridManagerName, isGotoFirstPage, callback);
		},
		/**
		 * 获取当前选中的行
		 * @returns {NodeList} 当前选中的行
		 */
		getCheckedTr() {
			return $gridManager.getCheckedTr(this.option.gridManagerName);
		},
		/**
		 * 获取当前选中行渲染时使用的数据
		 * @returns {{}}
		 */
		getCheckedData() {
			return $gridManager.getCheckedData(this.option.gridManagerName);
		},
		/**
		 * 设置选中的数据
		 * @param checkedData: 选中的数据列表
		 * @returns {{}}
		 */
		setCheckedData(checkedData) {
			return $gridManager.setCheckedData(this.option.gridManagerName, checkedData);
		},
		/**
		 * 更新列数据
		 * @param key: 列数据的主键
		 * @param rowData: 需要更新的数据列表
		 * @returns tableData: 更新后的表格数据
		 */
		updateRowData(key, rowData) {
			return $gridManager.updateRowData(this.option.gridManagerName, key, rowData);
		},
		/**
		 * 重新渲染,但目前在 firstloding为false时 需要先init表格
		 * @param columnData
		 * @returns {Promise<void>}
		 */
		renderGrid(columnData) {
			return $gridManager.renderGrid(this.option.gridManagerName, columnData);
		},
		/**
		 * 初始化表格
		 * @param callback
		 */
		init(callback) {
			$gridManager.destroy(this.option.gridManagerName);
			this.option.firstLoading = true;
			new $gridManager(this.$el, this.option, query => {
				typeof (callback) === 'function' && callback(query);
			});
		},
		/**
		 * 获取Table 对应 GridManager的实例
		 * @returns {SettingObj}
		 */
		get() {
			return $gridManager.get(this.option.gridManagerName);
		},
		/**
		 * 更新树的展开状态
		 * @param state
		 */
		updateTreeState(state) {
			return $gridManager.updateTreeState(this.option.gridManagerName, state);
		},
		/**
		 * 清空表格数据
		 * @returns {*|void}
		 */
		cleanData() {
			const {checkboxConfig, supportCheckbox} = getSettings(this.option.gridManagerName);
			if  (supportCheckbox &&
				(!checkboxConfig || checkboxConfig.disableStateKeep)) {
				this.setCheckedData([]);
			}
			return $gridManager.cleanData(this.option.gridManagerName);
		},
		/**
		 * 打印
		 */
		print() {
			return $gridManager.print(this.option.gridManagerName);
		},
		/**
		 * 显示加载框
		 */
		showLoading() {
			return $gridManager.showLoading(this.option.gridManagerName);
		},
		/**
		 * 隐藏加载框
		 * @param delayTime: 延迟隐藏时间
		 */
		hideLoading(delayTime) {
			return $gridManager.hideLoading(this.option.gridManagerName);
		},
		/**
		 * 显示行
		 * @param index: 行的索引，为空时将显示所有已隐藏的行
		 */
		showRow(index) {
			return $gridManager.showRow(this.option.gridManagerName, index);
		},
		/**
		 * 隐藏行
		 * @param index: 行的索引，为空时将不执行
		 */
		hideRow(index) {
			return $gridManager.hideRow(this.option.gridManagerName, index);
		},
		/**
		 * 设置行高度 v2.17.0
		 * @param height
		 */
		setLineHeight(height) {
			return $gridManager.setLineHeight(this.option.gridManagerName, height);
		},
		/**
		 * 启用自动轮播
		 */
		startAutoPlay() {
			return $gridManager.startAutoPlay(this.option.gridManagerName);
		},
		/**
		 * 停止自动轮播
		 */
		stopAutoPlay() {
			return $gridManager.stopAutoPlay(this.option.gridManagerName);
		},
		/**
		 * 消毁当前实例
		 */
		destroy() {
			return $gridManager.destroy(this.option.gridManagerName);
		},
		/**
		 * 列表已存在时，返回rendered的值
		 * @returns {any}
		 */
		isRendered() {
			return $gridManager.get(this.option.gridManagerName).rendered || false;
		}

	},

    /**
     * 消毁事件
     */
    destroyed() {
        // 销毁实例
        $gridManager.destroy(this.option.gridManagerName);
    },

    /**
     * keep-alive事件
     */
    activated() {
        const settings = $gridManager.get(this.option.gridManagerName);
        if (settings.rendered) {
            $gridManager.resetLayout(settings.gridManagerName, settings.width, settings.height);
        }
    }
};
