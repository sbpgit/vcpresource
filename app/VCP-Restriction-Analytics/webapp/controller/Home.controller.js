sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
],
    function (Controller, Filter, FilterOperator, Spreadsheet, BusyIndicator, JSONModel, formatter) {
        "use strict";
        var that;
        return Controller.extend("vcpapp.vcpvendergoodcapacity.controller.Home", {
            formatter: formatter,
            onInit: function () {
                that = this;
                that.viewDetails = new JSONModel();
                that.viewDetails.setSizeLimit(5000);
                that.variantModel = new JSONModel();
                that.variantModel.setSizeLimit(5000);
                that.oModel = that.getOwnerComponent().getModel("oModel");
                that.getView().setModel(that.oModel);
                this.smartFilterBar = that.getView().byId("smartFilterBarRLA");

            },
            //onAfterRendering fun Starts
            onAfterRendering: function () {
                that.oGModel = that.getOwnerComponent().getModel("oGModel");
                if (!this.popOverDialog) {
                    this.popOverDialog = sap.ui.xmlfragment("vcpapp.vcpvendergoodcapacity.fragments.popOver", that);
                    that.getView().addDependent(that.popOverDialog);
                }
                var oResults = {};
                var oCModel = that.getOwnerComponent().getModel("oCModel");
                oCModel.callFunction("/getGlobalPlanningConfig", {
                    method: "GET",
                    success: function (oData, oResponse) {
                        if (oData.getGlobalPlanningConfig) {
                            var oFilterDataNew = {};
                            oResults = JSON.parse(oData.getGlobalPlanningConfig);
                            var aTokenItemsVer = oResults.IBPVERSION ? [{
                                key: oResults.IBPVERSION,
                                text: oResults.IBPVERSION
                            }] : [];
                            that.oGModel.setProperty("/defaultVersion", aTokenItemsVer);
                            var aTokenItemsScen = oResults.IBPSCENARIO ? [{
                                key: oResults.IBPSCENARIO,
                                text: oResults.IBPSCENARIO
                            }] : [];
                            that.oGModel.setProperty("/defaultScenario", aTokenItemsScen);
                            oFilterDataNew.VERSION = {
                                items: aTokenItemsVer
                            };

                            oFilterDataNew.SCENARIO = {
                                items: aTokenItemsScen
                            };
                            var oSmartFilterBar = that.byId("smartFilterBarRLA");
                            oSmartFilterBar.setFilterDataAsString(JSON.stringify(oFilterDataNew));
                            oSmartFilterBar.search();
                        }
                    },
                    error: function (oResponse) {
                        sap.m.MessageToast.show("Failed to get planning config, please try later!");
                    },
                });
                that.getVariantData();
            },
            getFilters: function () {
                var aTableFilters = this.smartFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                    var oControl = oFilterGroupItem.getControl();
                    var aSelectedKeys = (oControl && oControl.getTokens()) ? oControl.getTokens() : [];
                    var aFilters = aSelectedKeys.map(function (sSelectedKey) {
                        return new Filter({
                            path: oFilterGroupItem.getName(),
                            operator: FilterOperator.EQ,
                            value1: sSelectedKey.getKey()
                        });
                    });
                    if (aSelectedKeys.length > 0) {
                        aResult.push(new Filter({
                            filters: aFilters,
                            and: false
                        }));
                    }
                    return aResult;
                }, []);

                // Add the additional filter for DIFF_QTY > 0
                var oDiffQtyFilter = new Filter({
                    path: "DIFF_QTY",
                    operator: FilterOperator.GT,
                    value1: 0
                });
                aTableFilters.push(oDiffQtyFilter);

                return aTableFilters;
            },
            onInitPopOver: function () {
                var oSmartChart = sap.ui.getCore().byId("idPopoverSmartChartRLA");

                // Use getChartAsync to ensure the chart instance is available
                oSmartChart.getChartAsync().then(function (oChart) {
                    // Set the chart's Viz properties
                    oChart.setVizProperties({
                        plotArea: {
                            dataLabel: {
                                visible: true
                            }
                        }
                    });

                    // Get the binding info for the chart's data
                    var oBindingParams = oChart.getBindingInfo("data");
                    var aFilters = oBindingParams.filters || [];

                    // Create filters for DIFF_QTY > 0 and RTR_CAP > 0
                    var oFilter1 = new sap.ui.model.Filter("DIFF_QTY", sap.ui.model.FilterOperator.GT, 0);
                    var oFilter2 = new sap.ui.model.Filter("RTR_CAP", sap.ui.model.FilterOperator.GT, 0);

                    // Combine the filters with an AND condition
                    aFilters.push(new sap.ui.model.Filter({
                        filters: [oFilter1, oFilter2],
                        and: true
                    }));

                    // Rebind the data with the new filters
                    oBindingParams.filters = aFilters;
                    oChart.bindData(oBindingParams);
                }).catch(function (oError) {
                    // Handle any errors
                    console.error("Error accessing chart: ", oError);
                });
            },
            onChartInitialized: function (event) {
                var oSmartChart = event.getSource();
                 if(oSmartChart.getChart()){
                    oSmartChart.getChart().mAggregations.measures[0].mProperties.label = "Resource Quantity"
                    oSmartChart.getChart().mAggregations.measures[1].mProperties.label = "Sales Order Quantity"
                    oSmartChart.getChart().mAggregations.measures[2].mProperties.label = "Resource Capacity"
                    oSmartChart.getChart().mAggregations.measures[3].mProperties.label = "Open Resource Quantity"
                    oSmartChart.getChart().mAggregations.measures[4].mProperties.label = "Resource Exceeded By"

                }
                oSmartChart.getChartAsync().then(function (oChart) {
                    oChart.setVizProperties({
                        plotArea: {
                            dataLabel: {
                                visible: true
                            },
                            dataShape: {
                                primaryAxis: ["bar", "bar", "line"]
                            },
                            
                        }
                    });
                }).catch(function (oError) {
                    // Handle any errors
                    console.error("Error accessing chart: ", oError);
                });
            },
            onLiveSearch: function () {
                that.onInitPopOver()
            },
            onRtrAlert: function (params) {
                var oButton = params.getSource();
                this.popOverDialog.openBy(oButton);
            },
            onExport: function () {
                BusyIndicator.show();
                var aFilters = that.getFilters(),
                    sTable = this.getView().byId("smartTableRLA"),
                    oBinding = sTable.getTable().getBinding("rows"),
                    aOriginalFilters = oBinding.aFilters.slice();
                that.oModel.read("/getVendedCapacity", {
                    filters: aFilters,
                    success: function (oData) {
                        BusyIndicator.hide();
                        that._convertToExcel(oData.results);
                    },
                    error: function (oError) {
                        console.error("Error fetching data for export:", oError);
                    }
                });
                // Restore original filters after a delay
                setTimeout(function () {
                    oBinding.filter([]);
                    oBinding.refresh();
                    oBinding.filter(aOriginalFilters);
                    oBinding.refresh();
                }, 1000);
            },
            _convertToExcel: function (aData) {
                var sFileName = "Resource-Analytic-Report";
                var aCols = [
                    { label: "Line Description", property: "LINE_DESC" },
                    { label: "Resource Description", property: "RTR_DESC" },
                    { label: "Model Version", property: "MODEL_VERSION" },
                    { label: "Version Name", property: "VERSION_NAME" },
                    { label: "Scenario Name", property: "SCENARIO_NAME" },
                    { label: "Week Date", property: "WEEK_DATE" },
                    { label: "Sales Order Quantity", property: "ORD_QTY" },
                    { label: "Resource Capacity", property: "RTR_CAP" },
                    { label: "Resource Quantity", property: "PLANNED_QTY" },
                    { label: "Difference Quantity", property: "DIFF_QTY" },
                    { label: "Open Resource Quantity", property: "OPEN_RTR_QTY" }
                ];
                var oSettings = {
                    workbook: {
                        columns: aCols,
                        context: {
                            sheetName: 'Resource Likelihood'
                        }
                    },
                    dataSource: aData,  // Use the data fetched from the OData service
                    fileName: sFileName,
                    worker: true  // Use worker for handling large data
                };
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        // Add any specific action after the export
                    })
                    .catch(function (error) {
                        console.error("Error during export:", error);
                    })
                    .finally(function () {
                        // Properly destroy the spreadsheet object
                        oSheet.destroy();
                    });
            },
            onSelectChartItem: function (event) {
                var selectedDataPoints = event.getSource().getSelectedDataPoints().dataPoints;
                var filters = [];
                selectedDataPoints.forEach(el => {
                    var urlPath = el.context.sPath;
                    var jsonPart = urlPath.substring(urlPath.indexOf("'") + 1, urlPath.lastIndexOf("'"));
                    var json = JSON.parse(decodeURIComponent(jsonPart));
                    var fieldNames = Object.keys(json.key);
                    var fieldValues = Object.values(json.key);
                    for (var i = 0; i < fieldNames.length; i++) {
                        var fieldName = fieldNames[i];
                        var value = fieldValues[i];
                        value = value.replace(/^['"]|['"]$/g, '');
                        if (fieldName === "WEEK_DATE") {
                            var matches = value.match(/\((\d+)\)/);
                            var unixTimestamp = parseInt(matches[1]);
                            var dateObject = new Date(unixTimestamp);
                            var year = dateObject.getFullYear();
                            var month = String(dateObject.getMonth() + 1).padStart(2, '0');
                            var day = String(dateObject.getDate()).padStart(2, '0');
                            value = year + '-' + month + '-' + day;
                        }
                        var oFilter = new Filter({
                            path: fieldName,
                            operator: FilterOperator.EQ,
                            value1: value
                        });
                        filters.push(oFilter);
                    }
                });
                this.byId("smartTableRLA").getTable().getBinding("rows").filter(filters);
            },
            getUser: function () {
                let vUser;
                if (sap.ushell.Container) {
                    let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                    vUser = (email) ? email : "";
                }
                return vUser;
            },    /*Getting variant view data*/
            getVariantData: function () {
                var ndData = [];
                var dData = [], uniqueName = [];
                that.uniqueName = [];
                sap.ui.core.BusyIndicator.show();
                var variantUser = that.getUser();
                variantUser = variantUser?.toLowerCase();
                // var variantUser = "pradeepkumardaka@sbpcorp.in";
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                that.oGModel.setProperty("/UserId", variantUser);
                // Define the filters
                var oFilterAppName1 = new sap.ui.model.Filter("APPLICATION_NAME", sap.ui.model.FilterOperator.EQ, appName);
                var oFilterUser = new sap.ui.model.Filter("USER", sap.ui.model.FilterOperator.EQ, variantUser);

                var oFilterAppName2 = new sap.ui.model.Filter("APPLICATION_NAME", sap.ui.model.FilterOperator.EQ, appName);
                var oFilterScope = new sap.ui.model.Filter("SCOPE", sap.ui.model.FilterOperator.EQ, "Public");

                var oFilterAppName3 = new sap.ui.model.Filter("APPLICATION_NAME", sap.ui.model.FilterOperator.EQ, 'DefaultMulti');
                var oFilterUser1 = new sap.ui.model.Filter("USER", sap.ui.model.FilterOperator.EQ, variantUser);

                var oFilterCondition3 = new sap.ui.model.Filter({
                    filters: [oFilterAppName3, oFilterUser1],
                    and: true // Combine with AND
                });


                var oFilterCondition1 = new sap.ui.model.Filter({
                    filters: [oFilterAppName1, oFilterUser],
                    and: true // Combine with AND
                });

                var oFilterCondition2 = new sap.ui.model.Filter({
                    filters: [oFilterAppName2, oFilterScope],
                    and: true // Combine with AND
                });
                var oFinalFilter = new sap.ui.model.Filter({
                    filters: [oFilterCondition1, oFilterCondition2, oFilterCondition3],
                    and: false // Combine with OR
                });

                //   this.getView().getModel("oModel").read("/getVariantHeader", {
                that.getOwnerComponent().getModel("oCModel").read("/getVariantHeader", {
                    filters: [oFinalFilter],
                    success: function (oData) {
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
                                "SCOPE": sap.m.SharingMode.Public
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            that.oGModel.setProperty("/defaultDetails", "");
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            that.byId("idMatList123RLA").setModel(that.viewDetails);
                            that.UniqueDefKey = uniqueName[0].VARIANTID;
                            that.byId("idMatList123RLA").setDefaultKey(uniqueName[0].VARIANTID);
                            that.byId("idMatList123RLA").setSelectedKey(uniqueName[0].VARIANTID);
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
                                    that.byId("idMatList123RLA").setDefaultKey((oData.results[i].VARIANTID));
                                    that.byId("idMatList123RLA").setSelectedKey((oData.results[i].VARIANTID))
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
                        sap.m.MessageToast.show("error while loading variant details");
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
                this.getOwnerComponent().getModel("oCModel").read("/getVariant", {
                    filters: [oFilters],
                    success: function (oData) {
                        that.oGModel.setProperty("/fieldDetails", oData.results);
                        var variantNewData = oData.results;
                        aData = variantNewData.map(item1 => {
                            const item2 = headerData.find(item2 => item2.VARIANTID === item1.VARIANTID);
                            return item2 ? { ...item1, ...item2 } : { ...item1 };
                        });
                        aData = aData.map(item => ({
                            ...item,
                            SCOPE: item.SCOPE === "Public" ? sap.m.SharingMode.Public : sap.m.SharingMode.Private
                        }));
                        that.oGModel.setProperty("/variantDetails", aData);
                        if (aData.length > 0) {
                            aData = aData.filter(id => id.VARIANTNAME !== "defaultMulti" && id.APPLICATION_NAME !== "DefaultMulti")
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
                                "SCOPE": sap.m.SharingMode.Public
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            that.variantModel.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            that.oGModel.setProperty("/defaultDetails", defaultDetails);
                            that.byId("idMatList123RLA").setModel(that.variantModel);
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                if (newVariant[0].DEFAULT === "Y") {
                                    that.UniqueDefKey = newVariant[0].VARIANTID;
                                    that.byId("idMatList123RLA").setDefaultKey((newVariant[0].VARIANTID));
                                }
                                that.byId("idMatList123RLA").setSelectedKey((newVariant[0].VARIANTID))
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
                                "SCOPE": sap.m.SharingMode.Public
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            that.oGModel.setProperty("/defaultDetails", "");

                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            that.byId("idMatList123RLA").setModel(that.viewDetails);
                            var Default = "Standard";
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                if (newVariant[0].DEFAULT === "Y") {
                                    that.UniqueDefKey = newVariant[0].VARIANTID;
                                    that.byId("idMatList123RLA").setDefaultKey((newVariant[0].VARIANTID));
                                }
                                that.byId("idMatList123RLA").setSelectedKey((newVariant[0].VARIANTID))
                                that.oGModel.setProperty("/newVaraintFlag", "");
                            } else {
                                that.UniqueDefKey = uniqueName[0].VARIANTID;
                                that.byId("idMatList123RLA").setDefaultKey((uniqueName[0].VARIANTID));
                                that.byId("idMatList123RLA").setSelectedKey((uniqueName[0].VARIANTID));
                                that.handleSelectPress(Default);
                            }
                        }

                    },
                    error: function (oData, error) {
                        sap.ui.core.BusyIndicator.hide()
                        sap.m.MessageToast.show("error while loading variant details");
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
                var oTokens = {}, oFilterData = {};
                that.finaloTokens = [];
                var oTableItems = that.oGModel.getProperty("/variantDetails");
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                that.byId("idMatList123RLA").setModified(false);
                that.oGModel.setProperty("/defaultLocation", []);
                that.oGModel.setProperty("/defaultProduct", []);
                that.oGModel.setProperty("/defaultLine", []);
                that.oGModel.setProperty("/defaultRest", []);
                that.oGModel.setProperty("/defaultVersion", []);
                that.oGModel.setProperty("/defaultScenario", []);


                if (that.oGModel.getProperty("/fromFunction") === "X") {
                    that.oGModel.setProperty("/fromFunction", "");
                    that.selectedApp = oEvent;
                    that.oGModel.setProperty("/variantName", that.selectedApp);
                } else {
                    that.selectedApp = oEvent.getSource().getTitle().getText();
                    that.oGModel.setProperty("/variantName", that.selectedApp);
                }
                if (that.selectedApp !== "Standard") {
                    var oFiltersClear = that.byId("smartFilterBarRLA");
                    oFiltersClear.clear();
                    var filteredData = oTableItems.filter(a => a.VARIANTNAME === that.selectedApp && (a.APPLICATION_NAME === appName))
                    var locData, prodData, lineData, rtrDesc, sVersion, sScenario;
                    locData = filteredData.filter(a => a.FIELD.includes("Location"));
                    prodData = filteredData.filter(a => a.FIELD.includes("Product"));
                    lineData = filteredData.filter(a => a.FIELD.includes("Line"));
                    rtrDesc = filteredData.filter(a => a.FIELD.includes("Restriction"));
                    sVersion = filteredData.filter(a => a.FIELD === "Version");
                    sScenario = filteredData.filter(a => a.FIELD.includes("Scenario"));

                    if (locData.length > 0) {
                        let aLocValues = locData.map(item => item.VALUE);
                        var aTokenItems = aLocValues.map(function (sVal) {
                            return { key: sVal, text: sVal };
                        })
                        that.oGModel.setProperty("/defaultLocation", aTokenItems);
                        // Set tokens via setFilterDataAsString
                        oFilterData.LOCATION_ID = {
                            items: aTokenItems
                        };
                        for (var i = 0; i < locData.length; i++) {
                            oTokens = {
                                FIELD: locData[i].FIELD,
                                VALUE: locData[i].VALUE
                            }
                            that.finaloTokens.push(oTokens);
                            oTokens = {};
                        }
                    }

                    if (prodData.length > 0) {
                        let aProdValues = prodData.map(item => item.VALUE);
                        var aProdItems = aProdValues.map(function (sVal) {
                            return { key: sVal, text: sVal };
                        });
                        that.oGModel.setProperty("/defaultProduct", aProdItems);
                        // Set tokens via setFilterDataAsString
                        oFilterData.PRODUCT_ID = {
                            items: aProdItems
                        };
                        for (var i = 0; i < prodData.length; i++) {
                            oTokens = {
                                FIELD: prodData[i].FIELD,
                                VALUE: prodData[i].VALUE
                            }
                            that.finaloTokens.push(oTokens);
                            oTokens = {};
                        }
                    }
                    if (lineData.length > 0) {
                        let aLine = lineData.map(item => item.VALUE);
                        var aTokenItems = aLine.map(function (sVal) {
                            return { key: sVal, text: sVal };
                        });
                        that.oGModel.setProperty("/defaultLine", aTokenItems);
                        oFilterData.LINE_ID = {
                            items: aTokenItems
                        };
                        for (var i = 0; i < lineData.length; i++) {
                            oTokens = {
                                FIELD: lineData[i].FIELD,
                                VALUE: lineData[i].VALUE
                            }
                            that.finaloTokens.push(oTokens);
                            oTokens = {};
                        }
                    }
                    if (rtrDesc.length > 0) {
                        let aRest = rtrDesc.map(item => item.VALUE);
                        var aTokenItems = aRest.map(function (sVal) {
                            return { key: sVal, text: sVal };
                        });
                        that.oGModel.setProperty("/defaultRest", aTokenItems);
                        oFilterData.RESTRICTION = {
                            items: aTokenItems
                        };
                        for (var i = 0; i < rtrDesc.length; i++) {
                            oTokens = {
                                FIELD: rtrDesc[i].FIELD,
                                VALUE: rtrDesc[i].VALUE
                            }
                            that.finaloTokens.push(oTokens);
                            oTokens = {};
                        }
                    }
                    if (sVersion.length > 0) {
                        let aVersion = sVersion.map(item => item.VALUE);
                        var aTokenItems = aVersion.map(function (sVal) {
                            return { key: sVal, text: sVal };
                        });
                        that.oGModel.setProperty("/defaultVersion", aTokenItems);
                        oFilterData.VERSION = {
                            items: aTokenItems
                        };
                        for (var i = 0; i < sVersion.length; i++) {
                            oTokens = {
                                FIELD: sVersion[i].FIELD,
                                VALUE: sVersion[i].VALUE
                            }
                            that.finaloTokens.push(oTokens);
                            oTokens = {};
                        }
                    }
                    if (sScenario.length > 0) {
                        let aScenario = sScenario.map(item => item.VALUE);
                        var aTokenItems = aScenario.map(function (sVal) {
                            return { key: sVal, text: sVal };
                        });
                        that.oGModel.setProperty("/defaultScenario", aTokenItems);
                        oFilterData.SCENARIO = {
                            items: aTokenItems
                        };
                        for (var i = 0; i < sScenario.length; i++) {
                            oTokens = {
                                FIELD: sScenario[i].FIELD,
                                VALUE: sScenario[i].VALUE
                            }
                            that.finaloTokens.push(oTokens);
                            oTokens = {};
                        }
                    }
                    var oSmartFilterBar = that.byId("smartFilterBarRLA");
                    oSmartFilterBar.setFilterDataAsString(JSON.stringify(oFilterData));
                    oSmartFilterBar.search();

                    sap.ui.core.BusyIndicator.hide();
                } else {
                    //     let headerDetails = that.oGModel.getProperty("/headerDetails").filter(id => id.APPLICATION_NAME == "DefaultMulti" && id.VARIANTNAME == "defaultMulti");
                    //     if (headerDetails.length > 0) {
                    //         var oFiltersClear = that.byId("smartFilterBarRLA");
                    // oFiltersClear.clear();
                    //         var filteredData = that.oGModel.getProperty("/fieldDetails").filter(id=>id.VARIANTID == headerDetails[0].VARIANTID);
                    //         var locData, prodData, lineData, rtrDesc, sVersion, sScenario;
                    //         locData = filteredData.filter(a => a.FIELD.includes("Manufacturing Location"));
                    //         prodData = filteredData.filter(a => a.FIELD.includes("Config Product"));
                    //         lineData = filteredData.filter(a => a.FIELD.includes("Line Description"));
                    //         rtrDesc = filteredData.filter(a => a.FIELD.includes("Restriction Description"));
                    //         sVersion = filteredData.filter(a => a.FIELD ==="Version");
                    //         sScenario = filteredData.filter(a => a.FIELD.includes("Scenario"));

                    //         if (locData.length > 0) {
                    //             let aLocValues = locData.map(item => item.VALUE);
                    //             var aTokenItems = aLocValues.map(function (sVal) {
                    //                 return { key: sVal, text: sVal };
                    //             })
                    //             that.oGModel.setProperty("/defaultLocation", aTokenItems);
                    //             // Set tokens via setFilterDataAsString
                    //             oFilterData.LOCATION_ID = {
                    //                 items: aTokenItems
                    //             };
                    //             for (var i = 0; i < locData.length; i++) {
                    //                 oTokens = {
                    //                     FIELD: locData[i].FIELD,
                    //                     VALUE: locData[i].VALUE
                    //                 }
                    //                 that.finaloTokens.push(oTokens);
                    //                 oTokens = {};
                    //             }
                    //         }

                    //         if (prodData.length > 0) {
                    //             let aProdValues = prodData.map(item => item.VALUE);
                    //             var aProdItems = aProdValues.map(function (sVal) {
                    //                 return { key: sVal, text: sVal };
                    //             });
                    //             that.oGModel.setProperty("/defaultProduct", aProdItems);
                    //             // Set tokens via setFilterDataAsString
                    //             oFilterData.PRODUCT_ID = {
                    //                 items: aProdItems
                    //             };
                    //             for (var i = 0; i < prodData.length; i++) {
                    //                 oTokens = {
                    //                     FIELD: prodData[i].FIELD,
                    //                     VALUE: prodData[i].VALUE
                    //                 }
                    //                 that.finaloTokens.push(oTokens);
                    //                 oTokens = {};
                    //             }
                    //         }
                    //         if (lineData.length > 0) {
                    //             let aLine = lineData.map(item => item.VALUE);
                    //             var aTokenItems = aLine.map(function (sVal) {
                    //                 return { key: sVal, text: sVal };
                    //             });
                    //             that.oGModel.setProperty("/defaultLine", aTokenItems);
                    //             oFilterData.LINE_ID = {
                    //                 items: aTokenItems
                    //             };
                    //             for (var i = 0; i < lineData.length; i++) {
                    //                 oTokens = {
                    //                     FIELD: lineData[i].FIELD,
                    //                     VALUE: lineData[i].VALUE
                    //                 }
                    //                 that.finaloTokens.push(oTokens);
                    //                 oTokens = {};
                    //             }
                    //         }
                    //         if (rtrDesc.length > 0) {
                    //             let aRest = rtrDesc.map(item => item.VALUE);
                    //             var aTokenItems = aRest.map(function (sVal) {
                    //                 return { key: sVal, text: sVal };
                    //             });
                    //             that.oGModel.setProperty("/defaultRest", aTokenItems);
                    //             oFilterData.RESTRICTION = {
                    //                 items: aTokenItems
                    //             };
                    //             for (var i = 0; i < rtrDesc.length; i++) {
                    //                 oTokens = {
                    //                     FIELD: rtrDesc[i].FIELD,
                    //                     VALUE: rtrDesc[i].VALUE
                    //                 }
                    //                 that.finaloTokens.push(oTokens);
                    //                 oTokens = {};
                    //             }
                    //         }
                    //         if (sVersion.length > 0) {
                    //             let aVersion = sVersion.map(item => item.VALUE);
                    //             var aTokenItems = aVersion.map(function (sVal) {
                    //                 return { key: sVal, text: sVal };
                    //             });
                    //             that.oGModel.setProperty("/defaultVersion", aTokenItems);
                    //             oFilterData.VERSION = {
                    //                 items: aTokenItems
                    //             };
                    //             for (var i = 0; i < sVersion.length; i++) {
                    //                 oTokens = {
                    //                     FIELD: sVersion[i].FIELD,
                    //                     VALUE: sVersion[i].VALUE
                    //                 }
                    //                 that.finaloTokens.push(oTokens);
                    //                 oTokens = {};
                    //             }
                    //         }
                    //         if (sScenario.length > 0) {
                    //             let aScenario = sScenario.map(item => item.VALUE);
                    //             var aTokenItems = aScenario.map(function (sVal) {
                    //                 return { key: sVal, text: sVal };
                    //             });
                    //             that.oGModel.setProperty("/defaultScenario", aTokenItems);
                    //             oFilterData.SCENARIO = {
                    //                 items: aTokenItems
                    //             };
                    //             for (var i = 0; i < sScenario.length; i++) {
                    //                 oTokens = {
                    //                     FIELD: sScenario[i].FIELD,
                    //                     VALUE: sScenario[i].VALUE
                    //                 }
                    //                 that.finaloTokens.push(oTokens);
                    //                 oTokens = {};
                    //             }
                    //         }
                    //         var oSmartFilterBar = that.byId("smartFilterBarRLA");
                    //         oSmartFilterBar.setFilterDataAsString(JSON.stringify(oFilterData));
                    //         oSmartFilterBar.search();
                    //     }
                    //     //do nothing
                    //     else {
                        var oFilterDataNew={};
                    var oFiltersClear = that.byId("smartFilterBarRLA");
                    var version = that.oGModel.getProperty("/defaultVersion");
                    var scenario = that.oGModel.getProperty("/defaultScenario");
                    oFilterDataNew.VERSION = {
                        items: version
                    };

                    oFilterDataNew.SCENARIO = {
                        items: scenario
                    };
                    oFiltersClear.setFilterDataAsString(JSON.stringify(oFilterDataNew));
                    // oSmartFilterBar.search();
                    // oFiltersClear.clear();
                    setTimeout(function () {
                        oFiltersClear.search();
                    }, 100);
                    // }

                    sap.ui.core.BusyIndicator.hide();
                }
            },
            onFilterChange: function (oEvent) {
                if (oEvent === undefined) {
                    return false;
                }
                var count = 0;
                var oSmartFilterBar = this.getView().byId("smartFilterBarRLA");
                var filterData = oSmartFilterBar.getFilterData();
                if (filterData !== null) {
                    if (Object.keys(filterData).length) {
                        var oLabelName = Object.keys(filterData);
                        for (let index = 0; index < oLabelName.length; index++) {
                            const element = oLabelName[index];
                            if (element === "LOCATION_ID") {
                                var filteredLocData = filterData['LOCATION_ID']['items'];
                                var defaultLocData = that.oGModel.getProperty("/defaultLocation");
                                var locResults = that.areArraysEqualSorted(filteredLocData, defaultLocData);
                                if (locResults === false) {
                                    that.byId("idMatList123RLA").setModified(true);
                                }
                                else {
                                    count++
                                }
                            }
                            else if (element === "PRODUCT_ID") {
                                var filteredProdData = filterData['PRODUCT_ID']['items'];
                                var defaultProdData = that.oGModel.getProperty("/defaultProduct");
                                var prodResults = that.areArraysEqualSorted(filteredProdData, defaultProdData);
                                if (prodResults === false) {
                                    that.byId("idMatList123RLA").setModified(true);
                                }
                                else {
                                    count++
                                }
                            }
                            else if (element === "LINE_ID") {
                                var filteredLineData = filterData['LINE_ID']['items'];
                                var defaultLineData = that.oGModel.getProperty("/defaultLine");
                                var lineResults = that.areArraysEqualSorted(filteredLineData, defaultLineData);
                                if (lineResults === false) {
                                    that.byId("idMatList123RLA").setModified(true);
                                }
                                else {
                                    count++
                                }
                            }
                            else if (element === "RESTRICTION") {
                                var filteredRestData = filterData['RESTRICTION']['items'];
                                var defaultRestData = that.oGModel.getProperty("/defaultRest");
                                var restResults = that.areArraysEqualSorted(filteredRestData, defaultRestData);
                                if (restResults === false) {
                                    that.byId("idMatList123RLA").setModified(true);
                                }
                                else {
                                    count++
                                }
                            }
                            else if (element === "VERSION") {
                                var filteredVersdData = filterData['VERSION']['items'];
                                var defaultVersioData = that.oGModel.getProperty("/defaultVersion");
                                var versionResults = that.areArraysEqualSorted(filteredVersdData, defaultVersioData);
                                if (versionResults === false) {
                                    that.byId("idMatList123RLA").setModified(true);
                                }
                                else {
                                    count++
                                }
                            }
                            else if (element === "SCENARIO") {
                                var filteredScenData = filterData['SCENARIO']['items'];
                                var defaultScenarioData = that.oGModel.getProperty("/defaultScenario");
                                var scenarioResults = that.areArraysEqualSorted(filteredScenData, defaultScenarioData);
                                if (scenarioResults === false) {
                                    that.byId("idMatList123RLA").setModified(true);
                                }
                                else {
                                    count++
                                }
                            }
                        }
                        if (count === oLabelName.length) {
                            that.byId("idMatList123RLA").setModified(false);
                        }
                    }
                    // if(oEvent.getParameters().sId == "change"){
                    // that.saveDefaultVariant();
                    // }
                }
            },
            // * Saving the VIEW on press of save in NameVariant fragment
            // * @param {*} oEvent 
            // */
            onCreate: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var array = [];
                var details = {};
                let oSmartFilterBar = this.getView().byId("smartFilterBarRLA");
                var sLocation = oSmartFilterBar.getFilterData()["LOCATION_ID"];
                var Field1 = "Location Description";
                var sProduct = oSmartFilterBar.getFilterData()["PRODUCT_ID"];
                var Field2 = "Product Description";
                var sLine = oSmartFilterBar.getFilterData()["LINE_ID"];
                var Field3 = "Line Description";
                var sRest = oSmartFilterBar.getFilterData()["RESTRICTION"];
                var Field4 = "Resource Description";
                var sVersion = oSmartFilterBar.getFilterData()["VERSION"];
                var Field5 = "Version";
                var sScenario = oSmartFilterBar.getFilterData()["SCENARIO"];
                var Field6 = "Scenario";

                var varName = oEvent.getParameters().name;
                var sDefault = oEvent.getParameters().def;
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                if (!sLocation && !sProduct && !sLine && !sRest && !sVersion && !sScenario) {
                    sap.ui.core.BusyIndicator.hide();
                    return sap.m.MessageToast.show("No values selected in filters Config Product,Factory Location, Assembly, Version & Scenario")
                }

                if (varName) {
                    if (sDefault && that.oGModel.getProperty("/defaultDetails").length > 0) {
                        var defaultChecked = "Y";
                        this.getOwnerComponent().getModel("oCModel").callFunction("/updateVariant", {
                            method: "GET",
                            urlParameters: {
                                VARDATA: JSON.stringify(that.oGModel.getProperty("/defaultDetails"))
                            },
                            success: function (oData) {
                            },
                            error: function (error) {
                                sap.m.MessageToast.show("Failed to create variant");
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
                        for (var s = 0; s < sLocation.items.length; s++) {
                            details = {
                                Field: Field1,
                                FieldCenter: sLocation.items[s].key, //sLocation[s].getKey(),
                                Value: sLocation.items[s].text,
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
                    }
                    if (sProduct) {
                        for (var s = 0; s < sProduct.items.length; s++) {
                            details = {
                                Field: Field2,
                                FieldCenter: sProduct.items[s].key, //getKey(),
                                Value: sProduct.items[s].text,
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
                    }
                    if (sLine) {
                        for (var s = 0; s < sLine.items.length; s++) {
                            details = {
                                Field: Field3,
                                FieldCenter: sLine.items[s].key,
                                Value: sLine.items[s].text,
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
                    }
                    if (sRest) {
                        for (var s = 0; s < sRest.items.length; s++) {
                            details = {
                                Field: Field4,
                                FieldCenter: sRest.items[s].key,
                                Value: sRest.items[s].text,
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
                    }
                    if (sVersion) {
                        for (var s = 0; s < sVersion.items.length; s++) {
                            details = {
                                Field: Field5,
                                FieldCenter: sVersion.items[s].key,
                                Value: sVersion.items[s].text,
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
                    }
                    if (sScenario) {
                        for (var s = 0; s < sScenario.items.length; s++) {
                            details = {
                                Field: Field6,
                                FieldCenter: sScenario.items[s].key,
                                Value: sScenario.items[s].text,
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
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
                    this.getOwnerComponent().getModel("oCModel").callFunction("/createVariant", {
                        method: "GET",
                        urlParameters: {
                            Flag: flag,
                            USER: (that.oGModel.getProperty("/UserId")),
                            VARDATA: JSON.stringify(array)
                        },
                        success: function (oData) {
                            that.oGModel.setProperty("/newVariant", oData.results);
                            that.oGModel.setProperty("/newVaraintFlag", "X");
                            that.byId("idMatList123RLA").setModified(false);
                            that.onAfterRendering();
                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("Failed to create variant");
                        },
                    });
                }
                else {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageToast.show("Please fill View Name");
                }
            },
            /**On press of save in manage fragment */
            onManage: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var oDelted = {}, deletedArray = [], count = 0;
                var totalVariantData = that.oGModel.getProperty("/VariantData");
                var selected = oEvent.getParameters();
                var variantUser = that.getUser();
                variantUser = variantUser?.toLowerCase();
                // var variantUser = "pradeepkumardaka@sbpcorp.in";
                if (selected.def) {
                    totalVariantData.filter(item1 => {
                        if (JSON.parse(selected.def) === item1.VARIANTID && item1.USER !== variantUser) {
                            count++
                        }
                    })
                }
                if (count > 0) {
                    sap.ui.core.BusyIndicator.hide();
                    that.viewDetails.setData({
                        items12: that.varianNames
                    });
                    that.byId("idMatList123RLA").setModel(that.viewDetails);
                    that.byId("idMatList123RLA").setDefaultKey(that.UniqueDefKey);
                    return sap.m.MessageToast.show("Variant doesn't belong to logged in user. Cannot make changes to this Variant");
                }
                //Delete the selected variant names
                if (selected.deleted) {
                    selected.deleted.forEach(item1 => {
                        totalVariantData.forEach(item2 => {
                            if (JSON.parse(item1) === item2.VARIANTID) {
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
                    if (JSON.parse(selected.def) !== 0) {
                        //Update the existing default to a new default
                        var defaultVariant = totalVariantData.filter(item => item.DEFAULT === "Y" && item.USER === variantUser);
                        if (defaultVariant.length > 0) {
                            defaultVariant[0].DEFAULT = "N";
                            that.getView().getModel("oModel").callFunction("/updateVariant", {
                                method: "GET",
                                urlParameters: {
                                    VARDATA: JSON.stringify(defaultVariant)
                                },
                                success: function (oData) {
                                    var newDefault = totalVariantData.filter(item => item.VARIANTID === JSON.parse(selected.def));
                                    newDefault[0].DEFAULT = "Y";
                                    that.getView().getModel("oCModel").callFunction("/updateVariant", {
                                        method: "GET",
                                        urlParameters: {
                                            VARDATA: JSON.stringify(newDefault)
                                        },
                                        success: function (oData) {
                                            that.onAfterRendering();
                                            // sap.ui.core.BusyIndicator.hide();
                                        },
                                        error: function (error) {
                                            sap.m.MessageToast.show("Failed to update variant");
                                        },
                                    });
                                },
                                error: function (error) {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageToast.show("Failed to update variant");
                                },
                            });

                        }
                        else {
                            var selectedVariant = totalVariantData.filter(item => item.VARIANTID === JSON.parse(selected.def));
                            selectedVariant[0].DEFAULT = "Y";
                            that.getView().getModel("oCModel").callFunction("/updateVariant", {
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
                                    sap.m.MessageToast.show("Failed to update variant");
                                },
                            });
                        }
                    }
                    //If selected default is standard then remove the existing default variant
                    else {
                        var defaultItem = totalVariantData.filter(item => item.DEFAULT === "Y");
                        defaultItem[0].DEFAULT = "N";
                        that.getView().getModel("oCModel").callFunction("/updateVariant", {
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
                                sap.m.MessageToast.show("Failed to update variant");
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
                that.getView().getModel("oCModel").callFunction("/createVariant", {
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
                        sap.m.MessageToast.show("Failed to delete variant");
                    },
                });
            },
            areArraysEqualSorted: function (arr1, arr2) {
                if (arr1.length !== arr2.length) return false;

                const sorted1 = arr1.slice().sort((a, b) => a.key.localeCompare(b.key));
                const sorted2 = arr2.slice().sort((a, b) => a.key.localeCompare(b.key));

                return sorted1.every((item, index) =>
                    item.key === sorted2[index].key && item.text === sorted2[index].text
                );
            },
            saveDefaultVariant: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var array = [];
                var details = {};
                let oSmartFilterBar = this.getView().byId("smartFilterBarRLA");
                var sLocation = oSmartFilterBar.getFilterData()["LOCATION_ID"];
                var Field1 = "Manufacturing Location";
                var sProduct = oSmartFilterBar.getFilterData()["PRODUCT_ID"];
                var Field2 = "Config Product";
                var sLine = oSmartFilterBar.getFilterData()["LINE_ID"];
                var Field3 = "Line ID";
                var sRest = oSmartFilterBar.getFilterData()["RESTRICTION"];
                var Field4 = "Resource";
                var sVersion = oSmartFilterBar.getFilterData()["VERSION"];
                var Field5 = "Version";
                var sScenario = oSmartFilterBar.getFilterData()["SCENARIO"];
                var Field6 = "Scenario";
                if (!sLocation && !sProduct && !sLine && !sRest && !sVersion && !sScenario) {
                    sap.ui.core.BusyIndicator.hide();
                    return;
                }

                if (sLocation) {
                    for (var s = 0; s < sLocation.items.length; s++) {
                        details = {
                            Field: Field1,
                            FieldCenter: sLocation.items[s].key, //sLocation[s].getKey(),
                            Value: sLocation.items[s].text
                        }
                        array.push(details);
                    }
                }
                if (sProduct) {
                    for (var s = 0; s < sProduct.items.length; s++) {
                        details = {
                            Field: Field2,
                            FieldCenter: sProduct.items[s].key, //getKey(),
                            Value: sProduct.items[s].text
                        }
                        array.push(details);
                    }
                }
                if (sLine) {
                    for (var s = 0; s < sLine.items.length; s++) {
                        details = {
                            Field: Field3,
                            FieldCenter: sLine.items[s].key,
                            Value: sLine.items[s].text
                        }
                        array.push(details);
                    }
                }
                if (sRest) {
                    for (var s = 0; s < sRest.items.length; s++) {
                        details = {
                            Field: Field4,
                            FieldCenter: sRest.items[s].key,
                            Value: sRest.items[s].text
                        }
                        array.push(details);
                    }
                }
                if (sVersion) {
                    for (var s = 0; s < sVersion.items.length; s++) {
                        details = {
                            Field: Field5,
                            FieldCenter: sVersion.items[s].key,
                            Value: sVersion.items[s].text
                        }
                        array.push(details);
                    }
                }
                if (sScenario) {
                    for (var s = 0; s < sScenario.items.length; s++) {
                        details = {
                            Field: Field6,
                            FieldCenter: sScenario.items[s].key,
                            Value: sScenario.items[s].text
                        }
                        array.push(details);
                    }
                }
                var flag = "N";
                for (var j = 0; j < array.length; j++) {
                    array[j].IDNAME = "defaultMulti";
                    array[j].App_Name = "DefaultMulti";
                    array[j].SCOPE = "Global";

                }
                //    console.log(JSON.stringify(array));
                this.getOwnerComponent().getModel("oCModel").callFunction("/createVariant", {
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
                        sap.m.MessageToast.show("Failed to create global variant");
                    },
                });
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
                    oStorage.put("nodeId", 88);
                    //Generate a  URL for the second application
                    var url = window.location.href.split('#')[0] + hash;
                    //Navigate to second app
                    sap.m.URLHelper.redirect(url, true);
                }
            },

        });
    });
