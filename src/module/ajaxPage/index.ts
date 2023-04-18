/**
 * ajaxPage[分页]
 * 参数说明:
 *  - supportAjaxPage: 指定列表是否支持分页
 *      - type: Boolean
 *      - default: false
 *  - asyncTotals: 异步分页模式,当useNoTotalsMode:true 时，该配置失效
 *      - type: Object
 *      - default: undefined
 *  - useNoTotalsMode: 是否使用无总条数模式
 *      - note: 开启后将不再使用后端返回的总条数, 分页区域页码功能不再显示, 下一页可用的条件: 当前页的数据长度 >= 每页的显示条数
 *      - type: Boolean
 *      - default: false
 *  - ajaxPageTemplate: 分页区域自定义模板
 *      - note: 通过该参数可以对分页所需html模板(ajax-page.tpl.html)进行重置，从而达到分页区域布局及样式的调整
 *      - type: String
 *      - default: undefined
 *  - sizeData: 配置每页显示条数的下拉项，数组元素仅允许为正整数
 *      - type: Array
 *      - default: [10, 20, 30, 50, 100]
 *  - pageSize: 配置初次进入时每页的显示条数，需要与sizeData中的值匹配
 *      - note: 在启用本地缓存的情况下，每页的显示数为上次用户调整后的数值
 *      - type: Number
 *      - default: 20
 *  - totalsKey: 指定返回数据总条数的key键值
 *      - note: 在接口返回数据格式不匹配时，可以通过该配置项进行修改
 *      - type: String
 *      - default: 'totals'
 *  - currentPageKey: 请求参数中当前页key键值
 *      - type: String
 *      - default: 'cPage'
 *  - pageSizeKey: 请求参数中每页显示条数key健值
 *      - type: String
 *      - default: 'pSize'
 *
 * 事件说明:
 *  - pagingBefore: 分页执行前事件，在ajax请求发送前触发
 *      - arguments:
 *          - query: AJAX请求服务器所协带参数
 *  - pagingAfter: 分页执行后事件，在ajax请求成功后触发
 *      - arguments:
 *          - query: AJAX请求服务器所协带参数
 *
 * ajax-page.tpl.html 中的实时更新说明:
 *  - 说明: 实时更新用于分页区域的跨框架可扩展性, 通过配置参ajaxPageTemplate对分页模块进行使用。
 *         当分页数据发生变更时，会对包含特定attribute的标签html和value进行更新
 *  - 有效区域: <div class="gm-toolbar">标签内
 *  - attribute与触发时机:
 *      - begin-number-info: 当前页从多少条开始显示
 *      - end-number-info: 当前页到多少条结束显示
 *      - current-page-info: 当前页
 *      - totals-number-info: 总条数
 *      - totals-page-info: 总页数
 */
import './style.less';
import jTool from '@jTool';
import { extend } from '@jTool/utils';
import { clearTargetEvent } from '@common/base';
import { getSettings, setSettings, getUserMemory, saveUserMemory, getCheckedData } from '@common/cache';
import { parseTpl } from '@common/parse';
import { TOOLBAR_KEY, DISABLED_CLASS_NAME } from '@common/constants';
import core from '../core';
import { getParams } from '../core/tool';
import i18n from '../i18n';
import dropdown from '../dropdown';
import ajaxPageTpl from './ajax-page.tpl.html';
import { getQuerySelector, getPageData, joinPaginationNumber } from './tool';
import { getEvent, eventMap } from './event';
import { EVENTS, TARGET, SELECTOR } from '@common/events';
import { JTool, PageData, SettingObj } from 'typings/types';

// 生成html所需参数
interface CreateHtmlParams {
	settings: SettingObj
	tpl: string
}

/**
 * 修改分页描述信息
 * @param $footerToolbar
 * @param settings
 * @param pageData
 * @param asyncTotalText: 异步总页loading文本
 * @private
 */
const resetPageInfo = ($footerToolbar: JTool, settings: SettingObj, pageData: PageData, asyncTotalText: string): void => {
	const { currentPageKey, pageSizeKey } = settings;
	// 从多少开始
	const fromNum = pageData[currentPageKey] === 1 ? 1 : (pageData[currentPageKey] - 1) * pageData[pageSizeKey] + 1;

	// 到多少结束
	const toNum = pageData[currentPageKey] * pageData[pageSizeKey];

	// 总共条数
	let totalNum = pageData.tSize;

	// 当前页
	const cPage = pageData[currentPageKey];

	// 总页数
	let tPage = pageData.tPage;

	// 当前没有总条数 且 存在异步加载文本: 使用异步加载文本填充总条数与总页数
	if (!totalNum && asyncTotalText) {
		// @ts-ignore 交由js进行转换 string => number
		totalNum = tPage = asyncTotalText;
	}

	const $pageInfo = jTool('.page-info', $footerToolbar);
	if ($pageInfo.length) {
		const info = i18n(settings, 'page-info', [fromNum, toNum, totalNum]);
		$pageInfo.html(info);
	}

	// 拆分分页信息
	const $pageShows = jTool('.page-shows', $footerToolbar);
	if ($pageShows.length) {
		const info = i18n(settings, 'this-page-shows', [fromNum, toNum]);
		$pageShows.html(info);
	}

	// 拆分总条数
	const $total = jTool('.total', $footerToolbar);
	if ($total.length) {
		const info = i18n(settings, 'total', [totalNum]);
		$total.html(info);
	}

	// 更新实时更新数据: 当前页从多少条开始显示
	const $beginNumber = jTool('[begin-number-info]', $footerToolbar);
	if ($beginNumber.length) {
		$beginNumber.html(fromNum);
		$beginNumber.val(fromNum);
	}

	// 更新实时更新数据: 当前页到多少条结束显示
	const $endNumber = jTool('[end-number-info]', $footerToolbar);
	if ($endNumber.length) {
		$endNumber.html(toNum);
		$endNumber.val(toNum);
	}

	// 更新实时更新数据: 当前页
	const $currentPage = jTool('[current-page-info]', $footerToolbar);
	if ($currentPage.length) {
		$currentPage.html(cPage);
		$currentPage.val(cPage);
	}

	// 更新实时更新数据: 总条数
	const $totalsNumber = jTool('[totals-number-info]', $footerToolbar);
	if ($totalsNumber.length) {
		$totalsNumber.html(totalNum);
		$totalsNumber.val(totalNum);
	}

	// 更新实时更新数据: 总页数
	const $totalsPage = jTool('[totals-page-info]', $footerToolbar);
	if ($totalsPage.length) {
		$totalsPage.html(tPage);
		$totalsPage.val(tPage);
	}
};

/**
 * 更新底部DOM节点
 * @param $footerToolbar
 * @param settings
 * @param pageData 分页数据格式
 * @private
 */
const updateFooterDOM = ($footerToolbar: JTool, settings: SettingObj, pageData: PageData): void => {
	const { useNoTotalsMode, currentPageKey } = settings;
	useNoTotalsMode && $footerToolbar.attr('no-totals-mode', 'true');

	// 分页码区域
	const $paginationNumber = jTool('[pagination-number]', $footerToolbar);

	// 重置分页码
	$paginationNumber.html(joinPaginationNumber(currentPageKey, pageData));

	// 更新分页禁用状态
	const now = pageData[currentPageKey];
	const $firstPage = jTool('[pagination-before] .first-page', $footerToolbar);
	const $previousPage = jTool('[pagination-before] .previous-page', $footerToolbar);
	const $nextPage = jTool('[pagination-after] .next-page', $footerToolbar);
	const $lastPage = jTool('[pagination-after] .last-page', $footerToolbar);

	const firstUsable = Boolean($firstPage.length);
	const previousUsable = Boolean($previousPage.length);
	const nextUsable = Boolean($nextPage.length);
	const lastUsable = Boolean($lastPage.length);
	if (now === 1) {
		firstUsable && $firstPage.addClass(DISABLED_CLASS_NAME);
		previousUsable && $previousPage.addClass(DISABLED_CLASS_NAME);
	} else {
		firstUsable && $firstPage.removeClass(DISABLED_CLASS_NAME);
		previousUsable && $previousPage.removeClass(DISABLED_CLASS_NAME);
	}

	if (now >= pageData.tPage) {
		nextUsable && $nextPage.addClass(DISABLED_CLASS_NAME);
		lastUsable && $lastPage.addClass(DISABLED_CLASS_NAME);
	} else {
		nextUsable && $nextPage.removeClass(DISABLED_CLASS_NAME);
		lastUsable && $lastPage.removeClass(DISABLED_CLASS_NAME);
	}
};


/**
 * 跳转至指定页
 * @param settings
 * @param now 跳转页
 */
export const toPage = (settings: SettingObj, now: number): void => {
	if (!now || now < 1) {
		now = 1;
	}

	const { _, useNoTotalsMode, currentPageKey, pageData, pageSize, pageSizeKey, sortData, query, pagingBefore, pagingAfter } = settings;
	const { tPage } = pageData;
	// 未使用使用无总条数模式 且 跳转的指定页大于总页数时，强制跳转至最后一页
	if (!useNoTotalsMode && now > tPage) {
		now = tPage;
	}

	// 替换被更改的值
	pageData[currentPageKey] = now;
	pageData[pageSizeKey] = pageData[pageSizeKey] || pageSize;

	// 更新缓存
	setSettings(settings);

	// 调用事件、渲染DOM
	const newQuery = extend({}, query, sortData, pageData);
	pagingBefore(newQuery);
	core.refresh(_, () => {
		pagingAfter(newQuery);
	});
};

class AjaxPage {

	/**
	 * 初始化分页
	 * @param settings
	 */
	init(settings: SettingObj): void {
		// const settings = getSettings(_);
		const { _, disableCache, pageSizeKey, pageSize, currentPageKey, useNoTotalsMode } = settings;
		eventMap[_] = getEvent(_);

		// 每页显示条数
		let	pSize = pageSize || 10;
		// 根据本地缓存配置每页显示条数
		if (!disableCache) {
			const memoryPageSize = getUserMemory(_)[pageSizeKey];

			// 验证是否存在每页显示条数缓存数据
			if (memoryPageSize) {
				pSize = memoryPageSize;
			}
		}

		extend(settings, {
			pageData: {
				[pageSizeKey]: pSize,
				[currentPageKey]: 1
			}
		});

		// 当useNoTotalsMode:true 时，异步获取总页模式失效
		if (useNoTotalsMode) {
			settings.asyncTotals = null;
		}
		setSettings(settings);

		// 初始化dropdown
		const dropwownArg = {
			_,
			defaultValue: settings.pageData[pageSizeKey],
			onChange: (value: number) => {
				// 事件中的settings需要重新获取最新数据
				const settings = getSettings(_);
				settings.pageData = {
					[currentPageKey]: 1,
					[pageSizeKey]: value
				};

				saveUserMemory(settings);

				// 更新缓存
				setSettings(settings);

				// 调用事件、渲染tbody
				const query = extend({}, settings.query, settings.sortData, settings.pageData);
				settings.pagingBefore(query);
				core.refresh(_, () => {
					settings.pagingAfter(query);
				});
			}
		};
		dropdown.init(dropwownArg);

		// 绑定事件
		this.initEvent(_);
	}

	/**
	 * 绑定分页事件
	 * @param _
	 */
	initEvent(_: string): void {
		// 事件: 首页
		const { first, previous, next, last, num, refresh, input } = eventMap[_];
		jTool(first[TARGET]).on(first[EVENTS], first[SELECTOR], function () {
			toPage(getSettings(_), 1);
		});

		// 事件: 上一页
		jTool(previous[TARGET]).on(previous[EVENTS], previous[SELECTOR], function () {
			const settings = getSettings(_);
			const cPage = settings.pageData[settings.currentPageKey];
			const now = cPage - 1;
			toPage(settings, now < 1 ? 1 : now);
		});

		// 事件: 下一页
		jTool(next[TARGET]).on(next[EVENTS], next[SELECTOR], function () {
			const settings = getSettings(_);
			const cPage = settings.pageData[settings.currentPageKey];
			const tPage = settings.pageData.tPage;
			const now = cPage + 1;
			toPage(settings, now > tPage ? tPage : now);
		});

		// 事件: 尾页
		jTool(last[TARGET]).on(last[EVENTS], last[SELECTOR], function () {
			const settings = getSettings(_);
			toPage(settings, settings.pageData.tPage);
		});

		// 事件: 页码
		jTool(num[TARGET]).on(num[EVENTS], num[SELECTOR], function () {
			const settings = getSettings(_);
			const pageAction = jTool(this);

			// 分页页码
			const now = pageAction.attr('to-page');
			if (!now || !Number(now) || pageAction.hasClass(DISABLED_CLASS_NAME)) {
				return false;
			}
			toPage(settings, parseInt(now, 10));
		});

		// 事件: 刷新
		jTool(refresh[TARGET]).on(refresh[EVENTS], refresh[SELECTOR], function () {
			const settings = getSettings(_);
			toPage(settings, settings.pageData[settings.currentPageKey]);
		});

		// 事件: 快捷跳转
		jTool(input[TARGET]).on(input[EVENTS], input[SELECTOR], function (event: KeyboardEvent) {
			if (event.which !== 13) {
				return;
			}
			toPage(getSettings(_), parseInt(this.value, 10));
		});
	}

	/**
	 * 分页所需HTML
	 * @param params
	 * @returns {}
	 */


	@parseTpl(ajaxPageTpl)
	createHtml(params: CreateHtmlParams): string {
		const { settings } = params;
		// @ts-ignore
		return {
			gridManagerName: settings._,
			keyName: TOOLBAR_KEY,
			gotoFirstText: i18n(settings, 'goto-first-text'),
			gotoLastText: i18n(settings, 'goto-last-text'),
			firstPageText: i18n(settings, 'first-page'),
			previousPageText: i18n(settings, 'previous-page'),
			nextPageText: i18n(settings, 'next-page'),
			lastPageText: i18n(settings, 'last-page'),
			supportCheckbox: settings.supportCheckbox ? '' : 'none',
			pageShows: i18n(settings, 'this-page-shows'),
			total: i18n(settings, 'total'),
			pageSizeOptionTpl: dropdown.createHtml(settings)
		};
	}

	/**
	 * 重置分页数据
	 * @param settings
	 * @param totals 总条数
	 * @param len 本次请求返回的总条数，该参数仅在totals为空时使用
	 */
	resetPageData(settings: SettingObj, totals: number, len: number): void {
		const { _, useNoTotalsMode, currentPageKey, pageData, asyncTotals, pageSizeKey, pageSize } = settings;
		const $footerToolbar = jTool(getQuerySelector(_));
		const cPage = pageData[currentPageKey] || 1;
		const pSize = pageData[pageSizeKey] || pageSize; // 验证下是否还需要pageSize做为替补

		const update = (totals?: number, asyncTotalsText?: string) => {
			const pageData = getPageData(settings, totals, len);

			// 更新底部DOM节点
			updateFooterDOM($footerToolbar, settings, pageData);

			// 修改分页描述信息
			resetPageInfo($footerToolbar, settings, pageData, asyncTotalsText);

			// 更新Cache
			setSettings(<SettingObj>extend(true, settings, { pageData }));

			// 显示底部工具条
			$footerToolbar.css('visibility', 'visible');
		};

		// 异步总条数
		if (asyncTotals) {
			// 返回条数小于每页显示条数: 直接通过JS计算总条数
			if (len < pSize) {
				update((cPage - 1) * pSize + len);
				return;
			}

			// 正在使用异步总条数的情况下，不再使用接口返回的totals字段
			update(null, asyncTotals.text);
			asyncTotals.handler(settings, getParams(settings)).then((totals: number) => {
				update(totals);
			});
			return;
		}

		// 无总条数
		if (useNoTotalsMode) {
			update();
			return;
		}

		// 正常
		update(totals);
	}

	/**
	 * 更新刷新图标状态
	 * @param _
	 * @param isRefresh: 是否刷新
	 */
	updateRefreshIconState(_: string, isRefresh: boolean): void {
		// 刷新按纽
		const refreshAction = jTool(`${getQuerySelector(_)} .refresh-action`);

		// 当前刷新图标不存在
		if (!refreshAction.length) {
			return;
		}

		const refreshClass = 'refreshing';
		// 启动刷新
		if (isRefresh) {
			refreshAction.addClass(refreshClass);
			return;
		}

		// 停止刷新
		setTimeout(() => {
			refreshAction.removeClass(refreshClass);
		}, 3000);
	}

	/**
	 * 更新选中信息
	 * @param _
	 */
	updateCheckedInfo(_: string): void {
		const checkedInfo = jTool(`${getQuerySelector(_)} .toolbar-info.checked-info`);
		if (checkedInfo.length === 0) {
			return;
		}
		checkedInfo.html(i18n(getSettings(_), 'checked-info', getCheckedData(_).length));
	}

	/**
	 * 消毁
	 * @param _
	 */
	destroy(_: string): void {
		clearTargetEvent(eventMap[_]);
	}
}
export default new AjaxPage();
