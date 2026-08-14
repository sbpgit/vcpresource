sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/export/Spreadsheet',
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, Filter, FilterOperator, Spreadsheet, MessageBox, JSONModel, formatter) {
        "use strict";
        var that, idList = [];
        var aResults;




        return Controller.extend("vcpapp.vcpcprestrictionsavail.controller.Restrictions", {
            formatter: formatter,
            //Initilze
            onInit: function () {
                that = this;
                that.initialRowCount = 8;
                that.rowData = [];
                this.prodModel = new JSONModel();
                // that.prodModel.setSizeLimit(1000);
                that.viewDetails = new JSONModel({
                    items12: []
                });
                that.viewDetails.setSizeLimit(5000);
                that.byId("idMatList123RC").setModel(that.viewDetails);
                // that.variantModel = new JSONModel();
                // that.variantModel.setSizeLimit(5000);
                that.oEmptyModel = new JSONModel();
                that.skip = 0;
                that.prod = [];
                 that.oLid =[];

                that.getOwnerComponent().getModel("BModel").read("/getUserPreferences", {
                    filters: [
                        new Filter("PARAMETER", FilterOperator.EQ, "MAX_RECORDS")
                    ],
                    success: function (oData) {
                        that.getOwnerComponent().getModel("oGModel").setProperty("/MaxCount", oData.results[0].PARAMETER_VALUE);
                        that.getCalenderWeek();
                        that.getData();
                    },
                    error: function (oData, error) {
                        console.log(error)
                    },
                });
                that.getUser();


                // Declaring Location Dialog
                if (!this.oLocDialogFragment) {
                    this.oLocDialogFragment = sap.ui.xmlfragment(
                        "vcpapp.vcpcprestrictionsavail.view.LocDialog",
                        this
                    );
                    this.getView().addDependent(this.oLocDialogFragment);
                }
                // Declaring line Dialog
                if (!this.oLineDialogFragment) {
                    this.oLineDialogFragment = sap.ui.xmlfragment(
                        "vcpapp.vcpcprestrictionsavail.view.lineDialog",
                        this
                    );
                    this.getView().addDependent(this.oLineDialogFragment);
                }
                // if (!this._nameFragment) {
                //     this._nameFragment = sap.ui.xmlfragment(
                //         "vcpapp.vcpcprestrictionsavail.view.NameVariant",
                //         this
                //     );
                //     this.getView().addDependent(this._nameFragment);
                // }
                // if (!this._popOver) {
                //     this._popOver = sap.ui.xmlfragment(
                //         "vcpapp.vcpcprestrictionsavail.view.PopOver",
                //         this
                //     );
                //     this.getView().addDependent(this._popOver);
                // }

            },

            onBeforeRendering: function () {
                that.getOwnerComponent().getModel("BModel").read("/getWeeks", {
                    success: function (oData) {
                        that.calWeekData = oData.results;
                        var sDate = new Date().toLocaleDateString('en-CA');
                        var foundobj = that.calWeekData.find(f => f.WEEK_STARTDATE.toISOString().split('T')[0] <= sDate && f.WEEK_ENDDATE.toISOString().split('T')[0] >= sDate);
                        that.vFromDate = new Date(foundobj.WEEK_STARTDATE).toLocaleDateString('en-CA');
                        that.byId("fromDateRC").setValue(that.vFromDate);
                    },
                    error: function (error) {
                        console.error(error);
                    },
                });
            },

            // onRendering
            onAfterRendering: function () {
                that = this;
                that.deletedArray = [];
                //Setting values for from and To Dates
                var dDate = new Date();
                var oDateL = that.getDateFn(dDate);
                if (!this._manageVariant) {
                    this._manageVariant = sap.ui.xmlfragment(
                        "vcpapp.vcpcprestrictionsavail.view.VariantNames",
                        this
                    );
                    this.getView().addDependent(this._manageVariant);
                }
                //Future 90 days selected date
                var oDateH = new Date(
                    dDate.getFullYear(),
                    dDate.getMonth(),
                    dDate.getDate() + 90
                );
                var oDateH = that.getDateFn(oDateH);

                that.byId("fromDateRC").setValue(that.vFromDate);
                that.byId("toDateRC").setValue(oDateH);
                that.oGModel = that.getOwnerComponent().getModel("oGModel"); //storing oGModel globally
                that.oi18n = this.getView().getModel("i18n").getResourceBundle(); //storing i18n as Global Variable

                that.oLoc = that.byId("idlocRC");
                that.oLine = that.byId("idLineRC");

                // that.getCalenderWeek();
                // Calling Variant function
                that.getVariantData();

            },

            getUser: function () {
                let vUser;
                if (!sap.ushell) {
                    vUser = "";
                }
                else if (sap.ushell.Container) {
                    let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                    vUser = (email) ? email : "";
                }
                 if(!vUser){
                vUser='null';
            }
                return vUser;
            },

            //added skip and top func
            getData: function () { // Calling service to get the Location data
                // that.aLocDataAll = [];
                var topCount = that.getOwnerComponent().getModel("oGModel").getProperty("/MaxCount")
                sap.ui.core.BusyIndicator.show();
                var oModel = that.getOwnerComponent().getModel("BModel");
                 that.allData =[];
                // oModel.read("/getfactorylocdesc", {
                oModel.read("/getRolesLocProd", {
                       filters: [new Filter(
                        "USER",
                        FilterOperator.EQ,
                       this.getUser()
                    )],
                    urlParameters: {
                        "$skip": that.skip,
                        "$top": topCount
                    },
                    success: function (oData) {
                        if (topCount == oData.results.length) {
                            that.skip += parseInt(topCount);
                            that.prod = that.prod.concat(oData.results);
                            that.getData();
                        }
                        else {
                            that.skip = 0
                            that.prod = that.prod.concat(oData.results);
                            that.allData =that.prod;
                            oData.results = that.removeDuplicate(that.prod, 'FACTORY_LOC');
                            that.LocData = oData.results;
                            that.prod = []
                            sap.ui.core.BusyIndicator.hide();
                        }

                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("error");
                    },
                });
            },


            //replaced with another function with same name
            // getCalenderWeek: function () { //Calling service to get CalenderWeek
            //     sap.ui.core.BusyIndicator.show();
            //     that.oGModel = that.getOwnerComponent().getModel("oGModel");
            //     that.getOwnerComponent().getModel("BModel").read("/getIBPCalenderWeek", {
            //         success: function (oData) {
            //             that.oGModel.setProperty("/CalenderWeek", oData.results);
            //             sap.ui.core.BusyIndicator.hide();
            //         },
            //         error: function (_oData, _error) {
            //             sap.m.MessageToast.show("error");
            //             sap.ui.core.BusyIndicator.hide();
            //         },
            //     });
            // },
            /**
             * This function is called when a click on GO button to get the data based of filters.
             */
            onGetData: function () {
                that.onGo()
                that.getRolesAccess();
            },

            onGo: function () {
                that.onGoAll = [];
                that.oGModel.setProperty("/resetFalg", "");
                sap.ui.core.BusyIndicator.show();
                that.toggleFooter(false);
                that.idList = [], that.rowData = [];
                that.byId("headSearchRC").setValue("");
                var Loc = that.byId("idlocRC").getValue();
                var vFromDate = this.byId("fromDateRC").getDateValue();
                var vToDate = this.byId("toDateRC").getDateValue();
                var sLine = this.byId("idLineRC").getValue();
                if (
                    Loc &&
                    sLine &&
                    vFromDate &&
                    vToDate
                ) {
                    vFromDate = that.getDateFn(vFromDate);
                    vToDate = that.getDateFn(vToDate);
                    var topCount = that.getOwnerComponent().getModel("oGModel").getProperty("/MaxCount")
                    sap.ui.core.BusyIndicator.show();
                    // calling service based on filters
                    var oModel = that.getOwnerComponent().getModel("BModel");
                    oModel.callFunction("/getRestrictionAvailability", {
                        method: "GET",
                        urlParameters: {
                            LOCATION_ID: Loc,
                            LINE_ID: sLine,
                            FROMDATE: vFromDate,
                            TODATE: vToDate,
                            "$skip": that.skip,
                            "$top": topCount
                        },
                        success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            if (topCount == oData.results.length) {
                                that.skip += parseInt(topCount);
                                that.onGoAll = that.onGoAll.concat(oData.results);
                                that.onGo();
                            }
                            else {
                                that.skip = 0
                                that.onGoAll = that.onGoAll.concat(oData.results)
                                oData.results = that.removeDuplicate(oData.results, "RESTRICTION");
                                that.rowData = oData.results;
                                if (oData.results.length > 0) {
                                    var rowData = that.removeDuplicate(oData.results, "RESTRICTION");
                                    that.rowData = rowData;
                                    if (rowData.length > 0) {
                                        // // Calling function to generate UI table dynamically based on data
                                        that.TableGenerate(rowData);
                                        that.toggleFooter(true); //showing footer section that consists of Save button
                                        that.oGModel.setProperty("/TData", rowData);
                                    }
                                } else {
                                    that.TableGenerate([]);
                                    that.toggleFooter(false);
                                    that.oGModel.setProperty("/TData", []);
                                }
                                // that.saveDefaultVariant();
                                // that.TableGenerate(oData.results);
                                // that.toggleFooter(true); //showing footer section that consists of Save button
                                // that.oGModel.setProperty("/TData", oData.results);
                                // that.prod = []
                                sap.ui.core.BusyIndicator.hide();

                            }

                        },
                        error: function () {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show(that.oi18n.getText("searchError"));
                        },
                    });
                } else {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show(that.oi18n.getText("selectFields"));
                }
            },
            getRolesAccess :function(){
                that.byId("SaveRC").setVisible(false);
                that.byId("FileUploaderIdRC").setVisible(false);
                  that.getOwnerComponent().getModel("BModel").read("/getRolesAccess", {
                    filters: [new Filter("USER", FilterOperator.EQ, that.getUser()),
                            new Filter("FACTORY_LOC", FilterOperator.EQ, that.byId("idlocRC").getValue())
                    ],
                    success: async function (oData) {
                        if (oData.results.length > 0) {
                            if(oData.results.findIndex(f=>f.UPDATE == true)!=-1){
                                that.byId("SaveRC").setVisible(true);
                                that.byId("FileUploaderIdRC").setVisible(true);
                            }
                        }
                    },
                    error: function (oResponse) {
                        console.log(oResponse);
                    },
                });
            },
            /**
             * This function is called when F4 press or value help icon click of location .
             */
            locationValueHelp: function () {
                that.oLocDialogFragment.open();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    Locitems: that.LocData
                })
                sap.ui.getCore().byId("LocSlctListRC").setModel(oModel); //Binding to select in LocDialog Fragment
            },
            /**
             * This function is called when F4 press or value help icon click of Line .
             */
            lineValueHelp: function () {
                that.oLineId();
            },
            oLineId: function () {
                var sLocation = that.byId("idlocRC").getValue();
                if (!sLocation) {
                    return sap.m.MessageToast.show(that.oi18n.getText("invalidLoc"))
                }
                var topCount = that.getOwnerComponent().getModel("oGModel").getProperty("/MaxCount")
                var oModel = that.getOwnerComponent().getModel("BModel");
                oModel.read("/getLineCap", {
                    filters: [
                        new Filter(
                            "LOCATION_ID",
                            FilterOperator.EQ,
                            sLocation
                        ),
                    ],
                    urlParameters: {
                        "$skip": that.skip,
                        "$top": topCount
                    },
                    success: function (oData) {
                        if (topCount == oData.results.length) {
                            that.skip += parseInt(topCount);
                            that.oLid = that.oLid.concat(oData.results);
                            that.oLineId();
                        }
                        else {
                            that.skip = 0;
                            that.oLid =[];
                            that.oLid = that.oLid.concat(oData.results);

                            //Show only lines assigned to product
                            if(that.oLid.length>0){
                                const rolesSet = new Set(
                             that.allData.map(item => `${item.FACTORY_LOC}|${item.REF_PRODID}`)
                                );
                                that.oLid = that.oLid.filter(el=>{
                                   return  rolesSet.has(`${el.LOCATION_ID}|${el.PRODID}`)
                                })
                            }
                            
                            //  that.oLid = []
                            var oModel = new sap.ui.model.json.JSONModel();
                            oModel.setData({
                                lineItems: that.oLid
                            })
                            sap.ui.getCore().byId("LineSlctListRC").setModel(oModel); //Binding to select in lineDialog Fragment
                        }
                        that.oLineDialogFragment.open();
                        sap.ui.core.BusyIndicator.hide();
                        //  }
                    },
                    // success: function (oData) {
                    //     sap.ui.core.BusyIndicator.hide();
                    //     if (oData.results.length > 0) {
                    //         var oModel = new sap.ui.model.json.JSONModel();
                    //         oModel.setData({
                    //             lineItems: oData.results
                    //         })
                    //         sap.ui.getCore().byId("LineSlctListRC").setModel(oModel); //Binding to select in lineDialog Fragment
                    //     }
                    //     that.oLineDialogFragment.open();
                    // },
                    error: function (oData, error) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("error");
                    },
                });
            },
            //Function to reset 
            onResetDate: function () {
                that.byId("idlocRC").setValue("");
                that.byId("idLineRC").setValue("");
                var dDate = new Date();
                var oDateL = that.getDateFn(dDate);
                var oDateH = new Date(
                    dDate.getFullYear(),
                    dDate.getMonth(),
                    dDate.getDate() + 90
                );
                var oDateH = that.getDateFn(oDateH);

                that.byId("fromDateRC").setValue(that.vFromDate);
                that.byId("toDateRC").setValue(oDateH);
                // Reset table
                that.byId("idRestrictionsReqRC").setModel(that.oEmptyModel);
                that.byId("headSearchRC").setValue();
                that.oGModel.setProperty("/resetFalg", "X");

            },
            /**
             * Called when something is entered into the search field of component.
             */
            onSearchCompReq: function () {
                var sQuery = that.byId("headSearchRC").getValue();
                // Checking if search value is empty
                if (that.oGModel.getProperty("/resetFalg") !== "X") {
                    if (sQuery != "") {
                        sQuery = sQuery.toUpperCase();
                        var aData = that.oGModel.getProperty("/TData");
                        if (!aData) return;
                        that.searchData = [];
                        for (var i = 0; i < aData.length; i++) {
                            if (
                                aData[i].RESTRICTION.includes(sQuery)
                            ) {
                                that.searchData.push(aData[i]);
                            }
                        }
                        // Calling function to generate UI table dynamically based on search data
                        that.TableGenerate(that.searchData);
                    }
                    else if (sQuery === "") {
                        var aData = that.oGModel.getProperty("/TData");
                        that.TableGenerate(aData);
                    }
                }
            },
            //Function to Save Data 
            saveRestrictions: function () {
                // if(that.idList.length ==0){
                //     return;
                // }
                sap.ui.core.BusyIndicator.show(10);
                var timeOut = 0;
                if (that.rowData.length > that.initialRowCount) {
                    timeOut = 500;
                }
                setTimeout(() => {
                    var aRestrictions = [];
                    const sLocation = that.byId("idlocRC").getValue();
                    var aDates = that.oGModel.getProperty("/WeekDates");
                    that.byId("idRestrictionsReqRC").setVisibleRowCount(that.rowData.length);
                    setTimeout(() => {
                        const aRows = that.byId("idRestrictionsReqRC").getRows();
                        saveFn(aRows);
                    }, 500)
                    function saveFn(aRows) {
                        aRows.forEach(el => {
                            var aCells = el.getCells();
                            var aRestrictionName = aCells[0].getText();
                            if (aRestrictionName) { //To check only rows with components
                                Array.from(aCells).forEach((cell, i) => {
                                    if (i != 0) { //Don't push cells of  component Column
                                        // let currentCell = cell.getItems()[0];
                                        // var cellValue = undefined;
                                        // if(that.idList.findIndex(f=>f == currentCell.sId) != -1){
                                        //     cellValue = currentCell.getValue() ? parseInt(currentCell.getValue()) : -1;
                                        // }
                                        var cellValue = cell.getItems()[0].getValue() ? parseInt(cell.getItems()[0].getValue()) : undefined;
                                        if (cellValue >= 0) {
                                            const obj = {
                                                WEEK_DATE: aDates[i].CAL_DATE,
                                                LOCATION_ID: sLocation,
                                                RESTRICTION: aRestrictionName,
                                                RESTRICTIONAVAIL_QTY: cellValue
                                            }
                                            aRestrictions.push(obj);
                                        }
                                    }
                                })
                            }
                        })
                        if (aRestrictions.length > 0) {
                            sap.ui.core.BusyIndicator.show();
                            var oModel = that.getOwnerComponent().getModel("BModel");
                            oModel.callFunction("/maintainRestrictionCapacity", {
                                method: "GET",
                                urlParameters: {
                                    RES_CAPACITY: JSON.stringify(aRestrictions)
                                },
                                success: function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show(that.oi18n.getText("saveSuccess"));
                                    that.onGetData();
                                    that.byId("idRestrictionsReqRC").setVisibleRowCount(that.initialRowCount);
                                },
                                error: function () {
                                    that.byId("idRestrictionsReqRC").setVisibleRowCount(that.initialRowCount);
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show(that.oi18n.getText("saveError"));
                                },
                            });
                        }
                        else {
                            that.byId("idRestrictionsReqRC").setVisibleRowCount(that.initialRowCount);
                        }
                    }
                }, timeOut)


            },
            //#region LocDialog-Fragment
            /**
             * This function is called when selecting an item in dialogs .
             * @param {object} oEvent -the event information.
             */
            handleSelection: function (oEvent) {
                var aSelectedItems = oEvent.getParameter("selectedItems");
                var selectedLocItem = that.byId("idlocRC").setValue(aSelectedItems[0].getTitle());
                that.byId("idLineRC").setValue('');
                if (that.oGModel.getProperty("/defaultLocation") !== selectedLocItem) {
                    that.byId("idMatList123RC").setModified(true);
                }
            },

            //#endregion
            //#region LineDialog-Fragment
            /**
             * This function is called when selecting an item in dialogs .
             * @param {object} oEvent -the event information.
             */
            handleLineSelection: function (oEvent) {
                var aSelectedItems = oEvent.getParameter("selectedItems");
                var selectedLocItem = that.byId("idLineRC").setValue(aSelectedItems[0].getTitle());
                if (that.oGModel.getProperty("/defaultLine") !== selectedLocItem) {
                    that.byId("idMatList123RC").setModified(true);
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
                if (sId.includes("LocSlctList")) {
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
                    sap.ui.getCore().byId("LocSlctListRC").getBinding("items").filter(oFilters);
                } else if (sId.includes("LineSlctList")) {
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
                    sap.ui.getCore().byId("LineSlctListRC").getBinding("items").filter(oFilters);
                }
                else if (sId.includes("GenSearch")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("VARIANTNAME", FilterOperator.Contains, sQuery),
                                    new Filter("USER", FilterOperator.Contains, sQuery),
                                    // new Filter("SCOPE", FilterOperator.Contains, sQuery)
                                ],
                                and: false,
                            })
                        );
                    }
                    sap.ui.getCore().byId("varNameListRC").getBinding("items").filter(oFilters);
                }
            },

            //#endregion
            //#region Common Methods
            /**
             * This function is called to generate UI table dynamically based on data.
             */
            TableGenerate: function (rowData) {
                var sRowData = {},
                    iRowData = [],
                    weekIndex;
                that.tableData = rowData;
                that.oTable = that.byId("idRestrictionsReqRC");
                var fromDate = new Date(that.byId("fromDateRC").getDateValue()),
                    toDate = new Date(that.byId("toDateRC").getDateValue());
                fromDate = that.getDateFn(fromDate);
                toDate = that.getDateFn(toDate);
                // Calling function to generate column names based on dates
                var liDates = that.generateDateseries(fromDate, toDate);
                that.oGModel.setProperty("/WeekDates", liDates);
                // Looping through the data to generate columns
                for (var i = 0; i < that.tableData.length; i++) {
                    sRowData.DemandLocation = that.tableData[i].LOCATION_ID;
                    sRowData.Restriction = that.tableData[i].RESTRICTION;
                    sRowData.Description = that.tableData[i].RTR_DESC;
                    weekIndex = 1;
                    for (let index = 1; index < liDates.length; index++) {
                        let temp = that.tableData[i]["WEEK" + weekIndex];
                        if (temp === -1) {
                            sRowData[liDates[index].CAL_DATE] = "";
                        } else {
                            sRowData[liDates[index].CAL_DATE] = that.tableData[i]["WEEK" + weekIndex];
                        }
                        weekIndex++;
                    }
                    iRowData.push(sRowData);
                    sRowData = {};
                }
                // Adding rows and columns data to JSON Model
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    rows: iRowData,
                    columns: liDates,
                });
                that.oTable.setModel(oModel);
                that.oTable.bindColumns("/columns", function (_sId, oContext) {
                    var columnName = oContext.getObject().CAL_DATE;
                    if (columnName === "Restriction") {
                        return new sap.ui.table.Column({
                            width: "12rem",
                            label: "Resource",
                            // template: columnName,
                            template: new sap.m.ObjectIdentifier({
                                title: "{Description}",
                                text: "{Restriction}"
                            }),
                        });
                    } else {
                        var iTotalQty = that.getTotalWeekQty(columnName, liDates);
                        //Added to convert the date into week nummber
                        var sWeekIndex = that.getWeekNumber(columnName);
                        var sCalWeek = that.getCalenderWeekOfDate(columnName);
                        var columnText = sCalWeek + " (" + iTotalQty + ")";
                        return new sap.ui.table.Column({
                            width: "10rem",
                            label: columnText,
                            tooltip: sCalWeek,
                            template: new sap.m.VBox({
                                items: [
                                    new sap.m.Input({
                                        "value": "{" + columnName + "}",
                                        "liveChange": function (oEvent) { //Allow only numbers
                                            var sValue = oEvent.getSource().getValue();
                                            var sId = oEvent.getSource().sId;
                                            var sOutput = sValue;
                                            if (sValue) {
                                                // var value = value.replace(/[A-Za-z@!#$%*+/^&()_\-{}|.:~`";'<>?,=" "[\]_]/g, "");
                                                // oEvent.getSource().setValue(value);
                                                if (!sValue.includes('.')) {
                                                    sOutput = sValue.replace(/[^\d]/g, '');
                                                    if (sOutput.length > 10) {
                                                        sOutput = sOutput.slice(0, -1);
                                                    }
                                                }
                                                else if (sValue.includes('.')) {
                                                    let aValues = sValue.split('.');
                                                    sValue = aValues[0] + '.' + aValues[1].replace(/[^\d]/g, '');
                                                    sOutput = sValue.indexOf(".") >= 0 ? sValue.slice(0, sValue.indexOf(".") + 3) : t
                                                }
                                                oEvent.getSource().setValue(sOutput);
                                            }
                                            if (that.idList.findIndex(f => f == sId) == -1) {
                                                that.idList.push(sId)
                                            }
                                        }
                                    }).addStyleClass('customTableInput')
                                ]
                            })
                        });
                    }
                });
                that.oTable.bindRows("/rows");
            },
            /**
             * This function is called when generating Date series for column names.
             * Column names will generate based on From and To dates
             * @param {object} imFromDate -From Date, imToDate - To Date.
             */
            generateDateseries: function (imFromDate, imToDate) {
                var lsDates = {},
                    liDates = [];
                var vDateSeries = imFromDate;

                lsDates.CAL_DATE = "Restriction";
                liDates.push(lsDates);
                lsDates = {};
                // Calling function to get the next Sunday date of From date
                lsDates.CAL_DATE = that.getNextMonday(vDateSeries);
                vDateSeries = lsDates.CAL_DATE;
                liDates.push(lsDates);
                lsDates = {};
                while (vDateSeries <= imToDate) {
                    // Calling function to add Days
                    vDateSeries = that.addDays(vDateSeries, 7);
                    if (vDateSeries > imToDate) {
                        break;
                    }
                    // Calling function to get the next Sunday date of From date
                    lsDates.CAL_DATE = vDateSeries;
                    liDates.push(lsDates);
                    lsDates = {};
                }
                // remove duplicates
                var lireturn = liDates.filter((obj, pos, arr) => {
                    return (
                        arr.map((mapObj) => mapObj.CAL_DATE).indexOf(obj.CAL_DATE) == pos
                    );
                });
                return lireturn;
            },
            /**
             * This function is called to get the next sunday date.
             * @param {object} imDate - From Date.
             */
            getNextMonday: function (imDate) {
                var vDate, vMonth, vYear;
                const lDate = new Date(imDate);
                var timeOffsetInMS = lDate.getTimezoneOffset() * 60000;
                lDate.setTime(lDate.getTime() + timeOffsetInMS);
                let lDay = lDate.getDay();
                if (lDay === 1) {
                    lDay = 0;
                } else {
                    if (lDay !== 0) lDay = 7 - lDay;
                    lDay = lDay + 1;
                }
                const lNextSun = new Date(
                    lDate.getFullYear(),
                    lDate.getMonth(),
                    lDate.getDate() + lDay
                );
                vDate = lNextSun.getDate();
                vMonth = lNextSun.getMonth() + 1;
                vYear = lNextSun.getFullYear();
                if (vDate < 10) {
                    vDate = "0" + vDate;
                }
                if (vMonth < 10) {
                    vMonth = "0" + vMonth;
                }
                return vYear + "-" + vMonth + "-" + vDate;
            },
            /**
             * Adding days to generate sequence of dates
             */
            addDays: function (imDate, imDays) {
                var vDate, vMonth, vYear;
                const lDate = new Date(imDate);
                var timeOffsetInMS = lDate.getTimezoneOffset() * 60000;
                lDate.setTime(lDate.getTime() + timeOffsetInMS);
                const lNextWeekDay = new Date(
                    lDate.getFullYear(),
                    lDate.getMonth(),
                    lDate.getDate() + imDays
                );
                vDate = lNextWeekDay.getDate();
                vMonth = lNextWeekDay.getMonth() + 1;
                vYear = lNextWeekDay.getFullYear();
                if (vDate < 10) {
                    vDate = "0" + vDate;
                }
                if (vMonth < 10) {
                    vMonth = "0" + vMonth;
                }
                return vYear + "-" + vMonth + "-" + vDate;
            },
            getTotalWeekQty: function (sWeekDate, liDates) {
                var liDates = liDates;
                var iWeekIndex = 0;
                var iTotalQty = 0;
                for (let index = 1; index < liDates.length; index++) {
                    iWeekIndex = iWeekIndex + 1;
                    if (liDates[index].CAL_DATE === sWeekDate) {
                        break;
                    }
                }
                // Looping through the data to generate columns SUM
                for (var i = 0; i < that.tableData.length; i++) {
                    if (that.tableData[i]["WEEK" + iWeekIndex] !== -1) {
                        iTotalQty = iTotalQty + parseInt(that.tableData[i]["WEEK" + iWeekIndex]);
                    }
                }
                return iTotalQty;
            },
            getWeekNumber: function (dInpDate) {
                var dCurrentDate = new Date(dInpDate);
                var dStartDate = new Date(dCurrentDate.getFullYear(), 0, 1);
                var iDays = Math.floor((dCurrentDate - dStartDate) / (24 * 60 * 60 * 1000));
                var iWeek = Math.ceil(iDays / 7);
                var bLeapYear = this.checkLeapYear(dCurrentDate.getFullYear());
                if (bLeapYear === true) {
                    iWeek = iWeek + 1;
                }
                iWeek = "W" + iWeek;
                return iWeek;
            },
            /**
             * Check if the year is a leap year or not
             */
            checkLeapYear: function (iYear) {
                return (iYear % 100 === 0) ? (iYear % 400 === 0) : (iYear % 4 === 0);
            },
            getCalenderWeekOfDate: function (dCurrDate) {
                var dReqDate = new Date(dCurrDate);
                var aCalenderWeek = that.oGModel.getProperty("/CalenderWeek");
                for (var i = 0; i < aCalenderWeek.length; i++) {
                    if (dReqDate >= aCalenderWeek[i].WEEK_STARTDATE && dReqDate <= aCalenderWeek[i].WEEK_ENDDATE) {
                        return aCalenderWeek[i].PERIODDESC;
                    }
                }
            },
            toggleFooter(flag) { //Hide or show footer based on Table Data
                var oObjectPageLayout = this.byId("ObjectPageLayoutRC");
                oObjectPageLayout.setShowFooter(flag);
            },
            removeDuplicate: function (array, key) { //Function to remove duplicates in an array
                var check = new Set();
                return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
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
            onNavPress: function () {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                    var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    // generate the Hash to display 
                    var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                        target: {
                            semanticObject: "VCPDocument",
                            action: "Display"
                        }
                    })) || "";
                    var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
                    oStorage.put("nodeId", 92);
                    //Generate a  URL for the second application
                    var url = window.location.href.split('#')[0] + hash;
                    //Navigate to second app
                    sap.m.URLHelper.redirect(url, true);
                }
            },

            //#endregion
            //Download & Uplaod
            downloadTemplate: function () {
                sap.ui.core.BusyIndicator.show(10);
                var timeOut = 0;
                if (that.rowData.length > that.initialRowCount) {
                    timeOut = 500;
                }
                setTimeout(() => {
                    var oSettings, oSheet, ofileName = 'RESOURCE_CAPACITY.xlsx';
                    var aRestrictions = [];
                    var aDates = that.oGModel.getProperty("/WeekDates");
                    const sLocation = that.byId("idlocRC").getValue();
                    that.byId("idRestrictionsReqRC").setVisibleRowCount(that.rowData.length);
                    setTimeout(() => {
                        const aRows = that.byId("idRestrictionsReqRC").getRows();
                        download(aRows);
                    }, 500);
                    function download(aRows) {
                        Array.from(aRows).forEach(el => {
                            var aCells = el.getCells();
                            var aRestrictionName = aCells[0].getText();
                            if (aRestrictionName != "") {
                                Array.from(aCells).forEach((cell, i) => {
                                    if (i != 0) { //Don't push cells of  restriction Column
                                        let currentCell = cell.getItems()[0];
                                        let cellValue = currentCell.getValue() ? parseInt(currentCell.getValue()) : '';
                                        let iRowIndex = aRestrictions.findIndex(f => f.Restriction == aRestrictionName);
                                        if (iRowIndex == -1) {
                                            const obj = {
                                                Restriction: aRestrictionName,
                                                Location: sLocation
                                            }
                                            obj[aDates[i].CAL_DATE] = cellValue
                                            aRestrictions.push(obj);
                                        }
                                        else {
                                            aRestrictions[iRowIndex][aDates[i].CAL_DATE] = cellValue
                                        }

                                    }
                                })
                            }

                        })
                        //Excel Columns creation
                        var aCols = [{
                            "label": "ManufacturingLocation",
                            "property": "Location",
                            "width": 12
                        }];
                        aDates.forEach((el, index) => {
                            if (index == 0) {
                                const obj = {
                                    "label": "Resource",
                                    "property": "Restriction",
                                    "width": 12
                                }
                                aCols.push(obj);
                            }
                            else {
                                const obj = {
                                    label: el.CAL_DATE,
                                    property: el.CAL_DATE,
                                    textAlign: "right",
                                    type: "number",
                                    width: 10
                                }
                                aCols.push(obj);
                            }
                        })
                        oSettings = {
                            workbook: {
                                columns: aCols,
                                context: {
                                    sheetName: 'Sheet1'
                                }
                            },
                            dataSource: aRestrictions,
                            fileName: ofileName
                        };
                        if (oSettings.dataSource.length > 0) {
                            oSheet = new Spreadsheet(oSettings);
                            oSheet.build();
                        }
                        that.byId("idRestrictionsReqRC").setVisibleRowCount(that.initialRowCount);
                        sap.ui.core.BusyIndicator.hide();
                    }
                }, timeOut)
            },
            uploadData: function (e) {
                sap.m.MessageToast.show("File Import in-Process");
                this.importExcel(e.getParameter("files") && e.getParameter("files")[0]);
            },
            importExcel: function (file) {
                if (file.type.endsWith("spreadsheetml.sheet") == false) {
                    return sap.m.MessageToast.show("Please upload only files of type XLSX");
                }
                sap.ui.core.BusyIndicator.show();
                var excelData = [], aSaveData = [];
                try {
                    if (file && window.FileReader) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            workbook.SheetNames.forEach(function (sheetName) {
                                excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                            });
                            if (excelData.length > 0) {
                                excelData.forEach(el => {
                                    if (el.Resource) {
                                        Object.entries(el).forEach(x => {
                                            if (!x[0].includes("Resource") && !x[0].includes("Location")) {
                                                const obj = {
                                                    RESTRICTION: el.Resource,
                                                    LOCATION_ID: el.ManufacturingLocation,
                                                    WEEK_DATE: x[0],
                                                    RESTRICTIONAVAIL_QTY: parseInt(x[1])
                                                }
                                                if (isNaN(obj.RESTRICTIONAVAIL_QTY) == false) {
                                                    aSaveData.push(obj)
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                            else {
                                sap.ui.core.BusyIndicator.hide();
                                return sap.m.MessageToast.show("Please Upload Valid Data!")
                            }
                            sap.ui.core.BusyIndicator.hide();
                            if (aSaveData.length > 0) {
                                sap.ui.core.BusyIndicator.show();
                                var oModel = that.getOwnerComponent().getModel("BModel");
                                oModel.callFunction("/maintainRestrictionCapacity", {
                                    method: "GET",
                                    urlParameters: {
                                        RES_CAPACITY: JSON.stringify(aSaveData)
                                    },
                                    success: function () {
                                        sap.ui.core.BusyIndicator.hide();
                                        sap.m.MessageToast.show(that.oi18n.getText("saveSuccess"));
                                        that.onGetData();
                                    },
                                    error: function () {
                                        sap.ui.core.BusyIndicator.hide();
                                        sap.m.MessageToast.show(that.oi18n.getText("saveError"));
                                    },
                                });

                            }
                        };
                        reader.onerror = function (ex) {
                            sap.ui.core.BusyIndicator.hide();
                            console.log(ex);
                        };
                        reader.readAsBinaryString(file);
                    }
                    else {
                        sap.ui.core.BusyIndicator.hide();
                    }
                }
                catch {
                    sap.ui.core.BusyIndicator.hide();
                }

            },

            /*Getting variant view data*/
            getVariantData: function () {
                var ndData = [];
                var dData = [], uniqueName = [];
                that.uniqueName = [];
                sap.ui.core.BusyIndicator.show();
                var variantUser = that.getUser().toLowerCase();
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                that.oGModel.setProperty("/UserId", variantUser);
                // Define the filters
                var oFilterAppName1 = new sap.ui.model.Filter("APPLICATION_NAME", sap.ui.model.FilterOperator.EQ, appName);
                var oFilterUser = new sap.ui.model.Filter("USER", sap.ui.model.FilterOperator.EQ, variantUser);

                var oFilterAppName2 = new sap.ui.model.Filter("APPLICATION_NAME", sap.ui.model.FilterOperator.EQ, appName);
                var oFilterScope = new sap.ui.model.Filter("SCOPE", sap.ui.model.FilterOperator.EQ, "Public");

                var oFilterAppName3 = new sap.ui.model.Filter("APPLICATION_NAME", sap.ui.model.FilterOperator.EQ, 'DefaultSingle');
                var oFilterUser1 = new sap.ui.model.Filter("USER", sap.ui.model.FilterOperator.EQ, variantUser);

                var oFilterCondition1 = new sap.ui.model.Filter({
                    filters: [oFilterAppName1, oFilterUser],
                    and: true // Combine with AND
                });

                var oFilterCondition2 = new sap.ui.model.Filter({
                    filters: [oFilterAppName2, oFilterScope],
                    and: true // Combine with AND
                });
                var oFilterCondition3 = new sap.ui.model.Filter({
                    filters: [oFilterAppName3, oFilterUser1],
                    and: true // Combine with AND
                });
                var oFinalFilter = new sap.ui.model.Filter({
                    filters: [oFilterCondition1, oFilterCondition2, oFilterCondition3],
                    and: false // Combine with OR
                });

                this.getView().getModel("BModel").read("/getVariantHeader", {
                    // filters: [oFinalFilter],
                    headers:{   
                        "x-user-id":variantUser,
                        "x-app-name":appName
                    },
                    success: function (oData) {
                        oData.results = oData.results.map(item => ({
                            ...item,
                            VARIANTID: String(item.VARIANTID)
                        }));
                        that.oGModel.setProperty("/headerDetails", oData.results);
                        if (oData.results.length === 0) {
                            that.oGModel.setProperty("/variantDetails", "");
                            that.oGModel.setProperty("/fromFunction", "X");
                            uniqueName.unshift({
                                "VARIANTNAME": "Standard",
                                "VARIANTID": "0",
                                "DEFAULT": "Y",
                                "REMOVE": false,
                                "CHANGE": false,
                                "USER": "SAP",
                                "SCOPE": "Public"
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            that.oGModel.setProperty("/defaultDetails", "");
                            // uniqueName = that.normalizeVariantItems(uniqueName);
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            // that.byId("idMatList123RC").setModel(that.viewDetails);
                            that.UniqueDefKey = uniqueName[0].VARIANTID;
                            that.byId("idMatList123RC").setDefaultKey(uniqueName[0].VARIANTID);
                            that.byId("idMatList123RC").setSelectedKey(uniqueName[0].VARIANTID);
                            var Default = "Standard";
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                that.oGModel.setProperty("/newVaraintFlag", "");
                            } else {
                                that.handleSelectPress(Default);
                            }
                        }
                        else {
                            for (var i = 0; i < oData.results.length; i++) {
                                if (oData.results[i].DEFAULT === "Y" && oData.results[i].USER === variantUser) {
                                    dData.push(oData.results[i]);
                                    that.UniqueDefKey = oData.results[i].VARIANTID;
                                    that.byId("idMatList123RC").setDefaultKey((oData.results[i].VARIANTID));
                                    that.byId("idMatList123RC").setSelectedKey((oData.results[i].VARIANTID))
                                }
                                if (oData.results[i].USER !== variantUser) {
                                    oData.results[i].CHANGE = false;
                                    oData.results[i].REMOVE = false;
                                    oData.results[i].ENABLE = false;
                                }
                                ndData.push(oData.results[i]);
                            }

                            if (dData.length > 0) {
                                that.oGModel.setProperty("/defaultVariant", dData);
                            }
                            that.oGModel.setProperty("/VariantData", ndData);

                            that.getTotalVariantDetails();
                        }
                    },
                    error: function (oData, error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("error while loading variant details");
                    },
                });
            },

            getTotalVariantDetails: function () {
                var aData = [], uniqueName = [], details = {}, defaultDetails = [], oFilters = [];
                var headerData = that.oGModel.getProperty("/VariantData");
                if (headerData.length > 0) {
                    for (var i = 0; i < headerData.length; i++) {
                        oFilters.push(new Filter("VARIANTID", FilterOperator.EQ, headerData[i].VARIANTID));
                    }
                }
                var userVariant = that.oGModel.getProperty("/UserId");
                this.getOwnerComponent().getModel("BModel").read("/getVariant", {
                    filters: [oFilters],
                    success: function (oData) {
                        oData.results = oData.results.map(item => ({
                            ...item,
                            VARIANTID: String(item.VARIANTID)
                        }));
                        that.oGModel.setProperty("/fieldDetails", oData.results);
                        var variantNewData = oData.results;
                        aData = variantNewData.map(item1 => {
                            const item2 = headerData.find(item2 => item2.VARIANTID === item1.VARIANTID);
                            return item2 ? { ...item1, ...item2 } : { ...item1 };
                        });
                        that.oGModel.setProperty("/variantDetails", aData);
                        if (aData.length > 0) {
                            aData = aData.filter(id => id.VARIANTNAME !== "defaultSingle" && id.APPLICATION_NAME !== "DefaultSingle")
                            uniqueName = that.removeDuplicate(aData, "VARIANTNAME");
                            that.oGModel.setProperty("/saveBtn", "");
                            for (var k = 0; k < uniqueName.length; k++) {
                                if (uniqueName[k].DEFAULT === "Y" && uniqueName[k].USER === userVariant) {
                                    var Default = uniqueName[k].VARIANTNAME;
                                    details = {
                                        "VARIANTNAME": uniqueName[k].VARIANTNAME,
                                        "VARIANTID": uniqueName[k].VARIANTID,
                                        "USER": uniqueName[k].USER,
                                        "DEFAULT": "N"
                                    };
                                    defaultDetails.push(details);
                                    details = {};
                                }
                            }
                        }

                        that.oGModel.setProperty("/fromFunction", "X");
                        if (Default) {
                            uniqueName.unshift({
                                "VARIANTNAME": "Standard",
                                "VARIANTID": "0",
                                "DEFAULT": "N",
                                "REMOVE": false,
                                "CHANGE": false,
                                "USER": "SAP",
                                "SCOPE": "Public"
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            // uniqueName = that.normalizeVariantItems(uniqueName);
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            that.oGModel.setProperty("/defaultDetails", defaultDetails);
                            // that.byId("idMatList123RC").setModel(that.variantModel);
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                if (newVariant[0].DEFAULT === "Y") {
                                    that.UniqueDefKey = newVariant[0].VARIANTID;
                                    that.byId("idMatList123RC").setDefaultKey((newVariant[0].VARIANTID));
                                }
                                that.byId("idMatList123RC").setSelectedKey((newVariant[0].VARIANTID))
                                that.oGModel.setProperty("/newVaraintFlag", "");
                            } else {
                                that.handleSelectPress(Default);
                            }
                        } else {
                            uniqueName.unshift({
                                "VARIANTNAME": "Standard",
                                "VARIANTID": "0",
                                "DEFAULT": "Y",
                                "REMOVE": false,
                                "CHANGE": false,
                                "USER": "SAP",
                                "SCOPE": "Public"
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            that.oGModel.setProperty("/defaultDetails", "");
                            // uniqueName = that.normalizeVariantItems(uniqueName);
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            // that.byId("idMatList123RC").setModel(that.viewDetails);
                            var Default = "Standard";
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                if (newVariant[0].DEFAULT === "Y") {
                                    that.UniqueDefKey = newVariant[0].VARIANTID;
                                    that.byId("idMatList123RC").setDefaultKey((newVariant[0].VARIANTID));
                                }
                                that.byId("idMatList123RC").setSelectedKey((newVariant[0].VARIANTID))
                                that.oGModel.setProperty("/newVaraintFlag", "");
                            } else {
                                that.UniqueDefKey = uniqueName[0].VARIANTID;
                                that.byId("idMatList123RC").setDefaultKey((uniqueName[0].VARIANTID));
                                that.byId("idMatList123RC").setSelectedKey((uniqueName[0].VARIANTID));
                                that.handleSelectPress(Default);
                            }
                        }

                    },
                    error: function (oData, error) {
                        sap.ui.core.BusyIndicator.hide()
                        MessageToast.show("error while loading variant details");
                    },
                });
            },


            removeDuplicate: function (array, key) {
                var check = new Set();
                return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
            },
            /**
         /**On Press of Variant Name */
            handleSelectPress: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var oLoc, oLine, oTokens = {}, custToken = [];
                that.locProdFilters = [];
                that.finaloTokens = [];
                var oTableItems = that.oGModel.getProperty("/variantDetails");
                that.byId("idMatList123RC").setModified(false);
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                // that.oGModel.setProperty("/setCust", []);
                that.oGModel.setProperty("/setLocation", '');
                that.oGModel.setProperty("/setLine", '');
                that.oGModel.setProperty("/defaultLocation", "");
                that.oGModel.setProperty("/defaultLine", "");
                // that.oGModel.setProperty("/defaultCustomer", []);
                if (that.oGModel.getProperty("/fromFunction") === "X") {
                    that.oGModel.setProperty("/fromFunction", "");
                    that.selectedApp = oEvent;
                    that.oGModel.setProperty("/variantName", that.selectedApp);
                }
                else {
                    that.selectedApp = oEvent.getSource().getTitle().getText();
                    that.oGModel.setProperty("/variantName", that.selectedApp);
                }
                if (that.selectedApp !== "Standard") {
                    for (var i = 0; i < oTableItems.length; i++) {
                        if (that.selectedApp === oTableItems[i].VARIANTNAME && oTableItems[i].APPLICATION_NAME === appName) {
                            if (oTableItems[i].FIELD.includes("Loc")) {
                                oLoc = oTableItems[i].VALUE;
                                that.oGModel.setProperty("/defaultLocation", oLoc);
                                var sFilter = new sap.ui.model.Filter({
                                    path: "LOCATION_ID",
                                    operator: sap.ui.model.FilterOperator.EQ,
                                    value1: oTableItems[i].VALUE,
                                });
                                that.locProdFilters.push(sFilter);

                            }
                            else if (oTableItems[i].FIELD.includes("Line")) {
                                oLine = oTableItems[i].VALUE;
                                that.oGModel.setProperty("/defaultLine", oLine);
                                var sFilter = new sap.ui.model.Filter({
                                    path: "LINE_ID",
                                    operator: sap.ui.model.FilterOperator.EQ,
                                    value1: oTableItems[i].VALUE,
                                });
                                that.locProdFilters.push(sFilter);

                            }
                            // else if (oTableItems[i].FIELD.includes("Cust")) {
                            //     var oCustTemplate = new sap.m.Token({
                            //         key: oTableItems[i].FIELD_CENTER,
                            //         text: oTableItems[i].VALUE
                            //     });
                            //     custToken.push(oCustTemplate);
                            //     oCustTemplate = {};
                            //     oTokens = {
                            //         FIELD: oTableItems[i].FIELD,
                            //         VALUE: oTableItems[i].FIELD_CENTER
                            //     }
                            //     that.finaloTokens.push(oTokens);
                            //     that.oGModel.setProperty("/defaultCustomer", custToken);
                            // }

                        }
                    }
                    // that.oProd.setValue(oProd);
                    //   that.oCust.removeAllTokens();
                    // this._valueHelpDialogProd2
                    //     .getAggregation("_dialog")
                    //     .getContent()[1]
                    //     .removeSelections();
                    // this._valueHelpDialogCustomer
                    //     .getAggregation("_dialog")
                    //     .getContent()[1]
                    //     .removeSelections();
                    // this._valueHelpDialogLoc
                    //     .getAggregation("_dialog")
                    //     .getContent()[1]
                    //     .removeSelections();
                    if (oLine) {
                        that.oLine.setValue(oLine);
                        that.oGModel.setProperty("/setLine", oLine);
                    } else {
                        that.oLine.setValue("");
                    }
                    if (oLoc) {
                        that.oLoc.setValue(oLoc);
                        that.oGModel.setProperty("/setLocation", oLoc);
                    }
                    else {
                        that.oLoc.setValue("");
                    }
                    // if (custToken.length > 0) {
                    //     custToken.forEach(item => {
                    //         that.oCust.addToken(new sap.m.Token({
                    //             key: item.getKey(),
                    //             text: item.getText(),
                    //             editable: false
                    //         })
                    //         )
                    //     })
                    //     that.oGModel.setProperty("/setCust", custToken);

                    // }
                    sap.ui.core.BusyIndicator.hide();
                }
                else {
                    // let headerDetails = that.oGModel.getProperty("/headerDetails").filter(id => id.APPLICATION_NAME == "DefaultSingle" && id.VARIANTNAME == "defaultSingle");
                    // if (headerDetails.length) {
                    //     var oTableItems = that.oGModel.getProperty("/fieldDetails").filter(id => id.VARIANTID == headerDetails[0].VARIANTID);
                    //     for (var i = 0; i < oTableItems.length; i++) {
                    //         if (oTableItems[i].FIELD.includes("Manufacturing Location")) {
                    //             oLoc = oTableItems[i].VALUE;
                    //             that.oGModel.setProperty("/defaultLocation", oLoc);
                    //             var sFilter = new sap.ui.model.Filter({
                    //                 path: "LOCATION_ID",
                    //                 operator: sap.ui.model.FilterOperator.EQ,
                    //                 value1: oTableItems[i].VALUE,
                    //             });
                    //             that.locProdFilters.push(sFilter);

                    //         }
                    //         else if (oTableItems[i].FIELD.includes("Line ID")) {
                    //             oLine = oTableItems[i].VALUE;
                    //             that.oGModel.setProperty("/defaultLine", oLine);
                    //             var sFilter = new sap.ui.model.Filter({
                    //                 path: "LINE_ID",
                    //                 operator: sap.ui.model.FilterOperator.EQ,
                    //                 value1: oTableItems[i].VALUE,
                    //             });
                    //             that.locProdFilters.push(sFilter);

                    //         }



                    //     }

                    //     if (oLine) {
                    //         that.oLine.setValue(oLine);
                    //         that.oGModel.setProperty("/setLine", oLine);
                    //     } else {
                    //         that.oLine.setValue("");
                    //     }
                    //     if (oLoc) {
                    //         that.oLoc.setValue(oLoc);
                    //         that.oGModel.setProperty("/setLocation", oLoc);
                    //     }
                    //     else {
                    //         that.oLoc.setValue("");
                    //     }

                    // }
                    // else {
                    //do nothing
                    that.byId("idLineRC").setValue();
                    that.byId("idlocRC").setValue();

                    that.onResetDate();
                    // }
                    sap.ui.core.BusyIndicator.hide();

                }
            },

            // /**
            //  * On Press of drop down button
            //  * @param {*} oEvent 
            //  */
            // onDropDownPress: function (oEvent) {
            //     var count = 0;
            //     if (oEvent.getSource().getPressed()) {
            //         this._popOver.openBy(oEvent.getSource());
            //         var lineDetails = that.byId("idLineRC").getValue();
            //         var locDetails = that.byId("idlocRC").getValue();
            //         var locDefault = that.oGModel.getProperty("/selectedLocation");
            //         var lineDefault = that.oGModel.getProperty("/selectedLine");
            //         var selectedID = that.byId("idVariantName").getText();
            //         if (selectedID !== "Standard" && that.oGModel.getProperty("/saveBtn") !== "X") {
            //             if (locDetails === locDefault) {
            //                 if (lineDetails !== lineDefault) {
            //                     sap.ui.getCore().byId("idSaveRC").setVisible(true);
            //                     sap.ui.getCore().byId("idSaveRC").setType("Emphasized");
            //                 }
            //                 else {
            //                     sap.ui.getCore().byId("idSaveRC").setVisible(false);
            //                 }
            //             } else {
            //                 sap.ui.getCore().byId("idSaveRC").setVisible(true);
            //                 sap.ui.getCore().byId("idSaveRC").setType("Emphasized");
            //             }
            //         }
            //     }
            //     else {
            //         this._popOver.close();
            //     }
            // },
            // /**
            // * Opening the NameVariant fragment on press of "SaveAs" in popover fragment
            // */
            // onVariantSave: function () {
            //     that.byId("idDropDown").setPressed(false);
            //     that._popOver.close();
            //     that._nameFragment.open();
            //     sap.ui.getCore().byId("idInputRC").setValue();
            //     sap.ui.getCore().byId("idInputRC").setValueState("None");
            //     sap.ui.getCore().byId("idSaveBtnRC").setEnabled(true);
            // },
            /**
             * Closing the namevariant fragment
             */
            onSaveClose: function () {
                that._nameFragment.close();
            },

            /**
         * Saving the VIEW on press of save in NameVariant fragment
         * @param {*} oEvent 
         */
            onCreate: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var array = [];
                var details = {};
                var sLocation = that.byId("idlocRC").getValue();
                var Field1 = that.byId("idlocRC").getParent().mAggregations.content[0].getText()
                var sLine = that.byId("idLineRC").getValue();
                var Field2 = that.byId("idLineRC").getParent().mAggregations.content[0].getText()
                // var sCust = that.byId("idCustGrp").getTokens();
                // var Field3 = that.byId("idCustGrp").getParent().getItems()[0].getText();
                var varName = oEvent.getParameters().name;
                var sDefault = oEvent.getParameters().def;
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                if (!sLocation && !sLine === 0) {
                    sap.ui.core.BusyIndicator.hide();
                    return MessageToast.show("No values selected in filters Configurable Product,Demand Location & Customer Group")
                }

                if (varName) {
                    if (sDefault && that.oGModel.getProperty("/defaultDetails").length > 0) {
                        var defaultChecked = "Y";
                        this.getOwnerComponent().getModel("BModel").callFunction("/updateVariant", {
                            method: "GET",
                            urlParameters: {
                                VARDATA: JSON.stringify(that.oGModel.getProperty("/defaultDetails"))
                            },
                            success: function (oData) {
                            },
                            error: function (error) {
                                MessageToast.show("Failed to create variant");
                            },
                        });

                    }
                    else if (sDefault && that.oGModel.getProperty("/defaultDetails").length === 0) {
                        var defaultChecked = "Y";
                    }
                    else {
                        var defaultChecked = "N";
                    }
                    if (oEvent.getParameters().public) {
                        var Scope = "Public";
                    }
                    else {
                        var Scope = "Private";
                    }
                    if (sLocation) {
                        details = {
                            Field: Field1,
                            FieldCenter: (1).toString(),
                            Value: sLocation,
                            Default: defaultChecked
                        }
                        array.push(details);
                    }
                    if (sLine) {
                        details = {
                            Field: Field2,
                            FieldCenter: (1).toString(),
                            Value: sLine,
                            Default: defaultChecked
                        }
                        array.push(details);
                    }

                    if (!oEvent.getParameters().overwrite) {
                        for (var j = 0; j < array.length; j++) {
                            array[j].IDNAME = varName;
                            array[j].App_Name = appName;
                            array[j].SCOPE = Scope;
                        }
                        var flag = "X";
                    }
                    else {
                        var flag = "E";
                        for (var j = 0; j < array.length; j++) {
                            array[j].ID = oEvent.getParameters().key;
                            array[j].IDNAME = varName;
                            array[j].App_Name = appName;
                            array[j].SCOPE = Scope;
                        }
                    }
                    //    console.log(JSON.stringify(array));
                    this.getOwnerComponent().getModel("BModel").callFunction("/createVariant", {
                        method: "GET",
                        urlParameters: {
                            Flag: flag,
                            USER: (that.oGModel.getProperty("/UserId")),
                            VARDATA: JSON.stringify(array)
                        },
                        success: function (oData) {
                            that.oGModel.setProperty("/newVariant", oData.results);
                            that.oGModel.setProperty("/newVaraintFlag", "X");
                            that.byId("idMatList123RC").setModified(false);
                            that.onAfterRendering();
                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show("Failed to create variant");
                        },
                    });
                }
                else {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Please fill View Name");
                }
            },
            /**On press of save in manage fragment */
            onManage: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var oDelted = {}, deletedArray = [], count = 0;
                var totalVariantData = that.oGModel.getProperty("/VariantData");
                var selected = oEvent.getParameters();
                var variantUser = that.getUser();
                if (selected.def) {
                    totalVariantData.filter(item1 => {
                        if (JSON.parse(selected.def) == item1.VARIANTID && item1.USER !== variantUser) {
                            count++
                        }
                    })
                }
                if (count > 0) {
                    sap.ui.core.BusyIndicator.hide();
                    that.viewDetails.setData({
                        items12: that.varianNames
                    });
                    // that.byId("idMatList123RC").setModel(that.viewDetails);
                    that.byId("idMatList123RC").setDefaultKey(that.UniqueDefKey);
                    return MessageToast.show("Variant doesn't belong to logged in user. Cannot make changes to this Variant");
                }
                //Delete the selected variant names
                if (selected.deleted) {
                    selected.deleted.forEach(item1 => {
                        totalVariantData.forEach(item2 => {
                            if (JSON.parse(item1) == item2.VARIANTID) {
                                oDelted = {
                                    ID: item2.VARIANTID,
                                    NAME: item2.VARIANTNAME
                                };
                                deletedArray.push(oDelted);
                            }
                        })
                    });
                    if (deletedArray.length > 0) {
                        that.deleteVariant(deletedArray)
                    }
                }
                //Updating the default variants
                if (selected.def) {
                    //If selected default is not standard
                    if (JSON.parse(selected.def) != 0) {
                        //Update the existing default to a new default
                        var defaultVariant = totalVariantData.filter(item => item.DEFAULT === "Y");
                        if (defaultVariant.length > 0) {
                            defaultVariant[0].DEFAULT = "N";
                            that.getView().getModel("BModel").callFunction("/updateVariant", {
                                method: "GET",
                                urlParameters: {
                                    VARDATA: JSON.stringify(defaultVariant)
                                },
                                success: function (oData) {
                                    var newDefault = totalVariantData.filter(item => item.VARIANTID == JSON.parse(selected.def));
                                    newDefault[0].DEFAULT = "Y";
                                    that.getView().getModel("BModel").callFunction("/updateVariant", {
                                        method: "GET",
                                        urlParameters: {
                                            VARDATA: JSON.stringify(newDefault)
                                        },
                                        success: function (oData) {
                                            that.onAfterRendering();
                                            // sap.ui.core.BusyIndicator.hide();
                                        },
                                        error: function (error) {
                                            MessageToast.show("Failed to update variant");
                                        },
                                    });
                                },
                                error: function (error) {
                                    sap.ui.core.BusyIndicator.hide();
                                    MessageToast.show("Failed to update variant");
                                },
                            });

                        }
                        else {
                            var selectedVariant = totalVariantData.filter(item => item.VARIANTID == JSON.parse(selected.def));
                            selectedVariant[0].DEFAULT = "Y";
                            that.getView().getModel("BModel").callFunction("/updateVariant", {
                                method: "GET",
                                urlParameters: {
                                    VARDATA: JSON.stringify(selectedVariant)
                                },
                                success: function (oData) {
                                    that.onAfterRendering();
                                    // sap.ui.core.BusyIndicator.hide();
                                },
                                error: function (error) {
                                    sap.ui.core.BusyIndicator.hide();
                                    MessageToast.show("Failed to update variant");
                                },
                            });
                        }
                    }
                    //If selected default is standard then remove the existing default variant
                    else {
                        var defaultItem = totalVariantData.filter(item => item.DEFAULT === "Y");
                        defaultItem[0].DEFAULT = "N";
                        that.getView().getModel("BModel").callFunction("/updateVariant", {
                            method: "GET",
                            urlParameters: {
                                VARDATA: JSON.stringify(defaultItem)
                            },
                            success: function (oData) {
                                that.onAfterRendering();
                                // sap.ui.core.BusyIndicator.hide();
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                MessageToast.show("Failed to update variant");
                            },
                        });
                    }
                } else {
                    that.onAfterRendering();
                }
                sap.ui.core.BusyIndicator.hide();
            },

            deleteVariant: function (oEvent) {
                var deletedItems = JSON.stringify(oEvent);
                that.getView().getModel("BModel").callFunction("/createVariant", {
                    method: "GET",
                    urlParameters: {
                        Flag: "D",
                        USER: that.oGModel.getProperty("/UserId"),
                        VARDATA: deletedItems
                    },
                    success: function (oData) {
                        that.deletedArray = [];
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to delete variant");
                    },
                });
            },

            // /**
            // * Creating a new VIEW on press of save in NameVariant fragment
            // * @param {*} oEvent 
            // */
            // onCreate: function (oEvent) {
            //     that.byId("idDropDown").setPressed(false);
            //     var array = [];
            //     var details = {};
            //     var sLocation = that.byId("idlocRC").getValue();
            //     var Field1 = that.byId("idlocRC").getParent().getContent()[0].getText();
            //     var sLine = that.byId("idLineRC").getValue();
            //     var Field2 = that.byId("idLineRC").getParent().getContent()[0].getText();
            //     var varName = sap.ui.getCore().byId("idInputRC").getValue();
            //     if (!sLocation && !sLine) {
            //         sap.ui.getCore().byId("_IDGenCheckBox1RC").setSelected(false);
            //         sap.ui.getCore().byId("idInputRC").setValue();
            //         that._nameFragment.close();
            //         return MessageToast.show("No values selected in filters Manufacturing Location & LineId");
            //     }
            //     var sDefault = sap.ui.getCore().byId("_IDGenCheckBox1RC").getSelected();
            //     if (varName) {
            //         if (sDefault && that.oGModel.getProperty("/defaultDetails").length > 0) {
            //             var defaultChecked = "Y";
            //             this.getView().getModel("BModel").callFunction("/updateVariant", {
            //                 method: "GET",
            //                 urlParameters: {
            //                     VARDATA: JSON.stringify(that.oGModel.getProperty("/defaultDetails"))
            //                 },
            //                 success: function (oData) {
            //                     // MessageToast.show(oData);
            //                 },
            //                 error: function (error) {
            //                     MessageToast.show("Failed to create variant");
            //                 },
            //             });

            //         } else if (sDefault && that.oGModel.getProperty("/defaultDetails").length === 0) {
            //             var defaultChecked = "Y";
            //         } else {
            //             var defaultChecked = "N";
            //         }
            //         // for (var i = 0; i < sLocation.length; i++) {
            //         if (sLocation) {
            //             details = {
            //                 Field: Field1,
            //                 FieldCenter: (1).toString(),
            //                 Value: sLocation,
            //                 FAVOURITE: "N",
            //                 Default: defaultChecked
            //             }
            //             array.push(details);
            //         }

            //         // for (var k = 0; k < sProduct.length; k++) {
            //         if (sLine) {
            //             details = {
            //                 Field: Field2,
            //                 FieldCenter: (1).toString(),
            //                 Value: sLine,
            //                 FAVOURITE: "N",
            //                 Default: defaultChecked
            //             }
            //             array.push(details);
            //         }

            //         for (var j = 0; j < array.length; j++) {
            //             array[j].IDNAME = varName;
            //             array[j].App_Name = "Restrictions Capacity"
            //         }
            //         this.getView().getModel("BModel").callFunction("/createVariant", {
            //             method: "GET",
            //             urlParameters: {
            //                 Flag: "X",
            //                 USER: that.oGModel.getProperty("/UserId"),
            //                 VARDATA: JSON.stringify(array)
            //             },
            //             success: function (oData) {
            //                 that.oGModel.setProperty("/newVariant", oData.results);
            //                 that.oGModel.setProperty("/newVaraintFlag", "X");
            //                 sap.ui.getCore().byId("_IDGenCheckBox1RC").setSelected(false);
            //                 sap.ui.getCore().byId("idInputRC").setValue();
            //                 that._nameFragment.close();
            //                 that.onAfterRendering();
            //             },
            //             error: function (error) {
            //                 MessageToast.show("Failed to create variant");
            //             },
            //         });
            //     } else {
            //         MessageToast.show("Please fill View Name");
            //     }
            // },
            // /**
            // * Opening the VariantNames fragment on press of "Manage" in popover fragment
            // * @param {*} oEvent 
            // */
            // onManageOpen: function (oEvent) {
            //     that._popOver.close();
            //     that.byId("idDropDown").setPressed(false);
            //     if (that.oGModel.getProperty("/deletedFlag") === "X") {
            //         if (!this._manageVariant) {
            //             this._manageVariant = sap.ui.xmlfragment(
            //                 "vcpapp.vcpcprestrictionsavail.view.VariantNames",
            //                 this
            //             );
            //             this.getView().addDependent(this._manageVariant);
            //         }
            //         that.newModel = new JSONModel();
            //         that.emptyModel = new JSONModel([]);
            //         // sap.ui.getCore().byId("varNameListRC").destroyItems();
            //         that.newModel.setData({ items1: that.varianNames });
            //         sap.ui.getCore().byId("varNameListRC").setModel(that.newModel);
            //         that._manageVariant.open();
            //         that.oGModel.setProperty('/deletedFlag', "");
            //         that.deletedArray = [];
            //     }
            //     else {
            //         that._manageVariant.open();
            //     }
            // },
            // /**
            //  * Closing the VariantNames fragment
            //  */
            // handleManageClose: function () {
            //     sap.ui.getCore().byId("_IDGenSearchField1RC").setValue();
            //     if (this._manageVariant) {
            //         that._manageVariant.destroy(true);
            //         that._manageVariant = "";
            //         that.oGModel.setProperty('/deletedFlag', "X");
            //     }
            // },
            // /**
            // * Deleting the selected view in VariantNames fragment
            // */
            // onViewDelete: function (oEvent) {
            //     var details = {};
            //     var deletedItem = parseInt(oEvent.getSource().getParent().getCells()[3].getText());
            //     var deletedItemName = oEvent.getSource().getParent().getCells()[0].getText();
            //     details = {
            //         ID: deletedItem,
            //         NAME: deletedItemName
            //     }
            //     that.deletedArray.push(details);
            //     details = {};
            //     var selectedItem = oEvent.getSource().getParent();
            //     var source = sap.ui.getCore().byId("varNameListRC");
            //     source.removeItem(selectedItem);
            //     that.oGModel.setProperty('/deletedFlag', "X");
            // },
            // /**
            // * Saving the public/private property on click of save in VariantNames fragment. 
            // */
            // onManage: function () {
            //     var newSelection = {};
            //     var newDefault = [];
            //     var initalDetails = that.oGModel.getProperty("/defaultVariant");
            //     var oTable = sap.ui.getCore().byId("varNameListRC").getItems();
            //     if (that.deletedArray.length > 0) {
            //         that.deleteVariant();

            //     }

            //     for (var i = 0; i < oTable.length; i++) {
            //         if (oTable[i].getCells()[1].getSelected()) {
            //             newSelection.VARIANTID = (oTable[i].getCells()[3].getText());
            //             newSelection.VARIANTNAME = oTable[i].getCells()[0].getText();
            //             newSelection.DEFAULT = "Y";
            //             newDefault.push(newSelection);
            //             newSelection = {};
            //             break;
            //         }
            //     }
            //     if (newDefault.length === 0) {
            //         newSelection.VARIANTID = (oTable[0].getCells()[3].getText());
            //         newSelection.VARIANTNAME = oTable[0].getCells()[0].getText();
            //         newSelection.DEFAULT = "Y";
            //         newDefault.push(newSelection);
            //         newSelection = {};
            //     }
            //     if (initalDetails) {
            //         if (parseInt(newDefault[0].VARIANTID) === initalDetails[0].VARIANTID) {
            //             // MessageToast.show("Updated Successfully");
            //             that.handleManageClose();
            //         } else if (newDefault[0].VARIANTNAME === "Standard") {
            //             for (i in initalDetails) {
            //                 initalDetails[i].DEFAULT = "N"
            //             }
            //             this.getView().getModel("BModel").callFunction("/updateVariant", {
            //                 method: "GET",
            //                 urlParameters: {
            //                     VARDATA: JSON.stringify(initalDetails)
            //                 },
            //                 success: function (oData) {
            //                     // MessageToast.show("Updated Successfully");
            //                     that.handleManageClose();
            //                     that.onAfterRendering();
            //                     // MessageToast.show(oData);
            //                 },
            //                 error: function (error) {
            //                     MessageToast.show("Failed to update variant");
            //                 },
            //             });
            //         } else {

            //             this.getView().getModel("BModel").callFunction("/updateVariant", {
            //                 method: "GET",
            //                 urlParameters: {
            //                     VARDATA: JSON.stringify(newDefault)
            //                 },
            //                 success: function (oData) {
            //                     // MessageToast.show("Updated Successfully");
            //                     that.handleManageClose();
            //                     that.onAfterRendering();
            //                     // MessageToast.show(oData);
            //                 },
            //                 error: function (error) {
            //                     MessageToast.show("Failed to update variant");
            //                 },
            //             });
            //             for (i in initalDetails) {
            //                 initalDetails[i].DEFAULT = "N"
            //             }
            //             this.getView().getModel("BModel").callFunction("/updateVariant", {
            //                 method: "GET",
            //                 urlParameters: {
            //                     VARDATA: JSON.stringify(initalDetails)
            //                 },
            //                 success: function (oData) {
            //                     // MessageToast.show("Updated Successfully");
            //                     that.handleManageClose();
            //                     that.onAfterRendering();
            //                     // MessageToast.show(oData);
            //                 },
            //                 error: function (error) {
            //                     MessageToast.show("Failed to update variant");
            //                 },
            //             });

            //         }
            //     } else {
            //         this.getView().getModel("BModel").callFunction("/updateVariant", {
            //             method: "GET",
            //             urlParameters: {
            //                 VARDATA: JSON.stringify(newDefault)
            //             },
            //             success: function (oData) {
            //                 // MessageToast.show("Updated Successfully");
            //                 that.handleManageClose();
            //                 that.onAfterRendering();
            //                 // MessageToast.show(oData);
            //             },
            //             error: function (error) {
            //                 MessageToast.show("Failed to update variant");
            //             },
            //         });
            //     }

            // },
            // /**
            // * Save the current view if any changes in the existing properties.
            // */
            // onSave: function () {
            //     var updatedDetails = {};
            //     var updatedArray = [];
            //     var selectedItem = sap.ui.getCore().byId("idMatListRC");
            //     if (selectedItem.getSelectedItem() !== null) {
            //         var Default = selectedItem.getSelectedItem().getBindingContext().getObject().DEFAULT;
            //         var VariantId = selectedItem.getSelectedItem().getBindingContext().getObject().VARIANTID;
            //         var VariantName = selectedItem.getSelectedItem().getBindingContext().getObject().VARIANTNAME;
            //         // var Scope = selectedItem.getSelectedItem().getBindingContext().getObject().SCOPE;

            //     } else {
            //         var defaulDetails1 = that.oGModel.getProperty("/defaultDetails");
            //         var VariantId = defaulDetails1[0].VARIANTID;
            //         var VariantName = defaulDetails1[0].VARIANTNAME;
            //         // var Scope = defaulDetails1[0].SCOPE;
            //         var Default = "Y";
            //         // that.oGModel.setProperty("/defFromFunc","");

            //     }

            //     var sLine = that.byId("idLineRC").getValue();
            //     var sLocation = that.byId("idlocRC").getValue();
            //     var Field1 = that.byId("idlocRC").getParent().getContent()[0].getText();
            //     var Field2 = that.byId("idLineRC").getParent().getContent()[0].getText();
            //     if (VariantName) {
            //         if (sLocation) {
            //             updatedDetails = {
            //                 Field: Field1,
            //                 FieldCenter: (1).toString(),
            //                 Value: sLocation,
            //                 FAVOURITE: "N",
            //                 Default: Default
            //             }
            //             updatedArray.push(updatedDetails);
            //         }
            //         if (sLine) {
            //             updatedDetails = {
            //                 Field: Field2,
            //                 FieldCenter: (1).toString(),
            //                 Value: sLine,
            //                 FAVOURITE: "N",
            //                 Default: Default
            //             }
            //             updatedArray.push(updatedDetails);
            //         }

            //         for (var j = 0; j < updatedArray.length; j++) {
            //             updatedArray[j].ID = VariantId;
            //             updatedArray[j].IDNAME = VariantName;
            //             updatedArray[j].App_Name = "Restrictions Capacity"
            //         }


            //         this.getView().getModel("BModel").callFunction("/createVariant", {
            //             method: "GET",
            //             urlParameters: {
            //                 Flag: "E",
            //                 USER: that.oGModel.getProperty("/UserId"),
            //                 VARDATA: JSON.stringify(updatedArray)
            //             },
            //             success: function (oData) {
            //                 that.oGModel.setProperty("/newVariant", oData.results);
            //                 that.oGModel.setProperty("/newVaraintFlag", "X");
            //                 that.onAfterRendering();
            //                 that._popOver.close();
            //                 that.byId("idDropDown").setPressed(false);
            //             },
            //             error: function (error) {

            //                 MessageToast.show("Failed to update variant");
            //             },
            //         });
            //     } else {
            //         MessageToast.show("Please fill View Name");
            //     }
            // },
            // /**
            // * Checking if view name already exists
            // * @param {*} oEvent 
            // */
            // checkName: function (oEvent) {
            //     var sQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue");
            //     var uniqueNames = that.oGModel.getProperty("/viewNames");
            //     for (var i = 0; i < uniqueNames.length; i++) {
            //         if (sQuery === uniqueNames[i].VARIANTNAME) {
            //             sap.ui.getCore().byId("idInputRC").setValueState("Error");
            //             break;
            //         } else {
            //             sap.ui.getCore().byId("idInputRC").setValueState("None");
            //             sap.ui.getCore().byId("idSaveBtnRC").setEnabled(true);
            //         }
            //     }
            //     if (sap.ui.getCore().byId("idInputRC").getValueState() === "Error") {
            //         sap.ui.getCore().byId("idSaveBtnRC").setEnabled(false);
            //     }
            // },
            // deleteVariant: function () {
            //     that.getView().getModel("BModel").callFunction("/createVariant", {
            //         method: "GET",
            //         urlParameters: {
            //             Flag: "D",
            //             USER: that.oGModel.getProperty("/UserId"),
            //             VARDATA: JSON.stringify(that.deletedArray)
            //         },
            //         success: function (oData) {
            //             MessageToast.show("Succesfully deleted");
            //             that.deletedArray = [];
            //         },
            //         error: function (error) {
            //             sap.ui.core.BusyIndicator.hide();
            //             MessageToast.show("Failed to delete variant");
            //         },
            //     });
            // },

            tableRowsUpdated: function () {
                sap.ui.core.BusyIndicator.hide();
            },
            // getUser: function () {
            //     let vUser;
            //     if (sap.ushell.Container) {
            //         let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            //         vUser = (email) ? email : "";
            //     }
            //     return vUser;
            // },
            // skip and top func functions starts from here





            getCalenderWeek: function () {
                var topCount = that.getOwnerComponent().getModel("oGModel").getProperty("/MaxCount");
                that.getOwnerComponent().getModel("BModel").read("/getIBPCalenderWeek", {
                    urlParameters: {
                        "$skip": that.skip,
                        "$top": topCount
                    },
                    success: function (aData) {
                        if (topCount == aData.results.length) {
                            that.skip += parseInt(topCount);
                            that.prod = that.prod.concat(aData.results);
                            that.getCalenderWeek();
                        }
                        else {
                            that.skip = 0;
                            that.prod = that.prod.concat(aData.results);
                            that.oGModel.setProperty("/CalenderWeek", that.prod);
                            that.prod = []
                        }
                    },
                    error: function () {
                        MessageToast.show("Failed to get data");
                    }
                })
            },
             normalizeVariantItems: function (aVariants) {
                return aVariants.map(function (v) {
                    return {
                        ...v,

                        key: String(v.VARIANTID),
                        title: v.VARIANTNAME,
                        author: v.USER || "SAP",
                        visible: true,
                        sharing: v.SCOPE === "Public"
                            ? sap.m.SharingMode.Public
                            : sap.m.SharingMode.Private,
                        remove: !!v.REMOVE,
                        changeable: !!v.CHANGE,
                        enabled: v.ENABLE !== false
                    };
                });
            },
            saveDefaultVariant: function () {
                sap.ui.core.BusyIndicator.show();
                var array = [];
                var details = {};
                var sLocation = that.byId("idlocRC").getValue();
                var Field1 = that.byId("idlocRC").getParent().mAggregations.content[0].getText()
                var sLine = that.byId("idLineRC").getValue();
                var Field2 = that.byId("idLineRC").getParent().mAggregations.content[0].getText()

                if (!sLocation && !sLine === 0) {
                    sap.ui.core.BusyIndicator.hide();
                    return MessageToast.show("No values selected in filters Configurable Product,Demand Location & Customer Group")
                }


                if (sLocation) {
                    details = {
                        Field: Field1,
                        FieldCenter: (1).toString(),
                        Value: sLocation
                    }
                    array.push(details);
                }
                if (sLine) {
                    details = {
                        Field: Field2,
                        FieldCenter: (1).toString(),
                        Value: sLine
                    }
                    array.push(details);
                }

                var flag = "N";
                for (var j = 0; j < array.length; j++) {

                    array[j].IDNAME = "defaultSingle";
                    array[j].App_Name = "DefaultSingle";
                    array[j].SCOPE = "Global";

                }
                //    console.log(JSON.stringify(array));
                this.getOwnerComponent().getModel("BModel").callFunction("/createVariant", {
                    method: "GET",
                    urlParameters: {
                        Flag: flag,
                        USER: (that.oGModel.getProperty("/UserId")),
                        VARDATA: JSON.stringify(array)
                    },
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();

                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to create variant");
                    },
                });


            }
        });
    });