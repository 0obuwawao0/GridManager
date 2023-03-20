import { getRowData, getTableData } from '@common/cache';
import {
	getDiv,
	getEmpty, getFakeThead,
	getTbody,
	getThead,
	getVisibleTh,
	setAreVisible,
	updateVisibleLast
} from '@common/base';
import {
	EMPTY_DATA_CLASS_NAME,
	EMPTY_TPL_KEY,
	ODD,
	PX,
	ROW_CLASS_NAME,
	TR_CACHE_KEY,
	TR_CHILDREN_STATE,
	TR_PARENT_KEY,
	TR_ROW_KEY,
	ROW_INDEX_KEY
} from '@common/constants';
import {each, isElement, isNumber, isUndefined, isValidArray} from '@jTool/utils';
import {compileEmptyTemplate, compileFakeThead, compileTd, sendCompile} from '@common/framework';
import { outError } from '@common/utils';
import moveRow from '@module/moveRow';
import checkbox from '@module/checkbox';
import fullColumn, { getFullColumnTr, getFullColumnInterval } from '@module/fullColumn';
import tree from '@module/tree';
import { treeElementKey } from '@module/tree/tool';
import { installSummary } from '@module/summary';
import { mergeRow } from '@module/merge';
import fixed from '@module/fixed';
import template from './template';
import nested from '@module/nested';
import { SettingObj, Column, TrObject, Row } from 'typings/types';

/**
 * �ػ�thead
 * @param settings
 */
export const renderThead = async (settings: SettingObj): Promise<void> => {
	const { _, columnMap, __isNested } = settings;

	const columnList: Array<Array<Column>> = [[]];
	const topList = columnList[0];

	// ���Ƕ�ף����еݹ鴦��
	if (__isNested) {
		nested.push(columnMap, columnList);
	} else {
		each(columnMap, (key: string, col: Column) => {
			topList[col.index] = col;
		});
	}

	let thListTpl = '';
	// columnList ����thead
	each(columnList, (list: Array<Column>) => {
		thListTpl += '<tr>';
		each(list, (col: Column) => {
			thListTpl += template.getThTpl({settings, col});
		});
		thListTpl += '</tr>';
	});
	getThead(_).html(thListTpl);
	getFakeThead(_).html(thListTpl);

	compileFakeThead(settings, getFakeThead(_).get(0));

	// �������: thead����
	await sendCompile(settings);
};
/**
 * ��ȾΪ��DOM
 * @param settings
 * @param isInit
 */
export const renderEmptyTbody = (settings: SettingObj, isInit?: boolean): void => {
	const { _, emptyTemplate } = settings;
	// ��ǰΪ��һ�μ��� �� �Ѿ�ִ�й�setQuery ʱ�����ٲ��������ģ��
	// ���ڽ������Ϊ���ɼ�ʱ��������setQuery�����
	if (isInit && getTableData(_, true).length !== 0) {
		return;
	}

	const $tableDiv = getDiv(_);
	$tableDiv.addClass(EMPTY_DATA_CLASS_NAME);
	getTbody(_).html(`<tr ${EMPTY_TPL_KEY}="${_}" style="height: ${$tableDiv.height() - 1 + PX}"><td colspan="${getVisibleTh(_).length}"></td></tr>`);
	const emptyTd = getEmpty(_).get(0).querySelector('td');

	emptyTd.innerHTML = compileEmptyTemplate(settings, emptyTd, emptyTemplate);

	// �������: ��ģ��
	sendCompile(settings);
};

/**
 * ������װtable body: �����������������������tbody����ʱ���״λ�ȡtbody���丸����ʱ����
 * @param settings
 * @param bodyList
 * @param isVirtualScroll: ��ǰ�Ƿ�Ϊ�������
 * @param firstTrCacheKey
 * @param lastTrCacheKey
 */
export const renderTbody = async (settings: SettingObj, bodyList: Array<Row>, isVirtualScroll: boolean, firstTrCacheKey: string, lastTrCacheKey: string): Promise<any> => {
	const {
		_,
		columnMap,
		supportTreeData,
		supportCheckbox,
		supportMoveRow,
		treeConfig,
		__isNested,
		__isFullColumn
	} = settings;

	const { treeKey, openState } = treeConfig;

	// tbody dom
	const $tbody = getTbody(_);
	const tbody = $tbody.get(0);

	// �������Ϊ��ʱ��dom
	const $emptyTr = $tbody.find(`[${EMPTY_TPL_KEY}="${_}"]`);
	if ($emptyTr.length) {
		$emptyTr.remove();
	}

	// �洢tr�����б�
	let trObjectList: Array<TrObject> = [];

	// ͨ��index��columnMap��������
	const topList: Array<Column> = [];
	const columnList: Array<Column> = [];
	each(columnMap, (key: string, col: Column) => {
		if (!col.pk) {
			topList[col.index] = col;
		}
	});

	const pushList = (list: Array<Column>) => {
		each(list, (col: Column) => {
			if (!isValidArray(col.children)) {
				columnList.push(col);
				return;
			}
			pushList(col.children);
		});
	};
	pushList(topList);

	// ���볣���TR
	const installNormal = (trObject: TrObject, row: Row, rowIndex: number, isTop: boolean): void => {
		// �뵱ǰλ����Ϣƥ���td�б�

		const tdList = trObject.tdList;
		each(columnList, (col: Column) => {
			const tdTemplate = col.template;
			if (col.isAutoCreate) {
				tdList.push(tdTemplate(row[col.key], row, rowIndex, isTop));
				return;
			}

			let { text, compileAttr } = compileTd(settings, tdTemplate, row, rowIndex, col.key);
			const alignAttr = col.align ? `align=${col.align}` : '';
			const moveRowAttr = supportMoveRow ? moveRow.addSign(col) : '';
			const useRowCheckAttr = supportCheckbox ? checkbox.addSign(col) : '';
			const fixedAttr = col.fixed ? `fixed=${col.fixed}` : '';
			const colClassAttr = col.columnClass ? `class=${col.columnClass}` : '';
			const tdNameAttr = `td-name="${col.key}"`;
			text = isElement(text) ? text.outerHTML : text;
			tdList.push(`<td ${tdNameAttr} ${compileAttr} ${alignAttr} ${moveRowAttr} ${useRowCheckAttr} ${fixedAttr} ${colClassAttr}>${text}</td>`);
		});
	};

	try {
		const installTr = (list: Array<Row>, level: number, pIndex?: string): void => {
			const isTop = isUndefined(pIndex);
			each(list, (row: Row, index: number) => {
				const className = [];
				const attribute = [];
				const tdList: Array<string> = [];
				const cacheKey = row[TR_CACHE_KEY];

				// ������ class name
				if (row[ROW_CLASS_NAME]) {
					className.push(row[ROW_CLASS_NAME]);
				}

				// �Ƕ���
				if (!isTop) {
					attribute.push([TR_PARENT_KEY, pIndex]);
					// ����չ��״̬: ��ǰ����trʹ��tr��ǰ��״̬���粻����ʹ��tree config�е�������
					const _tr = tbody.querySelector(`[${TR_CACHE_KEY}="${cacheKey}"]`);
					let _openState = openState;
					if (_tr) {
						_openState = _tr.getAttribute(TR_CHILDREN_STATE) === 'true';
					}
					attribute.push([TR_CHILDREN_STATE, _openState]);
				}

				// ���� �ҵ�ǰΪ���νṹ
				if (isTop && supportTreeData) {
					// ��ֱ��ʹ��css odd�����ڴ��ڲ㼶����ʱ�޷��ų��۵�Ԫ��
					index % 2 === 0 && attribute.push([ODD, '']);
				}

				attribute.push([TR_CACHE_KEY, cacheKey]);

				const trObject: TrObject = {
					className,
					attribute,
					row,
					querySelector: `[${TR_CACHE_KEY}="${cacheKey}"]`,
					tdList
				};

				// ����ṹ: ͨ��-top
				if (isTop && __isFullColumn) {
					fullColumn.addTop(settings, row, index, trObjectList);
				}

				// ����������TR
				installNormal(trObject, row, index, isTop);

				trObjectList.push(trObject);

				// ����ṹ: ͨ��-bottom
				if (isTop && __isFullColumn) {
					fullColumn.addBottom(settings, row, index, trObjectList);
				}

				// ����㼶�ṹ
				if (supportTreeData) {
					const children = row[treeKey];
					const hasChildren = children && children.length;

					// ��ǰΪ����ʱ������ԭ״̬
					let state;
					const $treeElement = $tbody.find(`${trObject.querySelector} [${treeElementKey}]`);
					if ($treeElement.length) {
						state = $treeElement.attr(treeElementKey) === 'true';
					}

					// ���tree map
					tree.add(_, cacheKey, level, hasChildren, state);

					// �ݹ鴦��㼫�ṹ
					if (hasChildren) {
						installTr(children, level + 1, cacheKey);
					}
				}
			});
		};

		installTr(bodyList, 0);

		// ���������: ��֤�ں�����
		installSummary(settings, columnList, trObjectList);

		const prependFragment = document.createDocumentFragment();

		const df = document.createDocumentFragment();
		const $tr = $tbody.find('tr');
		each($tr, (item: HTMLTableRowElement) => {
			df.appendChild(item);
		});
		tbody.innerHTML = '';

		// ��������ݲ�ƥ���tr
		if (df.children.length) {
			let firstLineIndex: number;
			let lastLineIndex: number;

			// ����ʼ��: ��Ҫ��֤��ͨ����
			let firstTr = getFullColumnTr(df, 'top', firstTrCacheKey);
			if (!firstTr) {
				firstTr = df.querySelector(`[${TR_CACHE_KEY}="${firstTrCacheKey}"]`);
			}
			if (firstTr) {
				firstLineIndex = [].indexOf.call(df.children, firstTr);
			}

			// ���������: ��Ҫ��֤�ָ���
			let lastTr = getFullColumnInterval(df, lastTrCacheKey);
			if (!lastTr) {
				lastTr = df.querySelector(`[${TR_CACHE_KEY}="${lastTrCacheKey}"]`);
			}
			if (lastTr) {
				lastLineIndex = [].indexOf.call(df.children, lastTr);
			}

			const list: Array<HTMLTableRowElement> = [];
			each(df.children, (item: HTMLTableRowElement, index: number) => {
				// DOM�в����ڿ�ʼ��������е�tr: �������tr
				if (!isNumber(firstLineIndex) && !isNumber(lastLineIndex)) {
					list.push(item);
					return;
				}

				// DOM�д��ڿ�ʼ�е�tr: ���С�ڿ�ʼ��tr
				if (isNumber(firstLineIndex) && index < firstLineIndex) {
					list.push(item);
				}

				// DOM�д��ڽ����е�tr: ��մ��ڽ����е�tr
				if (isNumber(lastLineIndex) && index > lastLineIndex) {
					list.push(item);
				}
			});
			each(list, (item: HTMLTableRowElement) => item.remove());
		}
		trObjectList.forEach(item => {
			const { className, attribute, tdList, row, querySelector } = item;
			const tdStr = tdList.join('');

			// ���컯����
			// ͨ��dom�ڵ��ϵ����Է���dom
			let tr = df.querySelector(querySelector);

			// ��ǰ�Ѵ���tr
			if (tr) {
				tr.innerHTML = tdStr;
			} else {
				// ��ǰ������tr
				tr = document.createElement('tr');
				tr.innerHTML = tdStr;

				const firstCacheTr = df.querySelector(`[${TR_CACHE_KEY}]`) as HTMLTableRowElement;
				if (firstCacheTr && !isUndefined(row)) {
					const firstNum = getRowData(_, firstCacheTr, true)[ROW_INDEX_KEY];
					const nowNum = row[ROW_INDEX_KEY];
					if (nowNum < firstNum) {
						prependFragment.appendChild(tr);
					} else {
						df.appendChild(tr);
					}
				} else {
					df.appendChild(tr);
				}
			}

			// Ϊ�������޸ĺ��Tr����[class, attribute]
			if (className.length) {
				tr.className = className.join(' ');
			}
			attribute.forEach(attr => {
				tr.setAttribute(attr[0], attr[1]);
			});
			// �����ݹ�����DOM
			tr[TR_ROW_KEY] = row;
		});

		df.insertBefore(prependFragment, df.firstChild);

		tbody.appendChild(df);
	} catch (e) {
		outError('render tbody error');
		console.error(e);
	}

	// �Ƕ��Ƕ�׳�ʼ����ʾ״̬: ���Ƕ�ײ�֧����ʾ�����ز���
	if (!__isNested) {
		each(columnMap, (key: string, col: Column) => {
			setAreVisible(_, key, col.isShow);
		});
	}

	// �������
	await sendCompile(settings);

	// ����tree dom
	supportTreeData && tree.insertDOM(_, treeConfig);

	// �ϲ���Ԫ��
	mergeRow(_, columnMap);

	// �����������ִ���Ժ��߼�
	if (!isVirtualScroll) {
		fixed.update(_);

		// ����tbody�Ƿ��������ʶ
		if ($tbody.height() >= getDiv(_).height()) {
			$tbody.attr('filled', '');
		} else {
			$tbody.removeAttr('filled');
		}

		// Ϊ���һ�е�th, td���ӱ�ʶ: Ƕ�ױ�ͷ������
		if (!settings.__isNested) {
			updateVisibleLast(_);
		}
	}

};
