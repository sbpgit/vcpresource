sap.ui.define(
    [
        "vcpapp/vcprestrictions/controller/BaseController",
        "sap/m/MessageToast",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/ui/Device",
        "../model/formatter"
    ],
    function (
        BaseController,
        MessageToast,
        JSONModel,
        Filter,
        FilterOperator,
        MessageBox,
        Device,
        formatter
    ) {
        "use strict";
        var that, oGModel, saveObj;
        var aDetails


        return BaseController.extend("vcpapp.vcprestrictions.controller.ItemMaster", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */
            onInit: function () {

                that = this;
                // that.getEnable();
                //To know if the mode is Save or Update
                that.saveObj = {};
                // Declaring JSON Model and size limit
                that.oModel = new JSONModel();
                that.locModel = new JSONModel();
                that.lineModel = new JSONModel();
                // this.oModel.setSizeLimit(1000);
                // this.locModel.setSizeLimit(1000);
                // this.lineModel.setSizeLimit(1000);

                this.bus = sap.ui.getCore().getEventBus();
                this.bus.subscribe("data", "refreshMaster", this.refreshMaster, this);
                this.bus.publish("nav", "toBeginPage", {
                    viewName: this.getView().getProperty("viewName"),
                });
                // Declaring Dialogs
                this._oCore = sap.ui.getCore();
                if (!this._valueHelpDialogCreateRest) {
                    this._valueHelpDialogCreateRest = sap.ui.xmlfragment(
                        "vcpapp.vcprestrictions.view.Restriction",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogCreateRest);
                }

                // Declaring Dialogs
                this._oCore = sap.ui.getCore();
                if (!this._valueHelpDialogLoc) {
                    this._valueHelpDialogLoc = sap.ui.xmlfragment(
                        "vcpapp.vcprestrictions.view.LocDialog",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogLoc);
                }

                // Declaring Dialogs
                if (!this._valueHelpDialogLine) {
                    this._valueHelpDialogLine = sap.ui.xmlfragment(
                        "vcpapp.vcprestrictions.view.LineDialog",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogLine);
                }
                if (!this._columnHide) {
                    this._columnHide = sap.ui.xmlfragment(
                        "vcpapp.vcprestrictions.view.column",
                        this
                    );
                    this.getView().addDependent(this._columnHide);
                }
                var obj = [
                    { columnName: "Location" },
                    { columnName: "Line" },
                    { columnName: "Resource" },
                ];
                var columnnJson = new JSONModel(obj);
                sap.ui.getCore().byId("idColumnTableRS").setModel(columnnJson);
            },

            /**
             * This function is to refreshing Master page data.
             */
            refreshMaster: function () {
                that.saveObj = {};
                this.onAfterRendering();
            },
            onBeforeRendering: function () {
                this.getModel("BModel").read("/getWeeks", {
                    success: function (oData) {
                        that.currentWeek = oData.results.find(c => new Date(c.WEEK_STARTDATE) <= new Date() && new Date(c.WEEK_ENDDATE) >= new Date());
                    },
                    error: function (error) {
                        console.error(error);
                    },
                });
                     this.getModel("BModel").read("/getRolesAccess", {
                    filters: [new Filter("USER", FilterOperator.EQ, this.getLoginuser())],
                    success: async function (oData) {
                        if (oData.results.length > 0) {
                            const Data = oData.results;
                            that.RoleMap = new Map();
                                Data.forEach(obj => {
                                    const key = obj.FACTORY_LOC;
                                if (!that.RoleMap.has(key)) {
                                    that.RoleMap.set(key, []);
                                }
                                that.RoleMap.get(key).push(obj);
                                })
                            oGModel.setProperty("/RoleMap", that.RoleMap);
                        }
                    },
                    error: function (oResponse) {
                        console.error(oResponse);
                    },
                });
            },

            /**
             * Called after the view has been rendered
             */
            onAfterRendering: function () {
                that = this;
                that.allData = [];
                that.skip = 0
                oGModel = this.getModel("oGModel");
                this.oLoc = this.byId("idlocRS");
                this.oLine = this.byId("idLineRS");

                this.oLocList = this._oCore.byId(
                    this._valueHelpDialogLoc.getId() + "-list"
                );
                this.oLineList = this._oCore.byId(
                    this._valueHelpDialogLine.getId() + "-list"
                );
                that._valueHelpDialogLine.setTitleAlignment("Center");
                that._valueHelpDialogLoc.setTitleAlignment("Center");

                sap.ui.core.BusyIndicator.show();
                that.restrictionsMainData = [];

                // added skip and top fun
                let oData = [];

                // this.getModel("BModel").read("/genRtrHeader", {
                //     success: function (oData) {
                //         sap.ui.core.BusyIndicator.hide();
                //         if(oData.results.length){
                //             //sort by Location, Line and RTR
                //              oData.results =  oData.results.sort(that.dynamicSortMultiple("LOCATION_ID", "LINE_ID", "RESTRICTION"));
                //             }
                //         that.oModel.setData({
                //             results: oData.results,
                //         });
                // that.restrictionsMainData = oData.results;
                // that.byId("resListRS").setModel(that.oModel);
                // if (oData.results.length) {
                //     var iselectedRecord = 0;
                //     if (Object.keys(that.saveObj).length > 0) {
                //         var iRec = oData.results.findIndex(f => f.LOCATION_ID == that.saveObj.LOCATION_ID && f.LINE_ID == that.saveObj.LINE_ID &&
                //             f.RESTRICTION == that.saveObj.RESTRICTION);
                //         iselectedRecord = (iRec == -1) ? 0 : iRec;
                //     }
                //     oGModel.setProperty("/Restriction", oData.results[iselectedRecord].RESTRICTION);
                //     oGModel.setProperty("/locId", oData.results[iselectedRecord].LOCATION_ID);
                //     oGModel.setProperty("/lineId", oData.results[iselectedRecord].LINE_ID);
                //     // Setting the default selected item for table
                //     that.byId("resListRS").setSelectedItem(that.byId("resListRS").getItems()[iselectedRecord], true);
                //     if (that.byId("resListRS").getItems()[iselectedRecord].getDomRef()) {
                //         if (iselectedRecord == 0) {
                //             that.byId("headSearchRS").getDomRef().scrollIntoView();
                //         }
                //         else if (iselectedRecord < oData.results.length) {
                //             that.byId("resListRS").getItems()[iselectedRecord - 1].getDomRef().scrollIntoView();
                //         }
                //         else if (iselectedRecord == oData.results.length) {
                //             that.byId("resListRS").getItems()[iselectedRecord].getDomRef().scrollIntoView();
                //         }
                //     }
                //     // Calling function to navigate to Item detail page
                //     that.onhandlePress();
                // }

                // },
                // error: function () {
                //     sap.ui.core.BusyIndicator.hide();
                //     MessageToast.show("Failed to get data");
                // },
                // })
                // Location data
                // adding skip top count for locations
                that.getAllLocs()
                // this.getModel("BModel").read("/getFactoryLocation", {
                //     success: function (oData) {
                //         if (oData.results.length > 0) {
                //             oData.results = that.removeDuplicate(oData.results, 'FACTORY_LOC');
                //             that.locModel.setData(oData);
                //             that.oLocList.setModel(that.locModel);
                //         }
                //         sap.ui.core.BusyIndicator.hide();
                //     },
                //     error: function (oData, error) {
                //         sap.ui.core.BusyIndicator.hide();
                //         MessageToast.show("error");
                //     },
                // });
            },

            /**
             * Called when it routes to a page containing the item details.
             */
            onhandlePress: function (oEvent) {
                oGModel = this.getModel("oGModel");



                if (oEvent) {
                    var sSelItem = oEvent.getSource().getSelectedItem().getBindingContext().getObject();
                    // Set the selected values to get the details
                    oGModel.setProperty("/Restriction", sSelItem.RESTRICTION);
                    oGModel.setProperty("/locId", sSelItem.LOCATION_ID);
                    oGModel.setProperty("/lineId", sSelItem.LINE_ID);
                    // oGModel.setProperty("/ProdID", sSelItem.PRODUCT_ID);
                    //This value is to refresh the data in Item detail page when we click on cancel update bubtton
                    oGModel.setProperty("/readClass", "X");
                }

                // var tempData = that.restData.filter(el=> el.LOCATION_ID === oGModel.getProperty("/locId") && 
                //                                          el.RESTRICTION === oGModel.getProperty("/Restriction") && 
                //                                          el.LINE_ID     === oGModel.getProperty("/lineId") );
                //      oGModel.setProperty("/RestrictionData", tempData);

                that.getOwnerComponent().runAsOwner(function () {
                    if (!that.oDetailView) {
                        try {
                            that.oDetailView = sap.ui.view({
                                viewName: "vcpapp.vcprestrictions.view.ItemDetail",
                                type: "XML",
                            });
                            that.bus.publish("flexible", "addDetailPage", that.oDetailView);
                            that.bus.publish("nav", "toDetailPage", {
                                viewName: that.oDetailView.getViewName(),
                            });
                        } catch (e) {
                            // that.oDetailView.onAfterRendering();
                        }
                    } else {
                        that.bus.publish("nav", "toDetailPage", {
                            viewName: that.oDetailView.getViewName(),
                        });
                    }
                });
            },
              updateRole(key) {
                  let bUpdate = false;
                if(that.RoleMap?.get(key)){
                if(that.RoleMap?.get(key).findIndex(f=>f.UPDATE == true) !=-1){
                    bUpdate = true;
                }
                }
                return bUpdate;
            },
              createRole(key) {
                let bCreate = false;
                if(that.RoleMap?.get(key)){
                if(that.RoleMap?.get(key).findIndex(f=>f.CREATE == true) !=-1){
                    bCreate = true;
                }
                }
                return bCreate;
        },

            deleteRole(key) {
                let bDelete = false;
            if(that.RoleMap?.get(key)){
            if(that.RoleMap?.get(key).findIndex(f=>f.DELETE == true) !=-1){
                bDelete = true;
            }
            }
        return bDelete;
            },

            // /**
            //  * Called when something is entered into the search field.
            //  * @param {object} oEvent -the event information.
            //  */

            // onSearch: function (oEvent) {
            //     var sQuery =
            //         oEvent.getParameter("value") || oEvent.getParameter("newValue"),
            //         oFilters = [];

            //     if (sQuery !== "") {
            //         oFilters.push(
            //             new Filter({
            //                 filters: [
            //                     new Filter("RESTRICTION", FilterOperator.Contains, sQuery),
            //                     new Filter("LOCATION_ID", FilterOperator.Contains, sQuery),
            //                     new Filter("LINE_ID", FilterOperator.Contains, sQuery),
            //                 ],
            //                 and: false,
            //             })
            //         );
            //     }
            //     that.byId("resListRS").getBinding("items").filter(oFilters);
            // },
            //This function is called on Date selections of Valid from and Valid To Dates
            commonFilter: function (flag) {
                var oFromDate = this.getView().byId("fromDateRS").getDateValue();
                var oToDate = this.getView().byId("toDateRS").getDateValue();
                var sSearchValue = this.getView().byId("headSearchRS").getValue();
                var oFilters = [];
                if (oFromDate && oToDate) { //If dates are not empty
                    oFromDate = new Date(new Date(oFromDate.setHours(5)).setMinutes(30)); //Converting into dates from oData table binding service
                    oToDate = new Date(new Date(oToDate.setHours(5)).setMinutes(30));
                    if (sSearchValue) { //If Both Dates and search field is selected
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("RESTRICTION", FilterOperator.Contains, sSearchValue),
                                    new Filter("LOCATION_ID", FilterOperator.Contains, sSearchValue),
                                    new Filter("LINE_ID", FilterOperator.Contains, sSearchValue)
                                ],
                                and: false,
                            }),
                            new Filter({
                                filters: [
                                    new Filter("VALID_FROM", FilterOperator.BT, oFromDate, oToDate),
                                    new Filter("VALID_TO", FilterOperator.BT, oFromDate, oToDate)
                                ],
                                and: true,
                            })
                        );
                    } else { //If only Dates are selected
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("VALID_FROM", FilterOperator.BT, oFromDate, oToDate),
                                    new Filter("VALID_TO", FilterOperator.BT, oFromDate, oToDate)
                                ],
                                and: true,
                            })
                        );
                    }
                    that.byId("resListRS").getBinding("items").filter(oFilters);
                    that.refreshDetail();
                } else if (sSearchValue) { //If only search field is used
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("RESTRICTION", FilterOperator.Contains, sSearchValue),
                                new Filter("LOCATION_ID", FilterOperator.Contains, sSearchValue),
                                new Filter("LINE_ID", FilterOperator.Contains, sSearchValue),
                            ],
                            and: false,
                        })
                    );
                    that.byId("resListRS").getBinding("items").filter(oFilters);
                    that.refreshDetail();
                } else { //Remove all Filters from Table
                    that.byId("resListRS").getBinding("items").filter(oFilters);
                    if (!oFromDate && !oToDate && !sSearchValue) {
                        that.refreshDetail();
                    }
                    else if (flag == true) {
                        that.refreshDetail();
                    }
                }
            },
            //Function to default select first item when search or date range selection
            refreshDetail: function () {
                let aTable = that.byId("resListRS").getItems();
                var oGModel = this.getModel("oGModel");
                if (Array.from(aTable).length > 0) {
                    let obj = aTable[0].getBindingContext().getObject();
                    oGModel.setProperty("/Restriction", obj.RESTRICTION);
                    oGModel.setProperty("/locId", obj.LOCATION_ID);
                    oGModel.setProperty("/lineId", obj.LINE_ID);
                    that.byId("resListRS").setSelectedItem(aTable[0], true);
                    that.onhandlePress();
                }
                else {
                    oGModel.setProperty("/Restriction", '');
                    oGModel.setProperty("/locId", '');
                    oGModel.setProperty("/lineId", '');
                    that.byId("resListRS").setSelectedItem(aTable[0], true);
                    that.onhandlePress();
                }
            },
            /**
             * This function is called when click on Value Help of Inputs.
             * In this function dialogs will open based on sId.
             * @param {object} oEvent -the event information.
             */
            handleValueHelp: function (oEvent) {
                var sId = oEvent.getParameter("id");
                // Location Dialog
                if (sId.includes("loc")) {
                    that._valueHelpDialogLoc.open();
                    // Line Dialog
                } else if (sId.includes("Line")) {
                    if (sap.ui.getCore().byId("idlocRS").getValue()) {
                        that._valueHelpDialogLine.open();
                    } else {
                        MessageToast.show("Select Location");
                    }
                }
            },
            /**
             * Called when 'Close/Cancel' button in any dialog is pressed.
             */
            handleClose: function (oEvent) {
                var sId = oEvent.getParameter("id");
                // Location Dialog
                if (sId.includes("Loc")) {
                    that._oCore
                        .byId(this._valueHelpDialogLoc.getId() + "-searchField")
                        .setValue("");
                    if (that.oLocList.getBinding("items")) {
                        that.oLocList.getBinding("items").filter([]);
                    }
                    // Line Dialog
                } else if (sId.includes("Line")) {
                    that._oCore
                        .byId(this._valueHelpDialogLine.getId() + "-searchField")
                        .setValue("");
                    if (that.oLineList.getBinding("items")) {
                        that.oLineList.getBinding("items").filter([]);
                    }
                }
            },

            /**
             * Called when something is entered into the search field.
             * @param {object} oEvent -the event information.
             */
            handleSearch: function (oEvent) {
                var sQuery =
                    oEvent.getParameter("value") || oEvent.getParameter("newValue"),
                    sId = oEvent.getParameter("id"),
                    oFilters = [];
                // Check if search filter is to be applied
                sQuery = sQuery ? sQuery.trim() : "";
                // Location
                if (sId.includes("Loc")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("FACTORY_LOC", FilterOperator.Contains, sQuery),
                                    new Filter("LOCATION_DESC", FilterOperator.Contains, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.oLocList.getBinding("items").filter(oFilters);
                    // Line ID
                } else if (sId.includes("Line")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("LINE_ID", FilterOperator.Contains, sQuery),
                                    new Filter("LINE_DESC", FilterOperator.Contains, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.oLineList.getBinding("items").filter(oFilters);
                    // Version
                }
            },


            /**
             * This function is called when selecting an item in dialogs .
             * @param {object} oEvent -the event information.
             */
            handleSelection: function (oEvent) {
                that.oGModel = that.getModel("oGModel");
                var sId = oEvent.getParameter("id"),
                    oItem = oEvent.getParameter("selectedItems"),
                    aSelectedItems,
                    aODdata = [];
                //Location list
                if (sId.includes("Loc")) {
                    that.oLoc = sap.ui.getCore().byId("idlocRS");
                    that.oLine = sap.ui.getCore().byId("idLineRS");
                    aSelectedItems = oEvent.getParameter("selectedItems");
                    that.oLoc.setValue(aSelectedItems[0].getTitle());
                    // Removing the input box values when Location changed
                    that.oLine.setValue("");
                    sap.ui.getCore().byId("btnSaveRest").setVisible(that.createRole(that.oLoc.getValue()))

                    // Calling service to get the Line ID data
                    this.getModel("BModel").read("/getLine", {
                        filters: [
                            new Filter(
                                "LOCATION_ID",
                                FilterOperator.EQ,
                                aSelectedItems[0].getTitle()
                            ),
                        ],
                        success: function (oData) {
                            that.lineModel.setData(oData);
                            that.oLineList.setModel(that.lineModel);
                        },
                        error: function (oData, error) {
                            MessageToast.show("error");
                        },
                    });

                    // Line list
                } else if (sId.includes("Line")) {
                    that.oLine = sap.ui.getCore().byId("idLineRS");
                    aSelectedItems = oEvent.getParameter("selectedItems");
                    that.oLine.setValue(aSelectedItems[0].getTitle());


                }
            },
            onCreateRest: function (oEvent) {
                oGModel.setProperty("/RestFlag", "");
                that._valueHelpDialogCreateRest.open();
                if (oEvent.getSource().getIcon().includes("add")) {
                    sap.ui.getCore().byId("btnSaveRest").setVisible(false);
                    sap.ui.getCore().byId("idRestrictionRS").setTitle("Create Resource");
                    oGModel.setProperty("/RestFlag", "C");
                    sap.ui.getCore().byId("idlocRS").setValue();
                    sap.ui.getCore().byId("idLineRS").setValue();
                    sap.ui.getCore().byId("idRestRS").setValue();
                    sap.ui.getCore().byId("idRestDescRS").setValue();
                    // sap.ui.getCore().byId("idRestQty").setValue();
                    sap.ui.getCore().byId("idDateRangeRS").setValue();

                    sap.ui.getCore().byId("idlocRS").setEditable(true);
                    sap.ui.getCore().byId("idLineRS").setEditable(true);
                    sap.ui.getCore().byId("idRestRS").setEditable(true);

                    sap.ui.getCore().byId("idlocRS").setShowValueHelp(true);
                    sap.ui.getCore().byId("idLineRS").setShowValueHelp(true);
                    //Setting minimum Dates to Valid From/To DateRange
                    sap.ui.getCore().byId("idDateRangeRS").setMinDate(new Date(that.currentWeek?.WEEK_STARTDATE));
                } else {
                    sap.ui.getCore().byId("btnSaveRest").setVisible(true);
                    sap.ui.getCore().byId("idRestrictionRS").setTitle("Update Resource");
                    oGModel.setProperty("/RestFlag", "E");
                    var selItem = oEvent.getSource().getParent().getBindingContext().getObject();
                    sap.ui.getCore().byId("idlocRS").setValue(selItem.LOCATION_ID);
                    sap.ui.getCore().byId("idLineRS").setValue(selItem.LINE_ID);
                    sap.ui.getCore().byId("idRestRS").setValue(selItem.RESTRICTION);
                    sap.ui.getCore().byId("idRestDescRS").setValue(selItem.RTR_DESC);
                    // sap.ui.getCore().byId("idRestQty").setValue((selItem.RTR_QTY == 0 || selItem.RTR_QTY == null) ? '' : selItem.RTR_QTY);
                    var disM = selItem.VALID_FROM;
                    var disS = selItem.VALID_TO;
                    // var dateL = sap.ui.core.format.DateFormat.getDateInstance({
                    //     pattern: "MM-dd-YYYY"
                    // }).format(disM);
                    // var dateH = sap.ui.core.format.DateFormat.getDateInstance({
                    //     pattern: "MM-dd-YYYY"
                    // }).format(disS);
                    var dateRange = (disM + " " + "To" + " " + disS);
                    sap.ui.getCore().byId("idDateRangeRS").setValue(dateRange);

                    sap.ui.getCore().byId("idlocRS").setEditable(false);
                    sap.ui.getCore().byId("idLineRS").setEditable(false);
                    sap.ui.getCore().byId("idRestRS").setEditable(false);

                    sap.ui.getCore().byId("idlocRS").setShowValueHelp(false);
                    sap.ui.getCore().byId("idLineRS").setShowValueHelp(false);
                    if (new Date(selItem.VALID_FROM).getTime() >= new Date().getTime()) {
                        //Setting minimum Dates to Valid From/To DateRange
                        sap.ui.getCore().byId("idDateRangeRS").setMinDate(new Date(that.currentWeek?.WEEK_STARTDATE));
                    }
                    else {
                        sap.ui.getCore().byId("idDateRangeRS").setMinDate(new Date(selItem.VALID_FROM));
                    }
                }
            },


            onCloseRest: function () {
                that._valueHelpDialogCreateRest.close();
            },

            onSaveRest: function (oEvent) {
                this._oCore = sap.ui.getCore();
                var oLoc = this._oCore.byId("idlocRS").getValue(),
                    oLine = this._oCore.byId("idLineRS").getValue(),
                    oRest = this._oCore.byId("idRestRS").getValue(),
                    oRestDesc = this._oCore.byId("idRestDescRS").getValue(),
                    oRestQty = 1,
                    oFlag = oGModel.getProperty("/RestFlag"),
                    oDateFrom = that.getDateFn(this._oCore.byId("idDateRangeRS").getDateValue()),
                    oDateTo = that.getDateFn(this._oCore.byId("idDateRangeRS").getSecondDateValue());

                if (!oRest) {
                    return MessageToast.show("Please enter Restriction!");
                }
                // var oDateRange = this._oCore.byId("idDateRangeRS");
                // if (oDateRange) {
                //     var dateValue = oDateRange._getInputValue();
                //     dateValue = dateValue.split(" To ");
                //     var oDateFrom = dateValue[0];
                //     var oDateTo = dateValue[1];
                //     // oDateFrom = oDateL.slice(0,2) + "-" + oDateL.slice(3,5) + "-" + oDateL.slice(6,10);
                //     // oDateTo = oDateH.slice(0,2) + "-" + oDateH.slice(3,5) + "-" + oDateH.slice(6,10);
                // }
                //check if restriction exists in table
                var title = sap.ui.getCore().byId("idRestrictionRS").getTitle();
                if (that.restrictionsMainData.length > 0 && title.includes("Create")) {
                    let iRec = that.restrictionsMainData.findIndex(el => el.LOCATION_ID == oLoc && el.LINE_ID == oLine && el.RESTRICTION.toString().toLowerCase() == oRest.toString().toLowerCase());
                    if (iRec != -1) {
                        return MessageToast.show("Creation Failed,Restriction already exists!");
                    }
                }
                that.saveObj = {};
                if (oFlag !== "") {
                    var User = "";
                    if (sap.ushell.Container) {
                        let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                        User = (email) ? email : "";
                    }
                    sap.ui.core.BusyIndicator.show();
                    that.getModel("BModel").callFunction("/maintainRestrHdr", {
                        method: "GET",
                        urlParameters: {
                            LOCATION_ID: oLoc,
                            LINE_ID: oLine,
                            RESTRICTION: oRest,
                            RTR_DESC: oRestDesc,
                            RTR_QTY: (oRestQty) ? oRestQty : 0,
                            VALID_FROM: oDateFrom,
                            VALID_TO: oDateTo,
                            Flag: oFlag,
                            User: User
                        },
                        success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            if (oFlag === "C") {
                                MessageToast.show("Restriction created successfully");
                            } else {
                                MessageToast.show("Successfully updated the restriction");
                            }
                            that.saveObj = {
                                LOCATION_ID: oLoc,
                                LINE_ID: oLine,
                                RESTRICTION: oRest,
                            };
                            that.onCloseRest();
                            that.onAfterRendering();

                        },
                        error: function (oData) {
                            MessageToast.show("Failed to create /updaate the Restrictions");
                            sap.ui.core.BusyIndicator.hide();
                        },
                    });
                }
            },

            onDeleteRest: function (oEvent) {

                var selItem = oEvent.getSource().getParent().getBindingContext().getObject();
                var oLoc = selItem.LOCATION_ID,
                    oLine = selItem.LINE_ID,
                    oRest = selItem.RESTRICTION,
                    oQty = selItem.RTR_QTY;
                MessageBox.confirm(
                    `Delete Restriction ${oRest}?`, {
                    icon: MessageBox.Icon.Conf,
                    title: "Confirmation",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (oAction) {
                        sap.ui.core.BusyIndicator.show();
                        if (oAction === "YES") {
                            that.getModel("BModel").callFunction("/maintainRestrHdr", {
                                method: "GET",
                                urlParameters: {
                                    LOCATION_ID: oLoc,
                                    LINE_ID: oLine,
                                    RESTRICTION: oRest,
                                    RTR_DESC: "",
                                    RTR_QTY: parseInt(1),
                                    VALID_FROM: "08/08/2022",
                                    VALID_TO: "08/08/2022",
                                    Flag: "D",
                                    User: ""
                                },
                                success: function (oData) {

                                    sap.ui.core.BusyIndicator.hide();
                                    MessageToast.show(oData.maintainRestrHdr);
                                    that.saveObj = {};
                                    if (oData.maintainRestrHdr.toString().includes('Likelihood') == false) {
                                        that.onAfterRendering();
                                        that.getView().byId("headSearchRS").setValue("");
                                        that.resetDates();
                                    }
                                },
                                error: function (oData) {
                                    MessageToast.show("Failed to delete the restriction");
                                    sap.ui.core.BusyIndicator.hide();
                                },
                            });
                        } else {
                            // Close Message Box
                        }
                    }
                }
                );
            },

            /**
             * This function is called to convert the input dates to Date String.
             * @param {object} imDate - Contains Date
             */
            getDateFn: function (imDate) {
                var vMonth, vDate;
                var vMnthFrm = imDate.getMonth() + 1;

                if (vMnthFrm < 10) {
                    vMonth = "0" + vMnthFrm;
                } else {
                    vMonth = vMnthFrm;
                }

                if (imDate.getDate() < 10) {
                    vDate = "0" + imDate.getDate();
                } else {
                    vDate = imDate.getDate();
                }
                return (imDate = imDate.getFullYear() + "-" + vMonth + "-" + vDate);
            },
            removeDuplicate: function (array, key) { //Function to remove duplicates in an array
                var check = new Set();
                return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
            },
            NumbersOnly: function (oEvent) {
                var value = oEvent.getSource().getValue();
                if (value) {
                    var value = value.replace(/[A-Za-z@!#$%*+/^&()_\-{}|.:~`";'<>?,=" "[\]_]/g, "");
                    oEvent.getSource().setValue(value);
                }
            },
            RestChange: function (oEvent) {
                var value = oEvent.getSource().getValue();
                if (value) {
                    var value = value.replace(/[@!#$%*+/^&()\{}|.:~`";'<>?,=" "[\]]/g, "");
                    oEvent.getSource().setValue(value);
                }
            },
            //This Function is called for resetting dates
            resetDates: function () {
                this.getView().byId("fromDateRS").setValue("");
                this.getView().byId("toDateRS").setValue("");
                that.commonFilter(true);
            },
            dynamicSortMultiple: function () {
                /*
                 * save the arguments object as it will be overwritten
                 * note that arguments object is an array-like object
                 * consisting of the names of the properties to sort by
                 */
                let props = arguments;
                const that = this;
                return function (obj1, obj2) {
                    var i = 0,
                        result = 0,
                        numberOfProperties = props.length;
                    /* try getting a different result from 0 (equal)
                     * as long as we have extra properties to compare
                     */
                    while (result === 0 && i < numberOfProperties) {
                        result = that.dynamicSort(props[i])(obj1, obj2);
                        i++;
                    }
                    return result;
                };
            },
            dynamicSort: function (property) {
                var sortOrder = 1;
                if (property[0] === "-") {
                    sortOrder = -1;
                    property = property.substr(1);
                }
                return function (a, b) {
                    /* next line works with strings and numbers,
                     * and you may want to customize it to your needs
                     */
                    var result =
                        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
                    return result * sortOrder;
                };
            },
            // getEnable: function () {
            //     var oModel = this.getOwnerComponent().getModel("BModel");
            //     var vUser = this.getLoginuser();
            //     var oEntry = {
            //         USERDATA: []
            //     };
            //     let oParamVals = {
            //         USEREMAIL: vUser
            //     };
            //     oEntry.USERDATA.push(oParamVals);
            //     oModel.callFunction("/genUserAppVisibility", {
            //         method: "GET",
            //         urlParameters: {
            //             FLAG: 'G',
            //             USERDATA: JSON.stringify(oEntry.USERDATA)
            //         },
            //         success: function (oData) {
            //             aDetails = oData.results;
            //             oGModel = that.getModel("oGModel");
            //             oGModel.setProperty("/userVisibility", aDetails);
            //             if (aDetails.length > 0) {
            //                 var isUserLoggedIn = true;
            //             }
            //             if (isUserLoggedIn) {
            //                 if (aDetails[0].DELETE_CHK === "disabled") {
            //                     that.byId("iddeleteRS").setEnabled(false);
            //                 }
            //                 if (aDetails[0].UPDATE_CHK === "disabled") {
            //                     that.byId("ideditRS").setEnabled(false)
            //                 }
            //                 if (aDetails[0].CREATE_CHK == "disabled") {
            //                     that.byId("idcreateRS").setEnabled(false);
            //                 }
            //             }
            //             else {
            //                 that.byId("iddeleteRS").setEnabled(false);
            //                 that.byId("ideditRS").setEnabled(false)
            //                 that.byId("idcreateRS").setEnabled(false);
            //             }
            //         },
            //         error: function () {
            //             MessageToast.show("Failed to get data");
            //         },
            //     });

            // },
            getAllRtrHeader: function () {
                var topCount = 30000
                // this.getModel("BModel").read("/genRtrHeader", {
                this.getModel("BModel").callFunction("/genRtrHeaderData", {
                    // urlParameters: {
                    //     "$skip": that.skip,
                    //     "$top": topCount
                    // },
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        // if (topCount == oData.results.length) {
                        //     that.skip += topCount;
                        //     that.allData = that.allData.concat(oData.results);
                        //     that.getAllRtrHeader();
                        // } else {
                        //     that.skip = 0;
                        //     that.allData = that.allData.concat(oData.results);
                        //     oData.results = that.allData
                        oData.results = JSON.parse(oData.genRtrHeaderData);
                        // that.allData = []
                        // if (oData.results.length) {

                        // that.restData = oData.results;
                        // let newData = oData.results.filter((value, index, self) => {
                        //     // Create a unique key based on the three properties
                        //     // const key = value.LOCATION_ID + '|' + value.LINE_ID + '|' + value.RESTRICTION;
                        //     const key = `${value.LOCATION_ID}-${value.LINE_ID}-${value.RESTRICTION}`;

                        //     // Check if this combination has been seen before
                        //     // return index === self.findIndex((item) =>
                        //     //     (item.LOCATION_ID + '|' + item.LINE_ID + '|' + item.RESTRICTION) === key
                        //     // );
                        //     return index === self.findIndex((item) =>
                        //         `${value.LOCATION_ID}-${value.LINE_ID}-${value.RESTRICTION}` === key
                        //     );
                        // });

                        // const distinctData = oData.results.filter((value, index, self) => {
                        //     // Create a unique identifier using the three fields
                        //     const identifier = `${value.LOCATION_ID}-${value.LINE_ID}-${value.RESTRICTION}`;

                        //     // Check if the identifier already exists in the processed array
                        //     return index === self.findIndex((v) => `${v.LOCATION_ID}-${v.LINE_ID}-${v.RESTRICTION}` === identifier);
                        //   });

                        //   console.log(distinctData);

                        // oData.results = newData;


                        // that.rtrData = oData.results
                        // oData.results= oData.results.map(({ PRODUCT_ID, ...rest }) => rest);

                        // var keys = ["LOCATION_ID", "LINE_ID", "RESTRICTION"];
                        // oData.results = that.removeDuplicatemultiple(oData.results, keys);

                        //sort by Location, Line and RTR
                        // oData.results = oData.results.sort(that.dynamicSortMultiple("LOCATION_ID", "LINE_ID", "RESTRICTION"));

                        if(oData.results.length>0){
                            const aRolesLocProd = new Set(
                            that.allData.map(item => item.FACTORY_LOC)
                    );
                     oData.results =  oData.results.filter(item =>
                        aRolesLocProd.has(item.LOCATION_ID) 
                        );
                        }
                        oData.results.forEach((item) => {
                            item.locSelKey = "ID";
                            item.lineSelKey = "ID";
                            item.resSelKey = "ID";
                        });
                        // }
                        that.oModel = new JSONModel();
                        that.oModel.setSizeLimit(oData.results.length);
                        that.oModel.setData({
                            results: oData.results,
                        });
                        that.restrictionsMainData = oData.results;
                        that.byId("resListRS").setModel(that.oModel);
                        if (oData.results.length) {
                            var iselectedRecord = 0;
                            if (Object.keys(that.saveObj).length > 0) {
                                var iRec = oData.results.findIndex(f => f.LOCATION_ID == that.saveObj.LOCATION_ID && f.LINE_ID == that.saveObj.LINE_ID &&
                                    f.RESTRICTION == that.saveObj.RESTRICTION);
                                iselectedRecord = (iRec == -1) ? 0 : iRec;
                            }
                            oGModel.setProperty("/Restriction", oData.results[iselectedRecord].RESTRICTION);
                            oGModel.setProperty("/locId", oData.results[iselectedRecord].LOCATION_ID);
                            oGModel.setProperty("/lineId", oData.results[iselectedRecord].LINE_ID);
                            oGModel.setProperty("/ProdID", oData.results[iselectedRecord].PRODUCT_ID);
                            // Setting the default selected item for table
                            that.byId("resListRS").setSelectedItem(that.byId("resListRS").getItems()[iselectedRecord], true);
                            if (that.byId("resListRS").getItems()[iselectedRecord].getDomRef()) {
                                if (iselectedRecord == 0) {
                                    that.byId("headSearchRS").getDomRef().scrollIntoView();
                                }
                                else if (iselectedRecord < oData.results.length) {
                                    that.byId("resListRS").getItems()[iselectedRecord - 1].getDomRef().scrollIntoView();
                                }
                                else if (iselectedRecord == oData.results.length) {
                                    that.byId("resListRS").getItems()[iselectedRecord].getDomRef().scrollIntoView();
                                }
                            }
                            // Calling function to navigate to Item detail page
                            that.onhandlePress();
                        }
                        // }


                    }
                })
            },

            removeDuplicatemultiple: function (array, keys) {
                const filtered = array.filter(
                    (s => o =>
                        (k => !s.has(k) && s.add(k))
                            (keys.map(k => o[k]).join('|'))
                    )
                        (new Set)
                );
                return filtered;
            },
            getAllLocs: function () {
                var topCount = 30000
                // this.getModel("BModel").read("/getfactorylocdesc", {
                // Authentications added to getRolesLocProd service 
                that.getOwnerComponent().getModel("BModel").read("/getRolesLocProd", {
                    filters: [new Filter(
                        "USER",
                        FilterOperator.EQ,
                        this.getLoginuser()
                    )],
                    urlParameters: {
                        "$skip": that.skip,
                        "$top": topCount
                    },
                    success: function (oData) {
                        if (topCount == oData.results.length) {
                            that.skip += topCount;
                            that.allData = that.allData.concat(oData.results);
                            that.getAllLocs();
                        } else {
                            that.skip = 0;
                            that.allData = that.allData.concat(oData.results);
                            if (oData.results.length > 0) {
                                oData.results = that.removeDuplicate(oData.results, 'FACTORY_LOC');
                                that.locModel.setData(oData);
                                that.oLocList.setModel(that.locModel);
                            }
                            that.getAllRtrHeader();
                            sap.ui.core.BusyIndicator.hide();
                        }
                    },
                    error: function (oData, error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("error");
                    },
                });
            },
            onPressColumnView: function () {
                that._columnHide.open();
            },
            onPressSaveColumnHide: function () {
                var table = sap.ui.getCore().byId("idColumnTableRS").getItems(),
                    locSelKey = table[0].getCells()[1].getSelectedKey(),
                    lineSelKey = table[1].getCells()[1].getSelectedKey(),
                    resSelKey = table[2].getCells()[1].getSelectedKey();
                var resList = that.byId("resListRS").getModel().getData().results;
                for (var i = 0; i < resList.length; i++) {
                    resList[i].locSelKey = locSelKey;
                    resList[i].lineSelKey = lineSelKey;
                    resList[i].resSelKey = resSelKey;
                };
                that.byId("resListRS").getModel().refresh();
                that.onPressCancleColunHide();
            },
            onPressCancleColunHide: function () {
                that._columnHide.close();
            }

        });
    }
);