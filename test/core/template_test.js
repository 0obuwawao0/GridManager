import template from '../../src/module/core/template';
import { clearCompileList } from '../../src/common/framework';
import TextConfig from '@module/i18n/config';

describe('core template', () => {
    describe('createWrapTpl', () => {
        let settings = null;
        let htmlStr = null;
        beforeEach(() => {
        });
        afterEach(() => {
            settings = null;
            htmlStr = null;
        });

        it('执行验证: 未开启条件项', () => {
            htmlStr = `
                <div class="table-wrap" grid-manager-wrap="test">
                    <div class="table-header"></div>
                    <div class="table-div" grid-manager-div="test"></div>
                    <span class="text-dreamland"></span>
                </div>
            `.replace(/\s/g, '');
            settings = {
                _: 'test',
                skinClassName: undefined,
                isIconFollowText: false,
                disableBorder: false,
                disableLine: false,
                supportConfig: false,
                supportAjaxPage: false
            };
            expect(template.getWrapTpl({settings}).replace(/\s/g, '')).toEqual(htmlStr);
        });

        it('执行验证: 增加皮肤标识', () => {
            htmlStr = `
                <div class="table-wrap ui-skin" grid-manager-wrap="test">
                    <div class="table-header"></div>
                    <div class="table-div" grid-manager-div="test"></div>
                    <span class="text-dreamland"></span>
                </div>
            `.replace(/\s/g, '');
            settings = {
                _: 'test',
                skinClassName: 'ui-skin',
                isIconFollowText: false,
                disableBorder: false,
                disableLine: false,
                supportConfig: false,
                supportAjaxPage: false
            };
            expect(template.getWrapTpl({settings}).replace(/\s/g, '')).toEqual(htmlStr);
        });

        it('执行验证: 增加跟随文本class', () => {
            htmlStr = `
                <div class="table-wrap ui-skin gm-icon-follow-text" grid-manager-wrap="test">
                    <div class="table-header"></div>
                    <div class="table-div" grid-manager-div="test"></div>
                    <span class="text-dreamland"></span>
                </div>
            `.replace(/\s/g, '');
            settings = {
                _: 'test',
                skinClassName: 'ui-skin',
                isIconFollowText: true,
                disableBorder: false,
                disableLine: false,
                supportConfig: false,
                supportAjaxPage: false
            };
            expect(template.getWrapTpl({settings}).replace(/\s/g, '')).toEqual(htmlStr);
        });

        it('执行验证: 增加禁用边框线标识', () => {
            htmlStr = `
                <div class="table-wrap ui-skin gm-icon-follow-text disable-border" grid-manager-wrap="test">
                    <div class="table-header"></div>
                    <div class="table-div" grid-manager-div="test"></div>
                    <span class="text-dreamland"></span>
                </div>
            `.replace(/\s/g, '');
            settings = {
                _: 'test',
                skinClassName: 'ui-skin',
                isIconFollowText: true,
                disableBorder: true,
                disableLine: false,
                supportConfig: false,
                supportAjaxPage: false
            };
            expect(template.getWrapTpl({settings}).replace(/\s/g, '')).toEqual(htmlStr);
        });

        it('执行验证: 增加禁用单元格分割线标识', () => {
            htmlStr = `
                <div class="table-wrap disable-line" grid-manager-wrap="test">
                    <div class="table-header"></div>
                    <div class="table-div" grid-manager-div="test"></div>
                    <span class="text-dreamland"></span>
                </div>
            `.replace(/\s/g, '');
            settings = {
                _: 'test',
                skinClassName: undefined,
                isIconFollowText: false,
                disableBorder: false,
                disableLine: true,
                supportConfig: false,
                supportAjaxPage: false
            };
            expect(template.getWrapTpl({settings}).replace(/\s/g, '')).toBe(htmlStr);
        });
    });

    describe('createThTpl', () => {
        let settings = null;
        let col = null;
        let htmlStr = null;
        beforeEach(() => {
            clearCompileList('test');
        });
        afterEach(() => {
            settings = null;
            htmlStr = null;
            col = null;
            clearCompileList('test');
        });

        it('执行验证: 未开启条件项', () => {
            htmlStr = `
                <th th-name="title" style="width:auto">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            settings = {
                _: 'test'
            };
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 开启表头提醒', () => {
            htmlStr = `
                <th th-name="title" style="width:auto" remind>
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                        <div class="gm-remind-action">
							<i class="ra-icon gm-icon gm-icon-help"></i>
							<div class="ra-area">this is title</div>
						</div>
                    </div>
                </th>
            `.replace(/\s/g, '');
            settings = {
                _: 'test'
            };
            col = {
                key: 'title',
                remind: 'this is title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 开启排序', () => {
            settings = {
                _: 'test',
                sortUpText: 'ASC',
                sortDownText: 'DESC',
                sortData: {}
            };

            // 排序方向为空
            htmlStr = `
                <th th-name="title" style="width:auto" sorting>
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                        <div class="gm-sorting-action">
							<i class="sa-icon sa-up gm-icon gm-icon-up"></i>
							<i class="sa-icon sa-down gm-icon gm-icon-down"></i>
						</div>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                sorting: ''
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);

            // 排序方向为下
            htmlStr = `
                <th th-name="title" style="width:auto" sorting="DESC">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                        <div class="gm-sorting-action sorting-down">
							<i class="sa-icon sa-up gm-icon gm-icon-up"></i>
							<i class="sa-icon sa-down gm-icon gm-icon-down"></i>
						</div>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                sorting: 'DESC'
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);

            // 排序方向为上
            htmlStr = `
                <th th-name="title" style="width:auto" sorting="ASC">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                        <div class="gm-sorting-action sorting-up">
							<i class="sa-icon sa-up gm-icon gm-icon-up"></i>
							<i class="sa-icon sa-down gm-icon gm-icon-down"></i>
						</div>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                sorting: 'ASC'
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 开启过滤', () => {
            settings = {
                _: 'test',
				i18n: 'zh-cn',
				textConfig: new TextConfig(),
                query: {}
            };

            htmlStr = `
                <th th-name="type" style="width:auto" filter>
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                        <div class="gm-filter-area">
							<i class="fa-icon gm-icon gm-icon-filter filter-selected"></i>
							<div class="fa-con">
								<ul class="filter-list">
									<li class="filter-checkbox">
										<label class="gm-checkbox-wrapper">
											<span class="gm-radio-checkbox gm-checkbox gm-checkbox-checked">
												<input type="checkbox" class="gm-radio-checkbox-input gm-checkbox-input" value="1" checked="true"/>
												<span class="gm-radio-checkbox-inner gm-checkbox-inner"></span>
											</span>
											<span class="gm-radio-checkbox-label">HTML</span>
										</label>
									</li>
									<li class="filter-checkbox">
										<label class="gm-checkbox-wrapper">
											<span class="gm-radio-checkbox gm-checkbox gm-checkbox-checked">
												<input type="checkbox" class="gm-radio-checkbox-input gm-checkbox-input" value="2" checked="true"/>
												<span class="gm-radio-checkbox-inner gm-checkbox-inner"></span>
											</span>
											<span class="gm-radio-checkbox-label">CSS</span>
										</label>
									</li>
									<li class="filter-checkbox">
										<label class="gm-checkbox-wrapper">
											<span class="gm-radio-checkbox gm-checkbox">
												<input type="checkbox" class="gm-radio-checkbox-input gm-checkbox-input" value="3"/>
												<span class="gm-radio-checkbox-inner gm-checkbox-inner"></span>
											</span>
											<span class="gm-radio-checkbox-label">javaScript</span>
										</label>
									</li>
								</ul>
								<div class="filter-bottom">
									<span class="filter-button filter-submit">确定</span>
									<span class="filter-button filter-reset">重置</span>
								</div>
							</div>
						</div>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'type',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                filter: {
					option: [
						{value: '1', text: 'HTML'},
						{value: '2', text: 'CSS'},
						{value: '3', text: 'javaScript'}
					],
					selected: '1,2',
					isMultiple: true
                }
            };
			document.body.innerHTML = '<div class="table-wrap" grid-manager-wrap="test" style="height: 500px"></div>';
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
            expect(settings.query.type).toBe('1,2');
			document.body.innerHTML = '';
        });

        it('开启宽度调整', () => {
			htmlStr = `
                <th th-name="title" style="width:auto">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                        <span class="gm-adjust-action"></span>
                    </div>
                </th>
            `.replace(/\s/g, '');
			settings = {
				_: 'test',
				supportAdjust: true
			};
			col = {
				key: 'title',
				text: () => '标题',  // 到这一步时，text已经被转换为function
				isShow: true
			};
			expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
		});

        it('执行验证: 开启固定列', () => {
            settings = {
                _: 'test'
            };

            // fixed: ''
            htmlStr = `
                <th th-name="title" style="width:auto">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                fixed: ''
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);

            // fixed: left
            htmlStr = `
                <th th-name="title" style="width:auto" fixed="left">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                fixed: 'left'
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);

            // fixed: right
            htmlStr = `
                <th th-name="title" style="width:auto" fixed="right">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                fixed: 'right'
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: align', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="title" style="width:auto" align="left">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                align: 'left'
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 隐藏', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="title" style="width:auto" cell-hidden>
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: false
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 启用拖拽', () => {
            settings = {
                _: 'test',
                supportDrag: true
            };

            htmlStr = `
                <th th-name="title" style="width:auto">
                    <div class="th-wrap">
                        <span class="th-text gm-drag-action" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 行列合并', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="title" colspan="3" rowspan="2" style="width:auto">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                colspan: 3,
                rowspan: 2
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 存在宽', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="title" style="width:120px">
                    <div class="th-wrap">
                        <span class="th-text" >标题</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'title',
                text: () => '标题',  // 到这一步时，text已经被转换为function
                isShow: true,
                width: 120
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 序号列', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="gm_order" style="width:40px" gm-create gm-order>
                    <div class="th-wrap">
                        <span class="th-text" >序号</span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'gm_order',
                text: '序号',  // 自动创建的列不会转换为function
                isShow: true,
                width: 40
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 选择列', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="gm_checkbox" style="width:50px" gm-create gm-checkbox>
                    <div class="th-wrap">
                        <span class="th-text" ></span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'gm_checkbox',
                text: '',  // 自动创建的列不会转换为function
                isShow: true,
                width: 50
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });

        it('执行验证: 序号列', () => {
            settings = {
                _: 'test'
            };

            htmlStr = `
                <th th-name="gm_fold" style="width:40px" gm-create>
                    <div class="th-wrap">
                        <span class="th-text" ></span>
                    </div>
                </th>
            `.replace(/\s/g, '');
            col = {
                key: 'gm_fold',
                text: '',  // 自动创建的列不会转换为function
                isShow: true,
                width: 40
            };
            expect(template.getThTpl({ settings, col }).replace(/\s/g, '')).toBe(htmlStr);
        });
    });
    // getTheadTpl 方法内的逻辑已移至Render内
    // describe('createTheadTpl', () => {
    //     let settings;
    //     let htmlStr;
    //     beforeEach(() => {
	//
    //     });
    //     afterEach(() => {
    //         settings = null;
    //         htmlStr = null;
    //     });
    //     it('执行验证: 非嵌套表头', () => {
    //         settings = {
    //             _: 'test',
    //             columnMap: {
    //                 gm_order: {
    //                     key: 'gm_order',
    //                     text: '序号',  // 自动创建的列不会转换为function
    //                     isShow: true,
    //                     width: 40,
    //                     index: 0
    //                 },
    //                 title: {
    //                     key: 'title',
    //                     text: () => '标题',
    //                     isShow: true,
    //                     index: 1
    //                 }
    //             },
    //             __isNested: false
    //         };
	//
    //         htmlStr = `
	// 			<tr>
	// 				<th th-name="gm_order" style="width:40px" gm-create gm-order>
	// 					<div class="th-wrap">
	// 						<span class="th-text" >序号</span>
	// 					</div>
	// 				</th>
	// 				<th th-name="title" style="width:auto">
	// 					<div class="th-wrap">
	// 						<span class="th-text" >标题</span>
	// 					</div>
	// 				</th>
	// 			</tr>
    //         `.replace(/\s/g, '');
    //         expect(template.getTheadTpl({ settings }).replace(/\s/g, '')).toBe(htmlStr);
    //     });
	//
    //     it('执行验证: 嵌套表头', () => {
    //         settings = {
    //             _: 'test',
    //             columnMap: {
    //                 gm_order: {
    //                     key: 'gm_order',
    //                     text: '序号',  // 自动创建的列不会转换为function
    //                     isShow: true,
    //                     width: 40,
    //                     level: 0,
    //                     index: 0
    //                 },
    //                 title: {
    //                     key: 'title',
    //                     text: () => '标题',
    //                     isShow: true,
    //                     level: 0,
    //                     index: 1,
    //                     children: [
    //                         {
    //                             key: 'subtitle',
    //                             text: () => '子标题',
    //                             isShow: true,
    //                             level: 1,
    //                             pk: 'title',
    //                             index: 0
    //                         },
    //                         {
    //                             key: 'pic',
    //                             text: () => '标题图片',
    //                             isShow: true,
    //                             level: 1,
    //                             pk: 'title',
    //                             index: 1
    //                         }
    //                     ]
    //                 },
    //                 subtitle: {
    //                     key: 'subtitle',
    //                     text: () => '子标题',
    //                     isShow: true,
    //                     level: 1,
    //                     pk: 'title',
    //                     index: 0
    //                 },
    //                 pic: {
    //                     key: 'pic',
    //                     text: () => '标题图片',
    //                     isShow: true,
    //                     level: 1,
    //                     pk: 'title',
    //                     index: 1
    //                 }
    //             },
    //             __isNested: true
    //         };
	//
    //         htmlStr = `
	// 			<tr>
	// 				<th th-name="gm_order" colspan="1" rowspan="2" style="width:40px" gm-create gm-order>
	// 					<div class="th-wrap">
	// 						<span class="th-text" >序号</span>
	// 					</div>
	// 				</th>
	// 				<th th-name="title" colspan="2" rowspan="1" style="width:auto">
	// 					<div class="th-wrap">
	// 						<span class="th-text" >标题</span>
	// 					</div>
	// 				</th>
	// 			</tr>
	// 			<tr>
	// 				<th th-name="subtitle" colspan="1" rowspan="1" style="width:auto">
	// 					<div class="th-wrap">
	// 						<span class="th-text" >子标题</span>
	// 					</div>
	// 				</th>
	// 				<th th-name="pic" colspan="1" rowspan="1" style="width:auto">
	// 					<div class="th-wrap">
	// 						<span class="th-text" >标题图片</span>
	// 					</div>
	// 				</th>
	// 			</tr>
    //         `.replace(/\s/g, '');
    //         expect(template.getTheadTpl({ settings }).replace(/\s/g, '')).toBe(htmlStr);
    //     });
    // });
});
