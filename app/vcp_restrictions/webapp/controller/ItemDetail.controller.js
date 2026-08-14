sap.ui.define(
    [
        "vcpapp/vcprestrictions/controller/BaseController",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/Device",
        "sap/ui/core/Fragment",
    ],
    function (
        BaseController,
        MessageToast,
        MessageBox,
        JSONModel,
        Filter,
        FilterOperator,
        Device,
        Fragment
    ) {
        "use strict";
        var that, oGModel, maxCounter;
        var aResults
        return BaseController.extend("vcpapp/vcprestrictions.controller.ItemDetail", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             */
            onInit: function () {
                that = this;
                // that.getUsername();

                this.bus = sap.ui.getCore().getEventBus();
                // Declaring JSON Models and size limit
                that.oModel = new JSONModel();
                that.classnameModel = new JSONModel();
                that.charnameModel = new JSONModel();
                that.charvalueModel = new JSONModel();
                that.ListModel = new JSONModel();

                this.oModel.setSizeLimit(1000);
                // that.classnameModel.setSizeLimit(1000);
                // that.charnameModel.setSizeLimit(1000);
                // that.charvalueModel.setSizeLimit(1000);

                oGModel = that.getOwnerComponent().getModel("oGModel");

                
                this._oCore = sap.ui.getCore();

                that.allData = [];
                that.skip = 0;

            },
            deleteRole: function (key) {
            let aData = this.getModel("oGModel")?.getProperty("/RoleMap")?.get(key);
            let bVisible = false;
            if(aData?.length >0){
            if(aData.findIndex(f=>f.DELETE == true) != -1){
                bVisible = true;
            }
            }
            return bVisible;
            },
            classData: function () {

                // var prodId = oGModel.getProperty("/RestrictionData");
                // var topCount = 30000
                sap.ui.core.BusyIndicator.show();
                // var oFilters = [];

                // for (var i = 0; i < prodId.length; i++) {
                //          var sFilter = new sap.ui.model.Filter({
                //              path: "PRODUCT_ID",
                //              operator: sap.ui.model.FilterOperator.EQ,
                //              value1: prodId[i].PRODUCT_ID,
                //          });
                //          oFilters.push(sFilter);
                //     //  }
                //  }

                //  var sFilter = new sap.ui.model.Filter({
                //     path: "LOCATION_ID",
                //     operator: sap.ui.model.FilterOperator.EQ,
                //     value1: prodId[0].LOCATION_ID,
                // });
                // oFilters.push(sFilter);

                var rest = oGModel.getProperty("/Restriction");
                var loc = oGModel.getProperty("/locId");
                var line = oGModel.getProperty("/lineId");



                // // this.getOwnerComponent().getModel("BModel").read("/getIBPProdClass", {
                //     this.getOwnerComponent().getModel("BModel").read("/getClass", {
                // that.getOwnerComponent().getModel("BModel").read("/getProdClass", {
                that.getOwnerComponent().getModel("BModel").callFunction("/getprodclassData", {
                    method: "GET",
                    urlParameters: {
                        LOCATION_ID: loc,
                        LINE_ID: line,
                        RESTRICTION: rest
                    },
                    // filters: [
                    //     new Filter("PRODUCT_ID", FilterOperator.EQ, prodId),
                    // ],
                    success: function (oData) {
                        // if (topCount == oData.results.length) {
                        //     that.skip += topCount;
                        //     that.allData = that.allData.concat(oData.results);
                        //     that.classData();
                        // } else {
                        //     that.skip = 0;
                        //     that.allData = that.allData.concat(oData.results);
                        //     oData.results = that.allData;
                        oData.results = JSON.parse(oData.getprodclassData);
                        that.allData = [];
                        sap.ui.core.BusyIndicator.hide();
                        that.classNameData = oData.results;
                        function removeDuplicate(array, key) {
                            var check = new Set();
                            return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
                        }
                        that.classNameData = removeDuplicate(that.classNameData, 'CLASS_NAME')
                        if (!that._valueHelpDialogRestItem) {
                            that._valueHelpDialogRestItem = sap.ui.xmlfragment(
                                "vcpapp.vcprestrictions.view.RestrictionItem",
                                that
                            );
                            that.getView().addDependent(that._valueHelpDialogRestItem);
                        }

                        if (!that._valueHelpDialogclassName) {
                            that._valueHelpDialogclassName = sap.ui.xmlfragment(
                                "vcpapp.vcprestrictions.view.className",
                                that
                            );
                            that.getView().addDependent(that._valueHelpDialogclassName);
                        }

                        if (!that._valueHelpDialogcharName) {
                            that._valueHelpDialogcharName = sap.ui.xmlfragment(
                                "vcpapp.vcprestrictions.view.charName",
                                that
                            );
                            that.getView().addDependent(that._valueHelpDialogcharName);
                        }

                        if (!that._valueHelpDialogcharValue) {
                            that._valueHelpDialogcharValue = sap.ui.xmlfragment(
                                "vcpapp.vcprestrictions.view.charValue",
                                that
                            );
                            that.getView().addDependent(that._valueHelpDialogcharValue);
                        }

                        that.oClassName = that._oCore.byId("idClassnameRS");
                        that.oCharName = that._oCore.byId("idCharnameRS");
                        that.oCharValue = that._oCore.byId("idCharvalRS");

                        that._valueHelpDialogclassName.setTitleAlignment("Center");
                        that._valueHelpDialogcharName.setTitleAlignment("Center");
                        that._valueHelpDialogcharValue.setTitleAlignment("Center");

                        that.oClassnameList = that._oCore.byId(
                            that._valueHelpDialogclassName.getId() + "-list"
                        );

                        that.oCharnameList = that._oCore.byId(
                            that._valueHelpDialogcharName.getId() + "-list"
                        );

                        that.oCharvalueList = that._oCore.byId(
                            that._valueHelpDialogcharValue.getId() + "-list"
                        );
                        oGModel = that.getOwnerComponent().getModel("oGModel");
                        oGModel.setProperty("/ClassData", that.classNameData);
                        that.classnameModel.setData({
                            results: that.classNameData,
                        });
                        sap.ui.getCore().byId("classNameListRS").setModel(that.classnameModel);



                        that._valueHelpDialogRestItem.open();
                        if (that._valueHelpDialogRestItem) {
                            sap.ui.getCore().byId("stepInputRS").setMax(that.maxCounter);
                            sap.ui.getCore().byId("stepInputRS").setValue(1);
                            that.onCounterChange();
                            
                        }


                        // }
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to get class name data");
                    },
                });

            },
            onCounterChange:function(){
                var qtyMap = {};
                that.oTableData.forEach(item => qtyMap[item.RTR_COUNTER] = item.QUANTITY);
                var counter = sap.ui.getCore().byId("stepInputRS").getValue();

                var exists = that.oTableData.some(item => item.RTR_COUNTER === counter);
                if(exists == true ){
                    var qty = qtyMap[counter];
                sap.ui.getCore().byId("idQuan").setValue(qty);
                sap.ui.getCore().byId("idQuan").setEditable(false);
                }
                else{
                    sap.ui.getCore().byId("idQuan").setEditable(true);
                    sap.ui.getCore().byId("idQuan").setValue();
                }
                
            },

            onQuantityChange(oEvent) {
                if (oEvent.mParameters.value.includes(".")) {
                    const value = oEvent.mParameters.value.split(".")[0];
                    oEvent.getSource().setValue(value);
                    that.oGModel.setProperty("/QUANTITY", Number(value));
                }
                that.oGModel.setProperty("/QUANTITY", Number(oEvent.mParameters.value));
            },

            /**
             * Called after the view has been rendered.
             * Calls the service to get Data.
             */
            onAfterRendering: function () {
                oGModel = that.getOwnerComponent().getModel("oGModel");
                // that.getUsername();
                  that.byId("idcreate_RS").setVisible(false);
                sap.ui.core.BusyIndicator.show();
                var sRestriction = oGModel.getProperty("/Restriction");
                var sLocation = oGModel.getProperty("/locId");
                var sLineId = oGModel.getProperty("/lineId");
                that.maxCounter = 1;
                that.skip = 0;
                that.allData = [];
                that.oTableData = [];

                if (sRestriction !== "") {



                    // adding skip and top for getODHdrRstr
                    that.getAllODHrRstr()

                    // this.getModel("BModel").read("/getODHdrRstr", {
                    //     filters: [
                    //         new Filter("RESTRICTION", FilterOperator.EQ, sRestriction),
                    //         new Filter("LOCATION_ID", FilterOperator.EQ, sLocation),
                    //         new Filter("LINE_ID", FilterOperator.EQ, sLineId),
                    //     ],

                    //     success: function (oData) {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         that.oTableData = oData.results;
                    //         // if (oData.results.length) {
                    //         // I_26th_Sept    
                    //         oData.results.map(function (entry) {
                    //             entry.CLASS_DESC =  entry.CLASS_DESC !== null ?  entry.CLASS_DESC.toString().replace(/  +/g, ' ') : "";
                    //             entry.CHAR_DESC =  entry.CHAR_DESC !== null ?  entry.CHAR_DESC.toString().replace(/  +/g, ' '): "";
                    //             entry.bFLAG = false;
                    //             return entry;
                    //         });
                    //         // I_26th_Sept
                    //         let oModel = new JSONModel();
                    //         oModel.setData({
                    //             results: oData.results,
                    //         });
                    //         that.byId("idDetailRS").setModel(oModel);
                    //         if(Array.from(oData.results).length > 0){
                    //             var iCounter = Math.max(...oData.results.map(o => o.RTR_COUNTER));
                    //             if(iCounter){
                    //                 that.maxCounter = iCounter + 1;
                    //             }
                    //         }
                    //         that.countFlag = 0;
                    //         // }
                    //         that.byId("idSearchRS").setValue("");

                    //     },
                    //     error: function () {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         MessageToast.show("Failed to get data");
                    //     },
                    // });

                    // if (oGModel.getProperty("/readClass") === "X") {

                    // adding skip and topCount for the getClass
                    // that.getAllClas()



                    // this.getModel("BModel").read("/getClass", {
                    //     success: function (oData) {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         that.classNameData = oData.results;
                    //     },
                    //     error: function () {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         MessageToast.show("Failed to get class name data");
                    //     },
                    // });
                    // }
                    // var prodId = oGModel.getProperty("/ProdID");
                    // this.getModel("BModel").read("/getIBPProdClass", {
                    //     filters: [
                    //         new Filter("PRODUCT_ID", FilterOperator.EQ, prodId),
                    //     ],

                    //     success: function (oData) {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         that.classNameData = oData.results;

                    //     },
                    //     error: function () {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         MessageToast.show("Failed to get class name data");
                    //     },
                    // });
                    // }
                }
                else {//empty the table
                    sap.ui.core.BusyIndicator.hide();
                    that.oTableData = [];
                    that.oModel.setData({
                        results: [],
                    });
                    that.byId("idDetailRS").setModel(that.oModel);
                }
                             

                let sLoc = oGModel.getProperty("/locId");
                    if(sLoc){
                        let aData = oGModel?.getProperty("/RoleMap")?.get(sLoc); 
                if(aData?.length >0){
                if(aData.findIndex(f=>f.CREATE == true) != -1){
                    that.byId("idcreate_RS").setVisible(true);
                }
                }
                }
            },

            /**
             * Called when something is entered into the search field.
             * @param {object} oEvent -the event information.
             */
            onItemSearch: function (oEvent) {
                var sQuery = "",
                    oFilters = [];
                if (oEvent) {
                    sQuery =
                        oEvent.getParameter("value") || oEvent.getParameter("newValue");
                }

                if (sQuery !== "") {
                    oFilters.push(
                        new Filter({
                            filters: [
                                new Filter("CLASS_DESC", FilterOperator.Contains, sQuery),
                                new Filter("CHAR_DESC", FilterOperator.Contains, sQuery),
                                new Filter("CHAR_VALUE", FilterOperator.Contains, sQuery),
                            ],
                            and: false,
                        })
                    );
                }
                that.byId("idDetailRS").getBinding("items").filter(oFilters);
            },


            onCreateItem: function () {

                // that.getAllClas()
                that.classData();


            },
            onCloseRestItem: function () {
                // that.aData = [];
                // that.ListModel.setData({
                //     results: that.aData
                // });
                // sap.ui.getCore().byId("idItemList").setModel(that.ListModel);

                sap.ui.getCore().byId("idClassnameRS").setValue("");
                sap.ui.getCore().byId("idCharnameRS").setValue("");
                sap.ui.getCore().byId("idCharvalRS").setValue("");
                // sap.ui.getCore().byId("idcharcounter").setValue("");
                // sap.ui.getCore().byId("idrowid").setValue("");
                sap.ui.getCore().byId("idClassnoRS").setValue("");
                sap.ui.getCore().byId("idCharnoRS").setValue("");
                sap.ui.getCore().byId("idCharvalnoRS").setValue("");



                that._valueHelpDialogRestItem.close();

            },


            /**
         * This function is called when click on Value Help of Inputs.
         * In this function dialogs will open based on sId.
         * @param {object} oEvent -the event information.
         */
            handleValueHelp: function (oEvent) {
                var sId = oEvent.getParameter("id");

                if (sId.includes("Classname")) {
                    that._valueHelpDialogclassName.open();
                } else if (sId.includes("Charname")) {
                    if (sap.ui.getCore().byId("idClassnameRS").getValue()) {
                        that._valueHelpDialogcharName.open();
                    } else {
                        MessageToast.show("Select Class Name");
                    }

                } else if (sId.includes("Charval")) {
                    if (sap.ui.getCore().byId("idCharnameRS").getValue()) {
                        that._valueHelpDialogcharValue.open();
                    } else {
                        MessageToast.show("Select Class Name and Characteristic Name");
                    }

                }
            },

            /**
             * Called when 'Close/Cancel' button in any dialog is pressed.
             */
            handleClose: function (oEvent) {
                var sId = oEvent.getParameter("id");
                if (sId.includes("className")) {
                    that._oCore.byId(this._valueHelpDialogclassName.getId() + "-searchField")
                        .setValue("");
                    if (that.oClassnameList.getBinding("items")) {
                        that.oClassnameList.getBinding("items").filter([]);
                    }
                } else if (sId.includes("charName")) {
                    that._oCore
                        .byId(this._valueHelpDialogcharName.getId() + "-searchField")
                        .setValue("");
                    if (that.oCharnameList.getBinding("items")) {
                        that.oCharnameList.getBinding("items").filter([]);
                    }
                } else if (sId.includes("charVal")) {
                    that._oCore
                        .byId(this._valueHelpDialogcharValue.getId() + "-searchField")
                        .setValue("");
                    if (that.oCharvalueList.getBinding("items")) {
                        that.oCharvalueList.getBinding("items").filter([]);
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
                // Class Name
                if (sId.includes("className")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("CLASS_NAME", FilterOperator.Contains, sQuery),
                                    new Filter("CLASS_DESC", FilterOperator.Contains, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.oClassnameList.getBinding("items").filter(oFilters);
                    // Char Name
                } else if (sId.includes("charName")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("CHAR_NAME", FilterOperator.Contains, sQuery),
                                    new Filter("CHAR_DESC", FilterOperator.Contains, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.oCharnameList.getBinding("items").filter(oFilters);
                    // Char Value
                } else if (sId.includes("charVal")) {
                    if (sQuery !== "") {
                        oFilters.push(
                            new Filter({
                                filters: [
                                    new Filter("CHAR_VALUE", FilterOperator.Contains, sQuery),
                                    new Filter("CHARVAL_DESC", FilterOperator.Contains, sQuery),
                                ],
                                and: false,
                            })
                        );
                    }
                    that.oCharvalueList.getBinding("items").filter(oFilters);
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
                if (sId.includes("className")) {
                    that.oClassName = sap.ui.getCore().byId("idClassnameRS");
                    aSelectedItems = oEvent.getParameter("selectedItems");
                    that.oGModel.setProperty("/CLASS_DESC", aSelectedItems[0].getDescription());
                    that.oClassName.setValue(aSelectedItems[0].getTitle());
                    sap.ui.getCore().byId("idClassnoRS").setValue(aSelectedItems[0].getInfo());

                    sap.ui.getCore().byId("idCharnameRS").setValue("");
                    sap.ui.getCore().byId("idCharnoRS").setValue("");
                    sap.ui.getCore().byId("idCharvalRS").setValue("");
                    sap.ui.getCore().byId("idCharvalnoRS").setValue("");

                    // this.getModel("BModel").read("/getClassChar", {
                    //     filters: [
                    //         new Filter(
                    //             "CLASS_NAME",
                    //             FilterOperator.EQ,
                    //             sap.ui.getCore().byId("idClassnameRS").getValue()
                    //         ),
                    //     ],
                    //     success: function (oData) {
                    //         sap.ui.core.BusyIndicator.hide();

                    //         function removeDuplicate(array, key) {
                    //             var check = new Set();
                    //             return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
                    //         }
                    //         that.charnameModel.setData({
                    //             results: removeDuplicate(oData.results, 'CHAR_NAME')
                    //         });

                    //         that.oCharnameList.setModel(that.charnameModel);
                    //     },
                    //     error: function (oData, error) {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         MessageToast.show("error");
                    //     },
                    // });

                    that.getModel("BModel").callFunction("/getClassCharNew", {
                        method: "GET",
                        urlParameters: {
                            CLASS_NAME: sap.ui.getCore().byId("idClassnameRS").getValue(),
                            CHAR_NAME: ""
                        },
                        success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            var Data = JSON.parse(oData.getClassCharNew);

                            function removeDuplicate(array, key) {
                                var check = new Set();
                                return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
                            }
                            that.charnameModel.setData({
                                results: removeDuplicate(Data, 'CHAR_NAME')
                            });

                            that.oCharnameList.setModel(that.charnameModel);

                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("Error");
                        },
                    });
                } else if (sId.includes("charName")) {
                    that.oCharName = sap.ui.getCore().byId("idCharnameRS");
                    aSelectedItems = oEvent.getParameter("selectedItems");
                    that.oCharName.setValue(aSelectedItems[0].getTitle());
                    that.oGModel.setProperty("/CHAR_DESC", aSelectedItems[0].getDescription());
                    sap.ui.getCore().byId("idCharnoRS").setValue(aSelectedItems[0].getInfo());

                    sap.ui.getCore().byId("idCharvalRS").setValue("");
                    sap.ui.getCore().byId("idCharvalnoRS").setValue("");

                    // this.getModel("BModel").read("/getClassChar", {
                    //     filters: [
                    //         new Filter(
                    //             "CLASS_NAME",
                    //             FilterOperator.EQ,
                    //             sap.ui.getCore().byId("idClassnameRS").getValue()
                    //         ),
                    //         new Filter(
                    //             "CHAR_NAME",
                    //             FilterOperator.EQ,
                    //             sap.ui.getCore().byId("idCharnameRS").getValue()
                    //         ),
                    //     ],
                    //     success: function (oData) {
                    //         sap.ui.core.BusyIndicator.hide();

                    //         function removeDuplicate(array, key) {
                    //             var check = new Set();
                    //             return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
                    //         }
                    //         that.charvalueModel.setData({
                    //             results: removeDuplicate(oData.results, 'CHAR_VALUE')
                    //         });

                    //         that.oCharvalueList.setModel(that.charvalueModel);
                    //     },
                    //     error: function (oData, error) {
                    //         sap.ui.core.BusyIndicator.hide();
                    //         MessageToast.show("error");
                    //     },
                    // });
                    that.getModel("BModel").callFunction("/getClassCharNew", {
                        method: "GET",
                        urlParameters: {
                            CLASS_NAME: sap.ui.getCore().byId("idClassnameRS").getValue(),
                            CHAR_NAME: sap.ui.getCore().byId("idCharnameRS").getValue()
                        },
                        success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            var Data = JSON.parse(oData.getClassCharNew);
                            function removeDuplicate(array, key) {
                                var check = new Set();
                                return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
                            }
                            that.charvalueModel.setData({
                                results: removeDuplicate(Data, 'CHAR_VALUE')
                            });

                            that.oCharvalueList.setModel(that.charvalueModel);

                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("Error");
                        },
                    });
                } else if (sId.includes("charVal")) {
                    that.oCharValue = sap.ui.getCore().byId("idCharvalRS");
                    aSelectedItems = oEvent.getParameter("selectedItems");
                    that.oCharValue.setValue(aSelectedItems[0].getTitle());
                    that.oGModel.setProperty("/CHARVAL_DESC", aSelectedItems[0].getDescription());
                    sap.ui.getCore().byId("idCharvalnoRS").setValue(aSelectedItems[0].getInfo());

                }
                that.handleClose(oEvent);
            },

            onAdd: function (oEvent) {

                var oEntry = {
                    RTRCHAR: [],
                };
                var oFlag = "C";
                that.oGModel = that.getModel("oGModel");
                var oClassName = sap.ui.getCore().byId("idClassnameRS").getValue(),
                    oCharName = sap.ui.getCore().byId("idCharnameRS").getValue(),
                    oCharVal = sap.ui.getCore().byId("idCharvalRS").getValue(),
                    oRestrictionVal = sap.ui.getCore().byId("stepInputRS").getValue(),
                    classDesc = that.oGModel.getProperty("/CLASS_DESC"),
                    charDesc = that.oGModel.getProperty("/CHAR_DESC"),
                    charValDesc = that.oGModel.getProperty("/CHARVAL_DESC"),
                    quantity = that.oGModel.getProperty("/QUANTITY");
                // ocharCounter = sap.ui.getCore().byId("idcharcounter").getValue(),
                // oRowid = sap.ui.getCore().byId("idrowid").getValue();
                that.aData = [];

                if (oClassName !== "" && oCharName !== "" &&  oRestrictionVal != "") {
                    that.oData = {
                        "RESTRICTION": sap.ui.getCore().byId("idrestRS").getValue(),
                        "CLASS_NAME": oClassName,
                        "CLASS_NUM": sap.ui.getCore().byId("idClassnoRS").getValue(),
                        "CHAR_NAME": oCharName,
                        "CHAR_NUM": sap.ui.getCore().byId("idCharnoRS").getValue(),
                        // "CHAR_COUNTER": sap.ui.getCore().byId("idcharcounter").getValue(),
                        "CHAR_VALUE": oCharVal,
                        "CHARVAL_NUM": sap.ui.getCore().byId("idCharvalnoRS").getValue(),
                        "OD_CONDITION": sap.ui.getCore().byId("idODcondRS").getSelectedKey(),
                        // "OFLAG": "X",
                        "bFLAG": true,
                        "RTR_COUNTER": oRestrictionVal,
                        "CLASS_DESC": classDesc,
                        "CHAR_DESC": charDesc,
                        "CHARVAL_DESC": charValDesc || "",
                        "QUANTITY": quantity
                        // "ROW_ID": sap.ui.getCore().byId("idrowid").getValue(),
                    };
                    that.countFlag = that.countFlag + 1;
                    var oItemTable = this.byId("idDetailRS").getItems();
                    var count = 0;

                    for (var i = 0; i < oItemTable.length; i++) {
                        if (
                            oItemTable[i].getCells()[0].getText() == oRestrictionVal &&
                            oItemTable[i].getCells()[1].getTitle() === oClassName &&
                            oItemTable[i].getCells()[2].getTitle() === oCharName &&
                            oItemTable[i].getCells()[4].getTitle() === oCharVal) {
                            count = count + 1;
                        }
                    }

                    if (count === 0) {
                        // Add entry to the table model
                        that.oTableData.push(that.oData);

                        that.ListModel.setData({
                            results: that.oTableData
                        });
                        that.byId("idDetailRS").setModel(that.ListModel);
                        that.onCloseRestItem();
                        that.byId("idUpdateSaveRS").setVisible(true);

                    } else {
                        sap.m.MessageToast.show("Resource rule is already maintained");
                    }
                    // // Add entry to the table model
                    // that.oTableData.push(that.oData);

                    // that.ListModel.setData({
                    //     results: that.aData
                    // });
                    // sap.ui.getCore().byId("idItemList").setModel(that.ListModel);

                    // // sap.ui.getCore().byId("idrestRS").setValue("");
                    // sap.ui.getCore().byId("idClassnameRS").setValue("");
                    // sap.ui.getCore().byId("idClassnoRS").setValue("");
                    // sap.ui.getCore().byId("idCharnameRS").setValue("");
                    // sap.ui.getCore().byId("idCharnoRS").setValue("");
                    // sap.ui.getCore().byId("idcharcounter").setValue("");
                    // sap.ui.getCore().byId("idCharvalRS").setValue("");
                    // sap.ui.getCore().byId("idCharvalnoRS").setValue("");
                    // sap.ui.getCore().byId("idODcondRS").setValue("");
                    // sap.ui.getCore().byId("idrowid").setValue("");

                } else {
                    MessageToast.show("Please fill all inputs");
                }

            },

            // onSaveRest: function (oEvent) {
            //     var oTable = sap.ui.getCore().byId("idItemList").getItems();
            //     var oEntry = {
            //         RTRCHAR: [],
            //     },
            //         vRuleslist;
            //     var oFlag = "C";
            //     for (var i = 0; i < oTable.length; i++) {

            //         vRuleslist = {
            //             RESTRICTION: oTable[i].getCells()[0].getText(),
            //             CLASS_NUM: oTable[i].getCells()[2].getText(),
            //             CHAR_NUM: oTable[i].getCells()[4].getText(),
            //             CHAR_COUNTER: oTable[i].getCells()[5].getText(),
            //             CHARVAL_NUM: oTable[i].getCells()[7].getText(),
            //             OD_CONDITION: oTable[i].getCells()[8].getText(),
            //             ROW_ID: parseInt(oTable[i].getCells()[9].getText()),
            //         };
            //         oEntry.RTRCHAR.push(vRuleslist);
            //     }

            // that.getModel("BModel").callFunction("/maintainRestrDet", {
            //     method: "GET",
            //     urlParameters: {
            //         FLAG: oFlag,
            //         RTRCHAR: JSON.stringify(oEntry.RTRCHAR)
            //     },
            //     success: function (oData) {
            //         sap.ui.core.BusyIndicator.hide();
            //         sap.m.MessageToast.show("success");
            //         that.onAfterRendering();
            //         that.onCloseRestItem();

            //     },
            //     error: function (error) {
            //         sap.ui.core.BusyIndicator.hide();
            //         sap.m.MessageToast.show("Error");
            //     },
            // });
            // },

            // onCharDel: function (oEvent) {
            //     var oSelItem = oEvent.getParameters("listItem").id.split("CharList-")[1];
            //     var aData = that.ListModel.getData().results;
            //     aData.splice(oSelItem, 1); //removing 1 record from i th index.
            //     that.ListModel.refresh();


            // },

            // onEditItem: function (oEvent) {
            //     var oTable = this.byId("idDetailRS").getItems();
            //     this.byId("idUpdateSaveRS").setVisible(true);
            //     this.byId("idUpdateCancel").setVisible(true);

            //     for (var i = 0; i < oTable.length; i++) {
            //         oTable[i].getCells()[4].setEditable(true);
            //         oTable[i].getCells()[5].setEditable(true);
            //     }

            // },

            // onRowIdChange: function (oEvent) {
            //     var oRow = parseInt(oEvent.getParameters().id.split("idDetailRS-")[1]),
            //         oValue = oEvent.getParameters().newValue;
            //     var oTable = this.byId("idDetailRS").getItems();
            //     for (var i = 0; i < oTable.length; i++) {
            //         if (oTable[i].getCells()[5].getValue() === oValue) {
            //             if (oRow !== i) {
            //                 sap.m.MessageToast.show("Row ID cannot be duplicate");
            //                 oTable[oRow].getCells()[5].setValue("");
            //             }
            //         }
            //     }

            // },



            // onCancelUpdate: function (oEvent) {
            //     var oTable = this.byId("idDetailRS").getItems();
            //     this.byId("idUpdateSaveRS").setVisible(false);
            //     this.byId("idUpdateCancel").setVisible(false);
            //     oGModel.setProperty("/readClass", "");
            //     that.onAfterRendering();

            //     for (var i = 0; i < oTable.length; i++) {
            //         oTable[i].getCells()[4].setEditable(false);
            //         oTable[i].getCells()[5].setEditable(false);
            //     }

            // },

            onUpdateItem: function (oEvent) {
                var oTable = this.byId("idDetailRS").getItems();
                var oEntry = {
                    RTRCHAR: [],
                },
                    vRuleslist;
                var sNoRow = "";
                //var oFlag = "E";
                var oFlag = "C";
                var aData = {};
                for (var i = 0; i < oTable.length; i++) {
                    aData = oTable[i].getBindingContext().getObject()

                    // if (oTable[i].getCells()[5].getValue() === "") {
                    //     sNoRow = "X"
                    // }
                    var sLocation = oGModel.getProperty("/locId");
                    var sLineId = oGModel.getProperty("/lineId");
                    if (aData.bFLAG === true) {
                        vRuleslist = {
                            RESTRICTION: aData.RESTRICTION,
                            CLASS_NUM: aData.CLASS_NUM,
                            CHAR_NUM: aData.CHAR_NUM,
                            CHARVAL_NUM: aData.CHARVAL_NUM,
                            QUANTITY: aData.QUANTITY,
                            OD_CONDITION: oTable[i].getCells()[3].getText(),
                            CHAR_VALUE:aData.CHAR_VALUE,
                            FLAG: oTable[i].getCells()[5].getText(),          // I_26th_Sept
                            RTR_COUNTER: aData.RTR_COUNTER,
                            LOCATION_ID: sLocation,
                            LINE_ID: sLineId,
                            CHAR_VALUE:aData.CHAR_VALUE
                            // CHAR_COUNTER: aData.CHAR_COUNTER,
                            // OD_CONDITION: oTable[i].getCells()[4].getSelectedKey(),
                            // ROW_ID: oTable[i].getCells()[5].getValue(),
                        };
                        oEntry.RTRCHAR.push(vRuleslist);
                    }
                }
                // if (sNoRow !== "X") {

                if (oEntry.RTRCHAR.length > 0) {
                    var User = "";
                    if (sap.ushell.Container) {
                        let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                        User = (email) ? email : "";
                    }
                    sap.ui.core.BusyIndicator.show();
                    that.getModel("BModel").callFunction("/maintainRestrDetail", {
                        method: "GET",
                        urlParameters: {
                            FLAG: oFlag,
                            RTRCHAR: JSON.stringify(oEntry.RTRCHAR),
                            User: User
                        },
                        success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show(oData.maintainRestrDetail);
                            that.onAfterRendering();
                            that.byId("idUpdateSaveRS").setVisible(false);
                            // that.onCancelUpdate();

                        },
                        error: function (error) {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("Failed to create resource rule, please try later!");
                        },
                    });
                }
                // } else {
                //     sap.m.MessageToast.show("Maintain all unique row id's");
                // }
            },


            onDeleteItem: function (oEvent) {
                var selItem = oEvent.getSource().getParent().getBindingContext().getObject();
                if (selItem.bFLAG) {
                    var oItemtoDelete = oEvent.getParameters("listItem").id.split("idDetailRS-")[0];
                    var aData = that.ListModel.getData().results;
                    var index = aData.findIndex(el => el.CHAR_NAME === selItem.CHAR_NAME && el.CHAR_VALUE === selItem.CHAR_VALUE && el.CLASS_NAME === selItem.CLASS_NAME);
                    aData.splice(index, 1);
                    // aData.splice(selItem, 1); //removing 1 record from ith index.
                    that.ListModel.refresh();
                    that.countFlag = that.countFlag - 1;
                } else {
                    if (that.countFlag > 0) {//unsaved Items exists
                        var text = "Unsaved changes will be lost.Do you wish to continue?";
                        sap.m.MessageBox.show(
                            text, {
                            title: "Confirmation",
                            actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                            onClose: function (oAction) {
                                if (oAction === sap.m.MessageBox.Action.YES) {
                                    that.commonDelete(selItem);
                                }
                            }
                        }
                        );
                    }
                    else {
                        that.commonDelete(selItem);
                    }

                }
            },
            commonDelete: function (selItem) {
                var oEntry = {
                    RTRCHAR: [],
                },
                    vRuleslist;
                var oFlag = "D";
                var sLocation = oGModel.getProperty("/locId");
                var sLineId = oGModel.getProperty("/lineId");
                vRuleslist = {
                    RESTRICTION: selItem.RESTRICTION,
                    CLASS_NUM: selItem.CLASS_NUM,
                    CHAR_NUM: selItem.CHAR_NUM,
                    CHARVAL_NUM: selItem.CHARVAL_NUM,
                    CHAR_COUNTER: selItem.CHAR_COUNTER,
                    RTR_COUNTER: selItem.RTR_COUNTER,
                    LOCATION_ID: sLocation,
                    LINE_ID: sLineId,
                    CHAR_VALUE:selItem.CHAR_VALUE
                };
                oEntry.RTRCHAR.push(vRuleslist);
                var User = "";
                if (sap.ushell.Container) {
                    let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                    User = (email) ? email : "";
                }
                sap.ui.core.BusyIndicator.show();
                that.getModel("BModel").callFunction("/maintainRestrDetail", {
                    method: "GET",
                    urlParameters: {
                        FLAG: oFlag,
                        RTRCHAR: JSON.stringify(oEntry.RTRCHAR),
                        User: User
                    },
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show(oData.maintainRestrDetail);
                        if (oData.maintainRestrDetail.toString().includes('Likelihood') == false) {
                            that.onAfterRendering();
                        }
                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("Failed to delete resource rule, please try later!");
                    },
                });
            },
            // getUsername: function () {
            //     // var oModel = this.getOwnerComponent().getModel("BModel");
            //     // var vUser = this.getLoginuser();
            //     // var oEntry = {
            //     //     USERDATA: []
            //     // };
            //     // let oParamVals = {
            //     //     USEREMAIL: vUser
            //     // };
            //     // oEntry.USERDATA.push(oParamVals);
            //     // oModel.callFunction("/genUserAppVisibility", {
            //     //     method: "GET",
            //     //     urlParameters: {
            //     //         FLAG: 'G',
            //     //         USERDATA: JSON.stringify(oEntry.USERDATA)
            //     //     },
            //     //     success: function (oData) {
            //     //         aResults = oData.results;
            //     aResults = oGModel.getProperty("/userVisibility");
            //     if (aResults.length > 0) {
            //         var isUserLoggedIn = true;
            //     }
            //     // Check if the user matches the expected details
            //     if (isUserLoggedIn) {
            //         if (aResults[0].DELETE_CHK === "disabled") {
            //             that.byId("iddelete1RS").setEnabled(false);
            //         }
            //         if (aResults[0].CREATE_CHK === "disabled") {
            //             that.byId("idcreate_RS").setEnabled(false);
            //         }
            //     }
            //     else {
            //         that.byId("iddelete1RS").setEnabled(false);
            //         that.byId("idcreate_RS").setEnabled(false);
            //     }
            //     //         },
            //     //   error: function () {
            //     //     MessageToast.show("Failed to get data");
            //     //   },
            //     // });

            // },
            // getODHdrRstr 
            getAllODHrRstr: function () {
                var topCount = 30000
                var sRestriction = oGModel.getProperty("/Restriction");
                var sLocation = oGModel.getProperty("/locId");
                var sLineId = oGModel.getProperty("/lineId");
                that.maxCounter = 1;
                sap.ui.core.BusyIndicator.show();
                this.getModel("BModel").read("/getODHdrRstr", {
                    filters: [
                        new Filter("RESTRICTION", FilterOperator.EQ, sRestriction),
                        new Filter("LOCATION_ID", FilterOperator.EQ, sLocation),
                        new Filter("LINE_ID", FilterOperator.EQ, sLineId),
                    ],
                    urlParameters: {
                        "$skip": that.skip,
                        "$top": topCount
                    },
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        if (topCount == oData.results.length) {
                            that.skip += topCount;
                            that.allData = that.allData.concat(oData.results);
                            that.getAllODHrRstr();
                        } else {
                            that.skip = 0;
                            that.allData = that.allData.concat(oData.results);
                            oData.results = that.allData
                            that.allData = []
                            that.oTableData = oData.results;

                            // if (oData.results.length) {
                            // I_26th_Sept    
                            oData.results.map(function (entry) {
                                entry.CLASS_DESC = entry.CLASS_DESC !== null ? entry.CLASS_DESC.toString().replace(/  +/g, ' ') : "";
                                entry.CHAR_DESC = entry.CHAR_DESC !== null ? entry.CHAR_DESC.toString().replace(/  +/g, ' ') : "";
                                entry.bFLAG = false;
                                return entry;
                            });
                            // I_26th_Sept
                            let oModel = new JSONModel();
                            oModel.setData({
                                results: oData.results,
                            });
                            that.byId("idDetailRS").setModel(oModel);
                            if (Array.from(oData.results).length > 0) {
                                var iCounter = Math.max(...oData.results.map(o => o.RTR_COUNTER));
                                if (iCounter) {
                                    that.maxCounter = iCounter + 1;
                                }
                            }
                            that.countFlag = 0;
                            // }
                            that.byId("idSearchRS").setValue("");


                        }


                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show("Failed to get data");
                    },
                });
            }
        });
    }
);
