import { AppLocalization } from 'src/app/common/LocaleRes';
import { Component, OnDestroy, AfterViewInit, ViewChild, Input, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { ListView } from '../../../controls/ListView/ListView';
import { ObjectUnitTagsService } from '../../../services/datapresentation.module/ObjectUnitTags.service';
import * as GridControls from '../../../controls/DataGrid';
import DataGrid = GridControls.DataGrid;
import SelectionRow = GridControls.SelectionRow;
import SelectionRowMode = GridControls.SelectionRowMode;
import { TagsBasketComponent } from '../Components/tags.basket/tags.basket';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { GlobalValues } from '../../../core';

export const keyCachedNameTable = 'DataPresentationCreateComponentCache.cachedObjTagsTable';
export const keyStorageUrl = "BackwardButtonComponentStorage";

@Component({
    selector: 'datapresentation-create',
    templateUrl: './datapresentation.create.html',
    styleUrls: ['./datapresentation.create.css']
})
export class DataPresentationCreateComponent implements AfterViewInit, OnDestroy {
    objectUnitTags$: Subscription;
    constructor(
        private router: Router,
        private objectUnitTagsService: ObjectUnitTagsService,
        private activateRoute: ActivatedRoute) { }

    @Input() templateHeader: TemplateRef<any>;
    @Input() PropertyFormBasket = {
        IsHeaderWhiteStyle: false,
        IsShowData: true,
        IsCompareData: false
    };

    private urlKeyParams: any;
    private urlParamsSubscribe: Subscription;
    @Input() objectUnitTags: any[];

    @ViewChild('objectsLV', { static: true }) objectsLV: ListView;
    @ViewChild('unitsLV', { static: true }) unitsLV: ListView;
    @ViewChild('tagsLV', { static: true }) tagsLV: ListView;

    @ViewChild('dataGrid', { static: true }) dataGrid: DataGrid;
    DGSearchFilter: string;

    @ViewChild('basket', { static: true }) basket: TagsBasketComponent;

    objectsLVLoading: boolean = true;
    unitsLVLoading: boolean = false;
    tagsLVLoading: boolean = false;

    basketLoading: boolean = false;
    errors: any = [];

    objectsLink: any = {};
    get isHierarchy() {
        return this.router.url.startsWith('/hierarchy');
    }
    get hierarchyApp() {
        return GlobalValues.Instance.hierarchyApp;
    }

    ngAfterViewInit() {
        if (this.objectUnitTags != null) { // ?????????????? ?????????? /datapresentation/result/tags
            this.objectUnitTags = this.objectUnitTags.map((val: any) => {
                let result = {
                    FullTagId: val.IdUnit + '|' + val.IdLogicDevice + '|' + val.TagId, // KeyField ?????? dataGrid
                    FullTagName: val.TagCode + ' ' + val.TagName + (val.TagUnitName ? ', ' + val.TagUnitName : ''),

                    ObjId: val.IdUnit, // KeyField ?????? objectsLV
                    ObjName: val.UnitDisplayText,

                    UnitId: val.IdLogicDevice, // KeyField ?????? unitsLV
                    UnitName: val.LogicDeviceDisplayText,

                    TagId: val.TagId, // KeyField ?????? tagsLV
                    TagName: val.TagName,
                    TagCode: val.TagCode,
                    TagUnitName: val.TagUnitName
                };

                return result;
            });

            this.objectsLinkInitInResultTagsComponent();
            this.init3LV();
            this.initDG();
            this.objectsLVLoading = false;

        } else { // ?????????????? ?????????? /datapresentation/create
            this.urlParamsSubscribe = this.activateRoute.queryParams.subscribe(
                params => {
                    this.saveCurrentUrl(params);
                    this.urlKeyParams = params;

                    this.objectUnitTags$ = this.objectUnitTagsService
                        .objectUnitTagsService()
                        .get(this.urlKeyParams).subscribe(
                            (vals: any) => {
                                this.objectsLinkInit(vals);
                                this.init3LV();
                                this.initDG();
                                this.objectsLVLoading = false;
                            },
                            error => {
                                this.errors.push(error);
                                this.objectsLVLoading = false;
                            }
                        );
                },
                error => {
                    this.errors.push(error);
                    this.objectsLVLoading = false;
                }
            );
        }
    }

    objectsLinkInitFromServer(vals: any[]) {
        this.objectUnitTags = [];
        vals.forEach((val: any) => {
            this.objectUnitTags.push({
                FullTagId: val.IdUnit + '|' + val.IdLogicDevice + '|' + val.TagId, // KeyField ?????? dataGrid
                FullTagName: val.TagCode + ' ' + val.TagName + (val.TagUnitName ? ', ' + val.TagUnitName : ''),

                ObjId: val.IdUnit, // KeyField ?????? objectsLV
                ObjName: val.UnitDisplayText,

                UnitId: val.IdLogicDevice, // KeyField ?????? unitsLV
                UnitName: val.LogicDeviceDisplayText,

                TagId: val.TagId, // KeyField ?????? tagsLV
                TagName: val.TagName,
                TagCode: val.TagCode,
                TagUnitName: val.TagUnitName
            });
        });

        this.objectUnitTags
            .forEach((objUnitTag: any) => {
                if (!this.objectsLink[objUnitTag.ObjId]) {
                    this.objectsLink[objUnitTag.ObjId] = {};
                    this.objectsLink[objUnitTag.ObjId].Object = this.objectsLV.createListItem(objUnitTag);

                    this.objectsLink[objUnitTag.ObjId].Units = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId] = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Unit = this.unitsLV.createListItem(objUnitTag);

                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId] = this.tagsLV.createListItem(objUnitTag);

                }
                else if (!this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId]) {
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId] = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Unit = this.unitsLV.createListItem(objUnitTag);

                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId] = this.tagsLV.createListItem(objUnitTag);

                }
                else if (!this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId]) {
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId] = this.tagsLV.createListItem(objUnitTag);

                }
            });
    }

    objectsLinkInitFromCache(vals: any[]) {
        let cachedObject: any = this.cachedFullBasketTagIds;

        let basketSrc: any[] = [];
        cachedObject.fullBasketTagIds.forEach((fullBasketTagId: any) => { // ?????????????????? ?????????????? ???????????? ???? ????????, ?????????????????????? ?? ?????????????? ???????? ?????????????? ???? vals, ???????????????????????????? objectsLinkInit
            let fullBasketTagId2Arr: string[] = fullBasketTagId.split('|');
            let valRef = vals.find(val => {
                return val.IdUnit == fullBasketTagId2Arr[0] && val.IdLogicDevice == fullBasketTagId2Arr[1] && val.TagId == fullBasketTagId2Arr[2];
            });
            let valRefInd = vals.indexOf(valRef);
            vals.splice(valRefInd, 1);

            basketSrc.push({
                FullTagId: valRef.IdUnit + '|' + valRef.IdLogicDevice + '|' + valRef.TagId, // KeyField ?????? dataGrid
                FullTagName: valRef.TagCode + ' ' + valRef.TagName + (valRef.TagUnitName ? ', ' + valRef.TagUnitName : ''),

                ObjId: valRef.IdUnit, // KeyField ?????? objectsLV
                ObjName: valRef.UnitDisplayText,

                UnitId: valRef.IdLogicDevice, // KeyField ?????? unitsLV
                UnitName: valRef.LogicDeviceDisplayText,

                TagId: valRef.TagId, // KeyField ?????? tagsLV
                TagName: valRef.TagName,
                TagCode: valRef.TagCode,
                TagUnitName: valRef.TagUnitName
            });
        });
        this.basket.DataSource = basketSrc;

        this.objectsLinkInitFromServer(vals);

    }

    objectsLinkInit(vals: any[]) {
        if (!this.cachedFullBasketTagIds) { // ?????? ???????? ???????????????????????????????? ???????????????? key
            this.objectsLinkInitFromServer(vals);
        } else {
            this.objectsLinkInitFromCache(vals);
        }
    }

    objectsLinkInitInResultTagsComponent() {
        this.objectUnitTags
            .forEach((objUnitTag: any) => {
                if (!this.objectsLink[objUnitTag.ObjId]) {
                    this.objectsLink[objUnitTag.ObjId] = {};
                    this.objectsLink[objUnitTag.ObjId].Object = this.objectsLV.createListItem(objUnitTag);

                    this.objectsLink[objUnitTag.ObjId].Units = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId] = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Unit = this.unitsLV.createListItem(objUnitTag);

                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId] = this.tagsLV.createListItem(objUnitTag);
                }
                else if (!this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId]) {
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId] = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Unit = this.unitsLV.createListItem(objUnitTag);

                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags = {};
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId] = this.tagsLV.createListItem(objUnitTag);
                }
                else if (!this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId]) {
                    this.objectsLink[objUnitTag.ObjId].Units[objUnitTag.UnitId].Tags[objUnitTag.TagId] = this.tagsLV.createListItem(objUnitTag);
                }
            });
    }

    init3LV() {
        let objLISrc: any[] = [];
        Object.keys(this.objectsLink).forEach(ObjId => {
            objLISrc.push(this.objectsLink[ObjId].Object);
            // this.objectsLV.DataSource.push(this.objectsLink[ObjId].Object); // ?????????? ???????????? ???????? - ?????????? ???????? ?????? ???? ?????????????????????? ???????? 1 ?????? ?????????? ?????????? ?????????? ???????????? ?????????????????? !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        });
        this.objectsLV.ListItemSource = objLISrc;

        if (this.objectsLV.DataSource.length) {
            if (!this.objectsLV.focusedListItem || // ?????? ?????????? ???????????? ???????????? ?? ngAfterViewInit
                !this.objectsLink[this.objectsLV.focusedListItem.Data['ObjId']]) { // ???????????????? ???????? ???????????? ?? ??????????????
                this.objectsLV.itemClick(this.objectsLV.DataSource[0]);
            } else {
                this.objectsLV.itemClick(this.objectsLink[this.objectsLV.focusedListItem.Data['ObjId']].Object); // ???????? ?????? ?????????????? ???????????????? ?? ?????????????? ?? ?????????????? ??????????????
            }
        } else { // ???????? ?????? ?????????????? ???????????????? ?? ??????????????
            this.unitsLV.DataSource = [];
            this.tagsLV.DataSource = [];
        }
    }

    initDG() {
        this.dataGrid.SelectionRow = new SelectionRow(SelectionRowMode.Multiple);
        this.dataGrid.Columns = [
            {
                Name: 'ObjName',
                Caption: this.isHierarchy ? this.hierarchyApp.NodesName : AppLocalization.Object,
                AppendFilter: false,
                IsSearch: false
            },
            {
                Name: 'UnitName',
                Caption: AppLocalization.Label32,
                AppendFilter: false,
                IsSearch: false
            },
            {
                Name: 'FullTagName',
                Caption: AppLocalization.Tag,
                AppendFilter: false,
                IsSearch: true
            }
        ];

        this.dataGrid.initDataGrid();
        this.reInitDG();
    }

    reInitDG() {
        let dataGridSource: any[] = [];
        Object.keys(this.objectsLink).forEach(ObjId => {
            Object.keys(this.objectsLink[ObjId].Units).forEach(UnitId => {
                Object.keys(this.objectsLink[ObjId].Units[UnitId].Tags).forEach(TagId => {
                    dataGridSource.push(this.objectsLink[ObjId].Units[UnitId].Tags[TagId].Data);
                });
            });
        });
        this.dataGrid.DataSource = dataGridSource;
    }

    onObjectClick(obj: any) {
        this.unitsLVLoading = true;

        let unitsLISrc: any[] = [];
        Object.keys(this.objectsLink[obj.Data.ObjId].Units).forEach(UnitId => {
            unitsLISrc.push(this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit);
        });
        this.unitsLV.ListItemSource = unitsLISrc;

        setTimeout(() => { this.unitsLVLoading = false; }, 0);
        if (!this.unitsLV.focusedListItem || // ?????? ?????????? ???????????? ???????????? ?? ngAfterViewInit
            !this.objectsLink[obj.Data['ObjId']].Units[this.unitsLV.focusedListItem.Data['UnitId']]) { // ???????????????? ???????? ???????? ?? ??????????????
            this.unitsLV.itemClick(this.unitsLV.DataSource[0]); // ?????????????? ???? ???????????? ???????? ?????????? ?????????????????????????? ?????? ????????
        } else {
            // this.unitsLV.itemClick(this.unitsLV.focusedListItem);
            this.unitsLV.itemClick(this.objectsLink[obj.Data['ObjId']].Units[this.unitsLV.focusedListItem.Data['UnitId']].Unit); // ???????? ?????? ?????????????? ???????????????? ?? ?????????????? ?? ?????????????? ??????????????
        }
    }
    onObjectCheckClick(obj: any) {
        if (obj != null) { // ?????????????? ?????????????? ?????????????? ????????????
            if (!obj.IsCheck && obj.IsIndeterminate) { // ?????? ???????????????? ????????????
                obj.IsCheck = false;
                obj.IsIndeterminate = false;

                Object.keys(this.objectsLink[obj.Data.ObjId].Units).forEach(UnitId => {
                    this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit.IsCheck = false;
                    this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit.IsIndeterminate = false;

                    Object.keys(this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags).forEach(TagId => {
                        this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags[TagId].IsCheck = false;
                        this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags[TagId].IsIndeterminate = false;
                    });
                });
            } else if (obj.IsCheck && !obj.IsIndeterminate) { //????????????
                Object.keys(this.objectsLink[obj.Data.ObjId].Units).forEach(UnitId => {
                    this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit.IsCheck = true;
                    this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit.IsIndeterminate = false;

                    Object.keys(this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags).forEach(TagId => {
                        this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags[TagId].IsCheck = true;
                        this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags[TagId].IsIndeterminate = false;
                    });
                });

            } else if (!obj.IsCheck && !obj.IsIndeterminate) { //????????????????
                Object.keys(this.objectsLink[obj.Data.ObjId].Units).forEach(UnitId => {
                    this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit.IsCheck = false;
                    this.objectsLink[obj.Data.ObjId].Units[UnitId].Unit.IsIndeterminate = false;

                    Object.keys(this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags).forEach(TagId => {
                        this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags[TagId].IsCheck = false;
                        this.objectsLink[obj.Data.ObjId].Units[UnitId].Tags[TagId].IsIndeterminate = false;
                    });
                });
            }

            this.objectsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.objectsLV
            this.unitsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.unitsLV
            this.tagsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.tagsLV

            this.objectsLV.itemClick(obj); // ?????????????? ???? ???????????? ?????????? ?????????????????????? ?????? ??????????

        } else { // ?????????????? ?????????????? ???????????? - onObjectHeaderCheck
            let visibleItems = this.objectsLV.getVisibleItems();
            if (visibleItems.length > 0) {
                let headerCheck: boolean = visibleItems[0].IsCheck;

                visibleItems.forEach(objLI => {
                    Object.keys(this.objectsLink[objLI.Data.ObjId].Units).forEach(UnitId => {
                        this.objectsLink[objLI.Data.ObjId].Units[UnitId].Unit.IsCheck = headerCheck;
                        this.objectsLink[objLI.Data.ObjId].Units[UnitId].Unit.IsIndeterminate = false;

                        Object.keys(this.objectsLink[objLI.Data.ObjId].Units[UnitId].Tags).forEach(TagId => {
                            this.objectsLink[objLI.Data.ObjId].Units[UnitId].Tags[TagId].IsCheck = headerCheck;
                            this.objectsLink[objLI.Data.ObjId].Units[UnitId].Tags[TagId].IsIndeterminate = false;
                        });
                    });
                });

                this.unitsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.unitsLV
                this.tagsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.tagsLV
            }
        }
    }

    onUnitClick(unit: any) {
        this.tagsLVLoading = true;

        let tagsLISrc: any[] = [];
        Object.keys(this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags).forEach(TagId => {
            tagsLISrc.push(this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId]);
        });
        this.tagsLV.ListItemSource = tagsLISrc;

        setTimeout(() => { this.tagsLVLoading = false; }, 0);
    }
    onUnitCheckClick(unit: any) {
        if (unit != null) { // ?????????????? ?????????????? ?????????????? ????????????
            if (!unit.IsCheck && unit.IsIndeterminate) { // ?????? ???????????????? ????????????
                unit.IsCheck = false;
                unit.IsIndeterminate = false;

                Object.keys(this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags).forEach(TagId => {
                    this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId].IsCheck = false;
                    this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId].IsIndeterminate = false;
                });
            } else if (unit.IsCheck && !unit.IsIndeterminate) { // ????????????
                Object.keys(this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags).forEach(TagId => {
                    this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId].IsCheck = true;
                    this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId].IsIndeterminate = false;
                });
            } else if (!unit.IsCheck && !unit.IsIndeterminate) { // ????????????????
                Object.keys(this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags).forEach(TagId => {
                    this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId].IsCheck = false;
                    this.objectsLink[unit.Data.ObjId].Units[unit.Data.UnitId].Tags[TagId].IsIndeterminate = false;
                });
            }
            this.tagsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.tagsLV

            this.unitsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.unitsLV

            this.correctParentChecks(this.unitsLV, this.objectsLV/*, unit, 'unit'*/);

            this.unitsLV.itemClick(unit); // ?????????????? ???? ???????? ?????????? ?????????????????????? ?????? ????????
        }
        else { // ?????????????? ?????????????? ???????????? - onUnitHeaderCheck
            let visibleItems = this.unitsLV.getVisibleItems();
            if (visibleItems.length > 0) {
                let headerCheck: boolean = visibleItems[0].IsCheck;
                visibleItems.forEach(unitLI => {
                    Object.keys(this.objectsLink[unitLI.Data.ObjId].Units[unitLI.Data.UnitId].Tags).forEach(TagId => {
                        this.objectsLink[unitLI.Data.ObjId].Units[unitLI.Data.UnitId].Tags[TagId].IsCheck = headerCheck;
                        this.objectsLink[unitLI.Data.ObjId].Units[unitLI.Data.UnitId].Tags[TagId].IsIndeterminate = false;
                    });
                });
                this.tagsLV.updateItemsSelectLength(); // ???????????? ????????????-?????????????? this.tagsLV

                this.correctParentChecks(this.unitsLV, this.objectsLV/*, this.unitsLV.DataSource[0], 'unit'*/);
            }
        }
    }

    onTagClick(tag: any) {
        this.correctParentChecks(this.tagsLV, this.unitsLV/*, tag, 'tag'*/);
        this.correctParentChecks(this.unitsLV, this.objectsLV/*, tag, 'unit'*/);
    }
    onTagHeaderCheckClick(tag: any) {
        if (tag == null) {
            if (this.tagsLV.getVisibleItems().length > 0) {
                this.correctParentChecks(this.tagsLV, this.unitsLV/*, this.tagsLV.DataSource[0], 'tag'*/);
                this.correctParentChecks(this.unitsLV, this.objectsLV/*, this.unitsLV.DataSource[0], 'unit'*/);
            }
        }
    }

    correctParentChecks(childLV: ListView, parentLV: ListView/*, item: any, type: string*/) {
        let allLength: number = childLV.DataSource.length;
        let checkedLength: number = childLV.DataSource.filter(LI => LI.IsCheck && !LI.IsIndeterminate).length;
        let indeterminatedLength: number = childLV.DataSource.filter(LI => !LI.IsCheck && LI.IsIndeterminate).length;

        if (indeterminatedLength > 0) {
            parentLV.focusedListItem.IsCheck = false;
            parentLV.focusedListItem.IsIndeterminate = true;
        } else if (allLength == checkedLength) {
            parentLV.focusedListItem.IsCheck = true;
            parentLV.focusedListItem.IsIndeterminate = false;
        } else if (checkedLength > 0 && checkedLength < allLength) {
            parentLV.focusedListItem.IsCheck = false;
            parentLV.focusedListItem.IsIndeterminate = true;
        } else {
            parentLV.focusedListItem.IsCheck = false;
            parentLV.focusedListItem.IsIndeterminate = false;
        }
        parentLV.updateItemsSelectLength(); // ???????????? header-check ????????????????
    }

    tags2BasketFrom3LV() {
        this.objectsLVLoading = true;
        this.basketLoading = true;
        let basketSrc: any[] = this.basket.DataSource.map(LI => { return LI.Data; });

        Object.keys(this.objectsLink).forEach(ObjId => {
            if (this.objectsLink[ObjId].Object.IsCheck && !this.objectsLink[ObjId].Object.IsIndeterminate) { // Object IsCheck
                Object.keys(this.objectsLink[ObjId].Units).forEach(UnitId => {
                    Object.keys(this.objectsLink[ObjId].Units[UnitId].Tags).forEach(TagId => {
                        basketSrc.push(this.objectsLink[ObjId].Units[UnitId].Tags[TagId].Data);
                    });
                });

                delete this.objectsLink[ObjId];

            } else if (!this.objectsLink[ObjId].Object.IsCheck && this.objectsLink[ObjId].Object.IsIndeterminate) { // Object IsIndeterminate
                Object.keys(this.objectsLink[ObjId].Units).forEach(UnitId => {
                    if (this.objectsLink[ObjId].Units[UnitId].Unit.IsCheck && !this.objectsLink[ObjId].Units[UnitId].Unit.IsIndeterminate) { // Unit IsCheck
                        this.objectsLink[ObjId].Object.IsCheck = false;
                        this.objectsLink[ObjId].Object.IsIndeterminate = false;

                        Object.keys(this.objectsLink[ObjId].Units[UnitId].Tags).forEach(TagId => {
                            basketSrc.push(this.objectsLink[ObjId].Units[UnitId].Tags[TagId].Data);
                        });

                        delete this.objectsLink[ObjId].Units[UnitId];

                    } else if (!this.objectsLink[ObjId].Units[UnitId].Unit.IsCheck && this.objectsLink[ObjId].Units[UnitId].Unit.IsIndeterminate) { // Unit IsIndeterminate
                        this.objectsLink[ObjId].Object.IsCheck = false;
                        this.objectsLink[ObjId].Object.IsIndeterminate = false;

                        this.objectsLink[ObjId].Units[UnitId].Unit.IsCheck = false;
                        this.objectsLink[ObjId].Units[UnitId].Unit.IsIndeterminate = false;

                        Object.keys(this.objectsLink[ObjId].Units[UnitId].Tags).forEach(TagId => {
                            if (this.objectsLink[ObjId].Units[UnitId].Tags[TagId].IsCheck) {
                                basketSrc.push(this.objectsLink[ObjId].Units[UnitId].Tags[TagId].Data);
                                delete this.objectsLink[ObjId].Units[UnitId].Tags[TagId];
                            }
                        });
                    }
                });
            }
        });

        this.init3LV();
        this.basket.DataSource = basketSrc;
        this.reInitDG();

        setTimeout(() => { this.objectsLVLoading = false; }, 0);
        setTimeout(() => { this.basketLoading = false; }, 0);

        this.saveFullBasketTagIds();
    }

    tags2BasketFromDG() {
        this.DGLoading = true;

        let selectedTags: any[] = this.dataGrid.getSelectDataRows();

        let recountedObjectsLink: any = {}; // ?????????????? ?? ?????????? ?????????????????? ?????????? ?????? ???????? ???????? ?????????? ?????????????????????? ?? 3LV -
        // ???????????? ?????? ???????????????? ?????? ?????????????? ?????????????? (!IsCheck && IsIndeterminate) ?? ?????? ?????????? ?????????????? (!IsCheck && IsIndeterminate)

        let basketSrc: any[] = this.basket.DataSource.map(LI => { return LI.Data; });

        selectedTags.forEach(tag => {
            if (!this.objectsLink[tag.ObjId].Object.IsCheck && this.objectsLink[tag.ObjId].Object.IsIndeterminate &&
                !recountedObjectsLink[tag.ObjId]) {
                recountedObjectsLink[tag.ObjId] = {};
                recountedObjectsLink[tag.ObjId][tag.UnitId] = {};
            } else if (recountedObjectsLink[tag.ObjId] &&
                !this.objectsLink[tag.ObjId].Units[tag.UnitId].Unit.IsCheck && this.objectsLink[tag.ObjId].Units[tag.UnitId].Unit.IsIndeterminate &&
                !recountedObjectsLink[tag.ObjId][tag.UnitId]) {
                recountedObjectsLink[tag.ObjId][tag.UnitId] = {};
            }

            basketSrc.push(this.objectsLink[tag.ObjId].Units[tag.UnitId].Tags[tag.TagId].Data);
            delete this.objectsLink[tag.ObjId].Units[tag.UnitId].Tags[tag.TagId]; // ?????????????? ??????

            if (Object.keys(this.objectsLink[tag.ObjId].Units[tag.UnitId].Tags).length == 0) {
                delete this.objectsLink[tag.ObjId].Units[tag.UnitId]; // ?????????????? ???????? ???????? ?????? ?????? ???????? ??????????????

                if (Object.keys(this.objectsLink[tag.ObjId].Units).length == 0) {
                    delete this.objectsLink[tag.ObjId]; // ?????????????? ???????????? ???????? ?????? ?????? ?????????? ??????????????
                }
            }
        });
        this.basket.DataSource = basketSrc;

        this.reInitDG();
        this.DGLoading = false;

        Object.keys(recountedObjectsLink).forEach(ObjId => { // ?????????????????????????? ???????? 3LV
            Object.keys(recountedObjectsLink[ObjId]).forEach(UnitdId => {
                let tagIds: any[] = Object.keys(this.objectsLink[ObjId].Units[UnitdId].Tags);
                if (tagIds.length == tagIds.filter(TagId => this.objectsLink[ObjId].Units[UnitdId].Tags[TagId].IsCheck).length) {
                    this.objectsLink[ObjId].Units[UnitdId].Unit.IsCheck = true;
                    this.objectsLink[ObjId].Units[UnitdId].Unit.IsIndeterminate = false;

                } else if (tagIds.length == tagIds.filter(TagId => !this.objectsLink[ObjId].Units[UnitdId].Tags[TagId].IsCheck).length) {
                    this.objectsLink[ObjId].Units[UnitdId].Unit.IsCheck = false;
                    this.objectsLink[ObjId].Units[UnitdId].Unit.IsIndeterminate = false;

                }
            });

            let unitIds: any[] = Object.keys(this.objectsLink[ObjId].Units);
            if (unitIds.filter(UnitId => this.objectsLink[ObjId].Units[UnitId].Unit.IsIndeterminate).length == 0) {
                if (unitIds.length == unitIds.filter(UnitId => this.objectsLink[ObjId].Units[UnitId].Unit.IsCheck).length) {
                    this.objectsLink[ObjId].Object.IsCheck = true;
                    this.objectsLink[ObjId].Object.IsIndeterminate = false;

                } else if (unitIds.length == unitIds.filter(UnitId => !this.objectsLink[ObjId].Units[UnitId].Unit.IsCheck).length) {
                    this.objectsLink[ObjId].Object.IsCheck = false;
                    this.objectsLink[ObjId].Object.IsIndeterminate = false;

                }
            }
        });

        this.init3LV();

        this.saveFullBasketTagIds();
    }

    tagsFromBasket(tagLIs: any[]) {
        // ???????????????????? ????????, ??????????, ?????????????? ?? 3LV
        tagLIs.forEach(tagLI => {
            if (!this.objectsLink[tagLI.Data.ObjId]) {
                this.objectsLink[tagLI.Data.ObjId] = {};
                this.objectsLink[tagLI.Data.ObjId].Object = Object.assign({}, tagLI);
                this.objectsLink[tagLI.Data.ObjId].Units = {};

                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId] = {};
                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Unit = Object.assign({}, tagLI);
                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Tags = {};

                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Tags[tagLI.Data.TagId] = Object.assign({}, tagLI);

            } else if (!this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId]) {
                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId] = {};
                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Unit = Object.assign({}, tagLI);
                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Tags = {};

                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Tags[tagLI.Data.TagId] = Object.assign({}, tagLI);

            } else {
                this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Tags[tagLI.Data.TagId] = tagLI;

                let unitLI: any = this.objectsLink[tagLI.Data.ObjId].Units[tagLI.Data.UnitId].Unit;
                let objectLI: any = this.objectsLink[tagLI.Data.ObjId].Object;

                if (unitLI.IsCheck && !unitLI.IsIndeterminate) { // ?????? ???????????? ???????????? ?????????????????? ?????????? ???? ?? ????????-???? ?? ?????? ?????????????? ?????????????????? ?????????? ????
                    unitLI.IsIndeterminate = true;
                    unitLI.IsCheck = false;

                    objectLI.IsIndeterminate = true;
                    objectLI.IsCheck = false;
                }
            }
        });

        this.init3LV();
        setTimeout(() => { this.objectsLVLoading = false; }, 0);

        this.reInitDG();
        this.DGLoading = false;

        this.saveFullBasketTagIds();
    }

    saveFullBasketTagIds() {
        let componentState: any = {
            fullBasketTagIds: this.basket.DataSource.map((LI: any) => { return LI.Data.FullTagId; }),
        };
        this.cachedFullBasketTagIds = componentState;
    }

    public filterSearchName: string[] = [this.isHierarchy ? this.hierarchyApp.NodesName : AppLocalization.Objects, AppLocalization.Label32, AppLocalization.Tags];
    public filterByObject = false;
    public filterByUnit = false;
    public filterByTag = true;
    private searchTimeout: any;
    DGLoading: boolean = false;

    filterBy(filter: string) {
        this.DGLoading = true;
        let field: string;

        this.filterByObject = false;
        this.filterByUnit = false;
        this.filterByTag = false;

        if (filter === AppLocalization.Label32) {
            this.filterByUnit = true;
            field = "UnitName";

        } else if (filter === AppLocalization.Tags) {
            this.filterByTag = true;
            field = "FullTagName";
        } else {
            this.filterByObject = true;
            field = "ObjName";
        }

        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            //if (!this.dataGrid.DataSource.length) this.reInitDG();

            let Filter = {};
            Filter[field] = this.DGSearchFilter;

            this.dataGrid.Filter = Filter;
            this.DGLoading = false;
        }, 200);
    }


    get totalTagsAmt() {
        let total = 0;

        Object.keys(this.objectsLink).forEach(ObjId => {
            Object.keys(this.objectsLink[ObjId].Units).forEach(UnitId => {
                Object.keys(this.objectsLink[ObjId].Units[UnitId].Tags).forEach(TagId => {
                    total++;
                });
            });
        });

        return total;
    }

    get tags2Basket() {
        if (!this.DGSearchFilter) { // 3LV
            return Object.keys(this.objectsLink).filter(ObjId => (this.objectsLink[ObjId].Object.IsCheck || this.objectsLink[ObjId].Object.IsIndeterminate)).length;
        } else { // DG
            return this.dataGrid.getSelectDataRows().length;
        }
    }

    private get cachedFullBasketTagIds() {
        let params = this.urlKeyParams;
        if (params) {
            let cache = localStorage.getItem(keyCachedNameTable);
            if (cache) {
                cache = JSON.parse(cache);
                if (!cache[params.key]) {
                    localStorage.removeItem(keyCachedNameTable);
                }
                else {
                    return cache[params.key];
                }
            }
        }

        return null;
    }

    private set cachedFullBasketTagIds(val: any) {
        let params = this.urlKeyParams;
        if (params) {
            localStorage.removeItem(keyCachedNameTable);

            let cache = {};
            cache[params.key] = val;

            localStorage.setItem(keyCachedNameTable, JSON.stringify(cache));
        }
    }

    saveCurrentUrl(params: any) {
        localStorage.setItem(`${keyStorageUrl}.datapresentation/result`, JSON.stringify({ redirectTo: "datapresentation/create", queryParams: { queryParams: params } }));
    }

    ngOnDestroy() {
        this.unsubscriber(this.objectUnitTags$);
        this.unsubscriber(this.urlParamsSubscribe);
    }

    unsubscriber(sub: Subscription) {
        if (sub) {
            sub.unsubscribe();
        }
    }
}