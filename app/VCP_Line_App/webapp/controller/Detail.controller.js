sap.ui.define([
  "sap/ui/core/mvc/Controller",
  'sap/f/library',
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment",
  "sap/ui/core/format/DateFormat"
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, fioriLibrary, Filter, FilterOperator, MessageToast, MessageBox, Fragment, DateFormat) {
    "use strict";
    var oCurrentObj
    var that;
    return Controller.extend("vcpapp.vcplineapps.controller.Detail", {
      onInit: function () {
        that = this

        // that.Trigger();
        // that.CapacityTrigger();
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("Detail").attachMatched(this.getDetail, this)
        var router = sap.ui.core.UIComponent.getRouterFor(this);
        router.attachRoutePatternMatched(this.onRoutePatternMatched, this);

        if (!this._ProdDialog) {
          this._ProdDialog = sap.ui.xmlfragment(
            "vcpapp.vcplineapps.view.ProdDialog",
            this
          );
          this.getView().addDependent(this._ProdDialog);
        }
        // if (!this.EditDialog) {
        //   this.EditDialog = sap.ui.xmlfragment(
        //     "vcpapp.vcplineapps.view.LineCapEdit",
        //     this
        //   );
        //   this.getView().addDependent(this.EditDialog);
        // }


        if (!that.editCapDialog1) {
          that.editCapDialog1 = sap.ui.xmlfragment("vcpapp.vcplineapps.view.editCap", that);
        }

        if (!that.assignProdDialog) {
          that.assignProdDialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.assignProd", that);
        }


        if (!that.prodValuHelpDialog) {
          that.prodValuHelpDialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.prodValueHelp", that);
        }


      },
      onAfterRendering: function () {
        that.vUser = that.getUserName();
        that.oGModel = that.getOwnerComponent().getModel("oGModel");

        that.bModel = that.getOwnerComponent().getModel("BModel");
        that.skip = 0
        that.allData = []
        that.getAllPartial()
        that.getAllLineCap()


        // that.bModel.read("/genPartialProd", {
        //   success: function (oData) {
        //     var PRDModel = new sap.ui.model.json.JSONModel();
        //     PRDModel.setSizeLimit(1000);
        //     PRDModel.setData({
        //       itemPRD: oData.results
        //     });
        //     that.oGModel.setProperty("/PartialProd", oData.results);
        //     that.bModel.read('/getLineCapacity', {
        //       success: function (aData) {
        //         that.oCdata = aData.results;
        //         // resolve();
        //         that.onItem();
        //       },
        //       error: function (error) {
        //         console.log(error);
        //         // reject(error);
        //       }
        //     });
        //   },
        //   error: function (e) {
        //     sap.m.MessageToast.show("Cannot load data");
        //     sap.ui.core.BusyIndicator.hide();
        //   }
        // });
      },


      updateRole: function (sProd) {
        let sLoc = that.byId("sHead1LA").getText();
          let bVisible  = false;
        if(sLoc && sProd){
           let aData = that.oGModel?.getProperty("/RoleMap")?.get(sLoc)
        if(aData?.length >0){
          if(aData.findIndex(f=>f.PRODUCT_ID ==sProd  && f.UPDATE == true) != -1){
            bVisible = true;
          }
        }
        }
        return bVisible;
      },

      deleteRole: function (sProd) {
               let sLoc = that.byId("sHead1LA").getText();
          let bVisible  = false;
        if(sLoc && sProd){
           let aData = that.oGModel?.getProperty("/RoleMap")?.get(sLoc)
        if(aData?.length >0){
          if(aData.findIndex(f=>f.PRODUCT_ID ==sProd  && f.DELETE == true) != -1){
            bVisible = true;
          }
        }
        }
        return bVisible;
      },
      onItem: function () {
        // that.updateDataAndRefresh();

        that.oGModel = that.getOwnerComponent().getModel("oGModel");
        var aProd = [];
        var aCap = [];
        var oModel1 = new sap.ui.model.json.JSONModel();
        var oModel2 = new sap.ui.model.json.JSONModel();
        var selItem = that.getOwnerComponent().getModel("oGModel").getProperty("/selectedItem")
        if (selItem === undefined) {
          selItem = {
            LINE_ID: that.oCdata[0].LINE_ID,
            LINE_DESC: that.oCdata[0].LINE_DESC,
            LOCATION_ID: that.oCdata[0].LOCATION_ID,
            LOCATION_DESC: that.oCdata[0].LOCATION_DESC
          }
        }

        that.byId("sHeadLA").setText("Location : ")
        that.byId("sHead1LA").setText(selItem.LOCATION_ID)
        that.byId("lHeadLA").setText("Line : ");
        that.byId("lHead1LA").setText(selItem.LINE_ID);
        if (that.userLoggedIn == false) {
          that.byId("idAssignLA").setEnabled(false);
        }
        else if (that.userLoggedIn == true) {
          that.byId("idAssignLA").setEnabled(true);
        }
        for (var i = 0; i < that.oCdata.length; i++) {
          if (that.oCdata[i].LOCATION_ID == selItem.LOCATION_ID && that.oCdata[i].LINE_ID == selItem.LINE_ID) {
            that.oCdata[i].VALID_FROM = new Date(that.oCdata[i].VALID_FROM).toDateString()
            that.oCdata[i].VALID_TO = new Date(that.oCdata[i].VALID_TO).toDateString()
            that.oCdata[i].isEnable = that.userLoggedIn;
            aCap.push(that.oCdata[i])
          }
        }
        oModel2.setData({
          res: aCap
        })


        that.byId("Detail2LA").setModel(oModel2)
      },

      onDelProd: function (oEvent) {
        var oSelected = oEvent.getSource().getBindingContext().getObject();
        var aSelected = [];
        var obj = {
          LOCATION_ID: oSelected.LOCATION_ID,
          PRODUCT_ID: oSelected.PRODUCT_ID,
          LINE_ID: oSelected.LINE_ID

        }
        aSelected.push(obj);
        var sMessage = "Are you sure you want to Delete product" + " " + oSelected.PRODUCT_ID;
        var sTitle = "Confirmation";

        MessageBox.confirm(sMessage, {
          title: sTitle,
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          emphasizedAction: MessageBox.Action.YES,
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.YES) {
              // Action to take if "Yes" is pressed

              that.bModel.callFunction("/DeleteLineBatch", {
                method: "GET",
                urlParameters: {
                  Flag: "D",
                  PRODATA: JSON.stringify(aSelected),
                  User: that.vUser
                },
                success: function (oData) {
                  that.updateDataAndRefresh();
                  MessageToast.show("Deletion successful");

                },
                error: function (_error) {

                  MessageToast.show("Failed to delete data");
                },
              });


            } else {
              // Action to take if "No" is pressed
              sap.m.MessageToast.show("Action cancelled");
            }
          }
        });

      },


      onEditCap: function (oEvent) {
        that.oSelectedcap = oEvent.getSource().getBindingContext().getObject();
        var vUser = that.getUserName();



        // var sDate = new Date(that.oSelectedcap.VALID_FROM).getDate()
        // var sMon = new Date(that.oSelectedcap.VALID_FROM).getMonth()
        // var sYear = new Date(that.oSelectedcap.VALID_FROM).getFullYear()

        // var eDate = new Date(that.oSelectedcap.VALID_TO).getDate()
        // var eMon = new Date(that.oSelectedcap.VALID_TO).getMonth()
        // var eYear = new Date(that.oSelectedcap.VALID_TO).getFullYear()

        // var startDate = new Date(sYear, sMon, sDate);
        // var endDate = new Date(eYear, eMon, eDate);

        sap.ui.getCore().byId("idLocFLA").setValue(that.oSelectedcap.LOCATION_ID);
        sap.ui.getCore().byId("idLineFLA").setValue(that.oSelectedcap.LINE_ID);
        sap.ui.getCore().byId("idProdFLA").setValue(that.oSelectedcap.PRODID)
        // sap.ui.getCore().byId("idDRS").setDateValue(startDate);
        // sap.ui.getCore().byId("idDRS").setSecondDateValue(endDate);
        sap.ui.getCore().byId("idDRSLA").setValue("");
        sap.ui.getCore().byId("idDRSLA").setMinDate(new Date());


        that.editCapDialog1.open();

      },

      onDateRangeChange: function () {
        sap.ui.getCore().byId("idDRSLA").setMinDate(new Date());
      },

      onEditCapSaveF: function () {
        if (sap.ui.getCore().byId("idProdFLA").getValue() == "" || sap.ui.getCore().byId("idDRSLA").getValue() == "") {
          MessageToast.show("Configurable Product or Valid From/To should be given")
        }
        else {

          var aUpdated = [];
          var sDate = sap.ui.getCore().byId("idDRSLA").getDateValue();
          var eDate = sap.ui.getCore().byId("idDRSLA").getSecondDateValue();

          var dateFormatt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
          var valFrom = dateFormatt.format(sDate);
          var valTo = dateFormatt.format(eDate);

          var oUpdatedCap = {
            LOCATION_ID: sap.ui.getCore().byId("idLocFLA").getValue(),
            LINE_ID: sap.ui.getCore().byId("idLineFLA").getValue(),
            PRODUCT_ID: that.oSelectedcap.PRODID,
            CAPACITY: 0,
            VALID_FROM: valFrom,
            VALID_TO: valTo

          }

          aUpdated.push(oUpdatedCap);
          that.bModel.callFunction("/createPartialLineBatch", {
            method: "GET",
            urlParameters: {
              Flag: "U",
              PRODATA: JSON.stringify(aUpdated),
              User: that.vUser
            },
            success: function (oData) {
              // that.updateDataAndRefresh();
              that.editCapDialog1.close();
              MessageToast.show("Updated Successfully");
              that.onAfterRendering();
            },

            error: function (error) {
              MessageToast.show("Failed to update data");
            },
          });
        }


      },

      onDelCap: function (oEvent) {
        var oSelected = oEvent.getSource().getBindingContext().getObject();

        var sDate = sap.ui.getCore().byId("idAssignProdDRSLA").getDateValue();
        var eDate = sap.ui.getCore().byId("idAssignProdDRSLA").getSecondDateValue();

        var dateFormatt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
        var valFrom = dateFormatt.format(sDate);
        var valTo = dateFormatt.format(eDate);

        var arraySelected = [];
        var obj = {
          LOCATION_ID: oSelected.LOCATION_ID,
          LINE_ID: oSelected.LINE_ID,
          PRODUCT_ID: oSelected.PRODID,
          CAPACITY: oSelected.CAPACITY,
          VALID_FROM: valFrom,
          VALID_TO: valTo

        }
        arraySelected.push(obj);

        var sMessage = "Are you sure you want to Delete Line" + " " + oSelected.LINE_ID + " for Product " + oSelected.PRODID;
        var sTitle = "Confirmation";

        MessageBox.confirm(sMessage, {
          title: sTitle,
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          emphasizedAction: MessageBox.Action.YES,
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.YES) {
              // Action to take if "Yes" is pressed
              that.bModel.callFunction("/createPartialLineBatch", {
                method: "GET",
                urlParameters: {
                  Flag: "D",
                  PRODATA: JSON.stringify(arraySelected),
                  User: that.vUser
                },
                success: function (oData) {

                  // that.updateDataAndRefresh()
                  that.onAfterRendering()
                  MessageToast.show("Deletion successful");

                },
                error: function (_error) {

                  MessageToast.show("Failed to delete data");
                },
              });

            } 
          }
        });
      },

      onAssignProd: function () {
        var oSelected = that.oView.getModel("oGModel").getProperty("/selectedItem")
        sap.ui.getCore().byId("prodSave").setVisible(false);
        if (oSelected === undefined) {
          sap.ui.getCore().byId("idAssignProdLocFLA").setValue(that.oCdata[0].LOCATION_ID);
          sap.ui.getCore().byId("idAssignProdLineFLA").setValue(that.oCdata[0].LINE_ID);
          sap.ui.getCore().byId("idAssignProdFLA").setValue("");
          sap.ui.getCore().byId("idAssignProdDRSLA").setValue("");
          sap.ui.getCore().byId("idAssignProdDRSLA").setMinDate(new Date());
          that.assignProdDialog.open();
        } else {
          sap.ui.getCore().byId("idAssignProdLocFLA").setValue(oSelected.LOCATION_ID);
          sap.ui.getCore().byId("idAssignProdLineFLA").setValue(oSelected.LINE_ID);
          sap.ui.getCore().byId("idAssignProdFLA").setValue("");
          sap.ui.getCore().byId("idAssignProdDRSLA").setValue("");
          sap.ui.getCore().byId("idAssignProdDRSLA").setMinDate(new Date());
          that.assignProdDialog.open();
        }
      },
      onProdValueHelp: function () {
        sap.ui.getCore().byId("idProdValuefragLA").setNoDataText("Loading..")
        var oModel = new sap.ui.model.json.JSONModel();
        var aProd = [];
        var oSelected = that.oGModel.getProperty("/selectedItem")
        var topCount = 30000
        sap.ui.core.BusyIndicator.show();
        that.bModel.read("/getRolesLocProd", {
          urlParameters: {
            "$skip": that.skip,
            "$top": topCount
          },
            filters:  [
              new Filter(
              "FACTORY_LOC",
              FilterOperator.EQ,
              oSelected.LOCATION_ID.toString()
            ),
            new Filter(
              "USER",
              FilterOperator.EQ,
             that.getUserName()
            ),
            new Filter(
              "MATERIAL_TYPE",
              FilterOperator.EQ,
             'KMAT'
            )
          ],
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            if (topCount == oData.results.length) {
              that.skip += topCount;
              that.allData = that.allData.concat(oData.results);
              that.onProdValueHelp();
            } else {
              that.skip = 0;
              that.allData = that.allData.concat(oData.results);
              oData.results = that.allData
              that.allData = []
              const unique = new Set();
             for (let i = 0; i < oData.results.length; i++) {
              const item = oData.results[i];
            const key = item.PRODUCT_ID;

             if (!unique.has(key)) {
                  unique.add(key);

              aProd.push({
             prodId: item.PRODUCT_ID,
            prod_desc: item.PROD_DESC
               });
    }
}     
              oModel.setData({
                items: aProd
              })
              sap.ui.getCore().byId("idProdValuefragLA").setModel(oModel);
            }


          },
          error: function (e) {
            sap.ui.core.BusyIndicator.hide();
          }
        });

        that.prodValuHelpDialog.open();
      },
      onProdListSelect: function (oEvent) {
        that.selProdId = oEvent.getParameters().listItem.mProperties.title;
        that.selProdDes = oEvent.getParameters().listItem.mProperties.description;

        let sLoc = sap.ui.getCore().byId("idAssignProdLocFLA").getValue();
        let aData = that.oGModel?.getProperty("/RoleMap")?.get(sLoc)
        let bVisible  = false
        if(aData?.length >0){
          if(aData.findIndex(f=>f.PRODUCT_ID == that.selProdId && f.CREATE == true) != -1){
            bVisible = true;
          }
        }
         sap.ui.getCore().byId("prodSave").setVisible(bVisible);
        sap.ui.getCore().byId("idAssignProdFLA").setValue(that.selProdId)
      },
      onAssignProdSaveF: function () {
        if (sap.ui.getCore().byId("idAssignProdDRSLA").getValue() == "" || sap.ui.getCore().byId("idAssignProdFLA").getValue() == "") {
          MessageToast.show("Configurable product/Valid From/To should not be empty")
        }
        else {
          var oSelected = that.oView.getModel("oGModel").getProperty("/selectedItem")
          var loc = sap.ui.getCore().byId("idAssignProdLocFLA").getValue();
          var line = sap.ui.getCore().byId("idAssignProdLineFLA").getValue();
          var prod = sap.ui.getCore().byId("idAssignProdFLA").getValue();
          var sDate = sap.ui.getCore().byId("idAssignProdDRSLA").getDateValue();
          var eDate = sap.ui.getCore().byId("idAssignProdDRSLA").getSecondDateValue();
          var dateFormatt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
          var valFrom = dateFormatt.format(sDate);
          var valTo = dateFormatt.format(eDate);
          var newArray = [];
          var c = 0;
          var obj = {
            LOCATION_ID: loc,
            PRODUCT_ID: that.selProdId,
            LINE_ID: oSelected.LINE_ID,
            CAPACITY: 0,
            VALID_FROM: valFrom,
            VALID_TO: valTo
          };
          newArray.push(obj);
          for (var i = 0; i < that.oCdata.length; i++) {
            if (that.oCdata[i].LOCATION_ID == loc && that.oCdata[i].LINE_ID == line && that.oCdata[i].PRODID == prod) {
              c++;
            }
          }
          if (c > 0) {
            MessageBox.error("Selected Location and Line with product" + " " + prod + " " + "already exists")
          }
          else {
            that.bModel.callFunction("/createPartialLineBatch", {
              method: "GET",
              urlParameters: {
                Flag: "C",
                PRODATA: JSON.stringify(newArray),
                User: that.vUser
              },
              success: function (oData) {
                // that.updateDataAndRefresh();
                MessageToast.show("Created Successfully");
                that.assignProdDialog.close();
                that.onAfterRendering()
              },
              error: function (error) {
                MessageToast.show("Failed to create data");
              },
            });
          }
        }
      },
      onCloseF: function () {
        if (that.editCapDialog1) {
          that.editCapDialog1.close();
        }

        if (that.assignProdDialog) {
          that.assignProdDialog.close();
        }


        if (that.prodValuHelpDialog) {
          that.prodValuHelpDialog.close()
        }
      },
      updateDataAndRefresh: function () {
        var that = this;
        // Read data for 'getProdlocline'
        var promise1 = new Promise(function (resolve, reject) {
          var oModel = that.getOwnerComponent().getModel('BModel');
          oModel.read('/getProdlocline', {
            success: function (aData) {
              that.oPdata = aData.results;
              resolve();
            },
            error: function (error) {
              console.log(error);
              reject(error);
            }
          });
        });
        // Read data for 'getLineCapacity'
        var promise2 = new Promise(function (resolve, reject) {
          var oModel = that.getOwnerComponent().getModel('BModel');
          oModel.read('/getLineCapacity', {
            headers: {
          "x-user-id": that.getUserName()
        },
            success: function (aData) {
              that.oCdata = aData.results;
              resolve();
            },
            error: function (error) {
              console.log(error);
              reject(error);
            }
          });
        });

        // Refresh UI after both promises are resolved
        Promise.all([promise1, promise2]).then(function () {
          // that.onAfterRendering();
          // that.onItem();
        });
      },
      Trigger: function () {
        var oModel = that.getOwnerComponent().getModel('BModel');
        oModel.read('/getProdlocline', {

          success: function (aData) {
            that.data = aData.results
          },
          error: function (error) {
            console.log(error)
          }
        })
      },
      CapacityTrigger: function () {
        var oModel = that.getOwnerComponent().getModel('BModel');
        oModel.read('/getLineCapacity', {
          headers: {
          "x-user-id": that.getUserName()
        },
          success: function (aData) {
            that.oCdata = aData.results
          },
          error: function (error) {
            console.log(error)
          }
        })
      },

      handleClose: function () {
        that._ProdDialog.close();
        that._ProdDialog.destroy();
        that._ProdDialog = "";
      },

      onValueforLineID: function () {
        var sVLoc = sap.ui.getCore().byId("idManfacLocLA").getValue();
        var oProd = sap.ui.getCore().byId("idConfProdLA").getValue();
        if (sVLoc.length <= 0) {
          MessageToast.show("Please Select a Location ")
          return false;
        }
        if (!that.PrdLinID_Dialog) {
          that.PrdLinID_Dialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.Prod-ln-Line", that);
        }

        var oModel = that.getOwnerComponent().getModel('BModel');
        var oLinc = []
        // debugger
        oModel.read('/getProdlocline', {

          success: function (aData) {
            var aResult = aData.results
            for (var s = 0; s < aResult.length; s++) {
              if (sVLoc == aResult[s].LOCATION_ID) {
                oLinc.push(aResult[s])
              }
            }
            var uniqueIds = {};
            var oRes = oLinc.filter(function (item) {
              if (!uniqueIds.hasOwnProperty(item.LINE_ID)) {
                uniqueIds[item.LINE_ID] = true;
                return true;
              }
              return false
            })
            var oJSONModel = new sap.ui.model.json.JSONModel();
            oJSONModel.setData({
              aItems: oRes
            })
            sap.ui.getCore().byId("Prod-ln-LineLA").setModel(oJSONModel);
            that.PrdLinID_Dialog.open();
          },
          error: function (error) {
            console.log(error)
          }
        })
      },
      onValueHelpforLine: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("LINE_ID", FilterOperator.Contains, sValue);

        oEvent.getSource().getBinding("items").filter([oFilter]);
      },
      onValueforLineDialogClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        oEvent.getSource().getBinding("items").filter([]);
        if (!oSelectedItem) {
          return;
        }
        sap.ui.getCore().byId("Line_ID").setValue(oSelectedItem.getTitle());
      },
      onValueHelpforProd: function (oEvent) {
        // oEvent.getSource()
        if (oEvent.getSource().sId == "idConfProd1") {
          var sVLoc = sap.ui.getCore().byId("idManfacLoc1").getValue()
          if (sVLoc.length <= 0) {
            MessageToast.show("Please Select a Location");
            return false;
          }
        } else {
          var sVLoc = sap.ui.getCore().byId("idManfacLocLA").getValue()
          if (sVLoc.length <= 0) {
            MessageToast.show("Please Select a Location");
            return false;
          }
        }

        if (!that.PrdLinDialog) {
          that.PrdLinDialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.Prod-ln-Prod", that);
        }

        // that.PrdLinDialog.open();
        var oModel = that.getOwnerComponent().getModel('BModel');
        var oPrd = []
        // debugger
        oModel.read('/genConfigProd', {

          success: function (aData) {
            var aResult = aData.results
            for (var s = 0; s < aResult.length; s++) {
              if (sVLoc == aResult[s].LOCATION_ID) {
                oPrd.push(aResult[s])
              }
            }
            var uniqueIds = {};
            var oRes = oPrd.filter(function (item) {
              if (!uniqueIds.hasOwnProperty(item.PRODUCT_ID)) {
                uniqueIds[item.PRODUCT_ID] = true;
                return true;
              }
              return false
            })
            var oJSONModel = new sap.ui.model.json.JSONModel();
            oJSONModel.setData({
              aItems: oRes
            })
            sap.ui.getCore().byId("Prod-ln-ProdLA").setModel(oJSONModel);
            that.PrdLinDialog.open();
          },
          error: function (error) {
            console.log(error)
          }
        })
      },
      // for ProdvalueHelp.fragment Product search
      onValuforProd: function (oEvent) {
        var sQuery =
          oEvent.getParameter("value") || oEvent.getParameter("newValue"),
          sId = oEvent.getParameter("id"),
          oFilters = [];
        // Check if search filter is to be applied
        sQuery = sQuery ? sQuery.trim() : "";

        if (sId.includes("idProdValuefragLA")) {
          if (sQuery !== "") {
            oFilters.push(
              new Filter({
                filters: [
                  new Filter("prodId", FilterOperator.Contains, sQuery),
                  new Filter("prod_desc", FilterOperator.Contains, sQuery)
                ],
                and: false,
              })
            );
          }
          sap.ui.getCore().byId("idProdValuefragLA").getBinding("items").filter(oFilters);
        }
      },

      onValueforProdDialogClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        oEvent.getSource().getBinding("items").filter([]);
        if (!oSelectedItem) {
          return;
        }
        sap.ui.getCore().byId("idConfProdLA").setValue(oSelectedItem.getTitle());

      },
      onValueHelpRequest: function (oEvent) {
        if (!that.LocDialog) {
          that.LocDialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.Prod-ln-loc", that);
        }
        that.LocDialog.open();
        var oModel = that.getOwnerComponent().getModel('BModel');
        // debugger
        oModel.read('/getFactoryLocation', {

          success: function (aData) {
            var aResult = aData.results
            var uniqueIds = {};
            var aResult = aResult.filter(function (item) {
              if (!uniqueIds.hasOwnProperty(item.LOCATION_ID)) {
                uniqueIds[item.LOCATION_ID] = true;
                return true;
              }
              return false
            })
            var oJSONModel = new sap.ui.model.json.JSONModel();
            oJSONModel.setData({
              aItems: aResult
            })
            sap.ui.getCore().byId("Prod-ln-locLA").setModel(oJSONModel);
            that.LocDialog.open();
          },
          error: function (error) {
            console.log(error)
          }
        })


      },
      onValueHelpforLoc: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("LOCATION_ID", FilterOperator.Contains, sValue);

        oEvent.getSource().getBinding("items").filter([oFilter]);
      },
      onValueforLocDialogClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        oEvent.getSource().getBinding("items").filter([]);
        if (!oSelectedItem) {
          return;
        }
        sap.ui.getCore().byId("idManfacLocLA").setValue(oSelectedItem.getTitle());
      },
      handleMidClose: function (oEvent) {
        // this.getView().byId("fcl").setLayout(this.FCLLayout.TwoColumnsMidExpanded);
        var oFCL = this.oView.getParent().getParent();
        oFCL.setLayout(sap.f.LayoutType.StartColumnFullScreen)
        sap.ui.controller("vcpapp.vcplineapps.controller.Home").onTab()
      },

      handlemidClose: function () {
        var oFCL = this.oView.getParent().getParent();
        oFCL.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded)

      },

      handleSelection: function () {
        var sLoc = sap.ui.getCore().byId("idManfacLocLA").getValue();
        var sProd = sap.ui.getCore().byId("idConfProdLA").getValue();
        var sLine = sap.ui.getCore().byId("Line_ID").getValue();
        var iCapacity = sap.ui.getCore().byId("idCapacityLA").getValue();
        var sDates = sap.ui.getCore().byId("DRS1LA").getValue(), sFromDt = null, sToDt = null;
        if (sDates) {
          function convertDate(inputFormat, joinBy) {
            function pad(s) {
              return (s < 10) ? '0' + s : s;
            }
            var d = new Date(inputFormat)
            return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(joinBy)
          }
          sFromDt = convertDate(sDates.split("-")[0].trim(), '-');
          sToDt = convertDate(sDates.split("-")[1].trim(), '-');
        }
        var updatedDetails = {};
        var updatedArray = [];
        var newDetails = {};
        var newArray = [];
        if (sLoc && sLine && sProd.length > 0) {
          // var table = that.byId("")
          //   for (var k = 0; k < sProduct.length; k++) {
          // var tableItems = table.getItems();
          newDetails = {
            LOCATION_ID: sLoc,
            PRODUCT_ID: sProd,
            LINE_ID: sLine,
          }
          newArray.push(newDetails);
          for (var s = 0; s < that.data.length; s++) {
            if (sLoc === that.data[s].LOCATION_ID
              && sLine === that.data[s].LINE_ID
              && sProd === that.data[s].PRODUCT_ID) {
              updatedDetails = {
                LOCATION_ID: sLoc,
                PRODUCT_ID: sProd,
                LINE_ID: sLine,
              }
              updatedArray.push(updatedDetails);
            }
          }
          //   }
          newArray = newArray.filter((obj1) => !updatedArray.some((obj2) => obj1.LOCATION_ID === obj2.LOCATION_ID &&
            obj1.PRODUCT_ID === obj2.PRODUCT_ID &&
            obj1.LINE_ID === obj2.LINE_ID));

          if (newArray.length === 0) {
            if (that._ProdDialog) {
              that._ProdDialog.close();
              that._ProdDialog.destroy(true);
              that._ProdDialog = null;
            }
            MessageToast.show("Selected Location,Line and Product already exists.");
          }
          else {
            var User = "";
            if (sap.ushell.Container) {
              let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
              User = (email) ? email : "";
            }
            var bModel = that.getOwnerComponent().getModel("BModel");
            bModel.callFunction("/createLineBatch", {
              method: "GET",
              urlParameters: {
                PRODATA: JSON.stringify(newArray),
                User: User
              },
              success: function (oData) {
                that.createCapacity()
                that.updateDataAndRefresh();
                MessageToast.show("Created Successfully");
                // sap.ui.controller("vcpapp.vcplineapps.controller.Home").onRestore()
                // }
                if (that._ProdDialog) {
                  that._ProdDialog.close();
                  that._ProdDialog.destroy(true);
                  that._ProdDialog = null;
                }

                // try{
                //   // let aClassList = document.getElementById("::getProdloclineList--fe::FilterBar::").children[0].classList;
                //   if(Array.from(aClassList).findIndex(f=>f == "sapMTokenizerEmpty") == -1){
                //     // var data = that.byId("vcpapp.vcplocationproductline::sap.suite.ui.generic.template.ListReport.view.ListReport::getProdlocline--responsiveTable")
                //     // data.getBinding("items").refresh()
                //   }
                // }
                // catch{

                // }
                // that.byId("idCopyButton").setEnabled(false);
              },
              error: function (error) {
                MessageToast.show("Failed to create data");
              },
            });
          }
        }
        else {
          MessageToast.show("Please fill in all details");
        }
      },
      createCapacity: function () {
        that = this;
        that.oGModel = that.getOwnerComponent().getModel("oGModel");
        var updatedDetails = {};
        var updatedArray = [];
        var newDetails = {};
        var newArray = [];
        var sLoc = sap.ui.getCore().byId("idManfacLocLA").getValue();
        var sProd = sap.ui.getCore().byId("idConfProdLA").getValue();
        var sLine = sap.ui.getCore().byId("Line_ID").getValue();
        var iCapacity = sap.ui.getCore().byId("idCapacityLA").getValue();
        var sDates = sap.ui.getCore().byId("DRS1LA").getValue(), sFromDt = null, sToDt = null;
        if (sDates) {
          function convertDate(inputFormat, joinBy) {
            function pad(s) {
              return (s < 10) ? '0' + s : s;
            }
            var d = new Date(inputFormat)
            return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(joinBy)
          }
          sFromDt = convertDate(sDates.split("-")[0].trim(), '-');
          sToDt = convertDate(sDates.split("-")[1].trim(), '-');
        }

        if (sLoc && sLine && sProd.length > 0) {
          newDetails = {
            LOCATION_ID: sLoc,
            PRODUCT_ID: sProd,
            LINE_ID: sLine,
            CAPACITY: iCapacity,
            VALID_FROM: sFromDt,
            VALID_TO: sToDt
          }
          newArray.push(newDetails);
          for (var s = 0; s < that.oCdata.length; s++) {
            if (sLoc === that.oCdata[s].LOCATION_ID
              && sLine === that.oCdata[s].LINE_ID
              && sProd === that.oCdata[s].PRODID) {
              updatedDetails = {
                LOCATION_ID: sLoc,
                PRODUCT_ID: sProd,
                LINE_ID: sLine,
                CAPACITY: iCapacity,
                VALID_FROM: sFromDt,
                VALID_TO: sToDt
              }
              updatedArray.push(updatedDetails);
            }
          }
          newArray = newArray.filter((obj1) => !updatedArray.some((obj2) => obj1.LOCATION_ID === obj2.LOCATION_ID &&
            obj1.PRODUCT_ID === obj2.PRODUCT_ID &&
            obj1.LINE_ID === obj2.LINE_ID));

          if (newArray.length === 0) {
            var bModel = that.getOwnerComponent().getModel("BModel");
            bModel.callFunction("/createPartialLineBatch", {
              method: "GET",
              urlParameters: {
                Flag: "U",
                PRODATA: JSON.stringify(updatedArray),
                User: User
              },
              success: function (oData) {
                that.updateDataAndRefresh();

                // var data = that.byId("tab1")
                // data.getBinding("items").refresh()
                // that.updateDataAndRefresh()
                // MessageToast.show("Create Successfully");
                // that.byId("idCopyButton").setEnabled(false);
              },
              error: function (error) {
                MessageToast.show("Failed to update data");
              },
            });


          }
          else {
            var User = "";
            if (sap.ushell.Container) {
              let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
              User = (email) ? email : "";
            }
            var bModel = that.getOwnerComponent().getModel("BModel");
            bModel.callFunction("/createPartialLineBatch", {
              method: "GET",
              urlParameters: {
                Flag: "C",
                PRODATA: JSON.stringify(newArray),
                User: User
              },
              success: function (oData) {
                that.updateDataAndRefresh();
                // MessageToast.show("Created Successfully");
                // }
                // if (that.oDialogFragment) {
                //   // that.oDialogFragment.close();
                //   that.oDialogFragment.destroy(true);
                //   that.oDialogFragment = null;
                //   delete that.oDialogFragment;
                // }
              },
              error: function (error) {
                MessageToast.show("Failed to create data");
              },
            });

          }
        }

        else {
          MessageToast.show("Please fill in all details");
        }
      },
      dateChange: function (oEvent) {
        var oDatePicker = sap.ui.getCore().byId("idDRSLA");
        oDatePicker.addStyleClass("datestimes")
        jQuery.sap.delayedCall(0, this, function () {
          oDatePicker.$().find("input").blur();

          sap.ui.getCore().byId("idDRSLA").setMinDate(new Date());


        });

      },

      dateChange1: function (oEvent) {
        var oDatePicker = sap.ui.getCore().byId("idAssignProdDRSLA");
        oDatePicker.addStyleClass("datestimes")
        jQuery.sap.delayedCall(0, this, function () {
          oDatePicker.$().find("input").blur();
          sap.ui.getCore().byId("idAssignProdDRSLA").setMinDate(new Date())


        });
      },
      dateChangesTo: function (oEvent) {
        var oDatePicker = sap.ui.getCore().byId("DRS1LA");
        oDatePicker.addStyleClass("datestimes")
        jQuery.sap.delayedCall(0, this, function () {
          oDatePicker.$().find("input").blur();
        });

      },


      // onEditCapacity: function (oEvent) {
      //   if (that.byId("Detail").getSelectedItems().length == 0) {
      //     MessageBox.show("Please Select a Row")
      //     return false
      //   }
      //   // that.byId("Detail").getSelectedItems()
      //   var oEdFields = that.byId("Detail").getSelectedItem().getBindingContext().getObject()
      //   if (oEdFields.CAPACITY == undefined) {
      //     MessageToast.show("This Product has no Capacity")
      //     return false
      //   }

      //   var oModel = this.getOwnerComponent().getModel("BModel");
      //   // var vUser = that.getUserName();

      //   var oEntry = {
      //     USERDATA: []
      //   };
      //   let oParamVals = {
      //     USEREMAIL: vUser
      //   };
      //   oEntry.USERDATA.push(oParamVals);
      //   oModel.callFunction("/genUserAppVisibility", {
      //     method: "GET",
      //     urlParameters: {
      //       FLAG: 'G',
      //       USERDATA: JSON.stringify(oEntry.USERDATA)
      //     },
      //     success: function (oData) {
      //       var aResults = oData.results;
      //       if (aResults.length > 0) {
      //         var isUserLoggedIn = true;
      //       }
      //       if (isUserLoggedIn) {
      //         if (aResults[0].UPDATE_CHK === "disabled") {
      //           that.byId("onEditCap").setEnabled(false);
      //           MessageToast.show("User has not been authorized to delete this action");
      //         }
      //         else {
      //           if (oEdFields.PRODUCT_ID == undefined || oEdFields.length == 0) {
      //             MessageBox.show("Please Pick the Capacity Valid Product");
      //             return false
      //           }
      //           var ValidFrm = new Date(that.byId("Detail").getSelectedItem().getCells()[2].getText())
      //           // ValidFrm = ValidFrm.toDateString()
      //           var ValidTo = new Date(that.byId("Detail").getSelectedItem().getCells()[3].getText())
      //           //  ValidTo = ValidTo.toDateString()
      //           // if (!that.EditDialog) {
      //           //   that.EditDialog = sap.ui.xmlfragment(
      //           //     "vcpapp.vcplineapps.view.LineCapEdit",
      //           //     that
      //           //   );
      //           //   that.getView().addDependent(that.EditDialog);
      //           // }
      //           sap.ui.getCore().byId("idManfacLoc1").setValue(oEdFields.LOCATION_ID);
      //           sap.ui.getCore().byId("Line_ID1").setValue(oEdFields.LINE_ID);
      //           sap.ui.getCore().byId("idConfProd1").setValue(oEdFields.PRODUCT_ID);
      //           sap.ui.getCore().byId("idCapacity1").setValue(oEdFields.CAPACITY);
      //           sap.ui.getCore().byId("EDRS1").setFrom(ValidFrm)
      //           sap.ui.getCore().byId("EDRS1").setTo(ValidTo);
      //           var oDatePicker = sap.ui.getCore().byId("EDRS1");
      //           oDatePicker.addStyleClass("datestime")
      //           // sap.ui.getCore().byId("idCapacity").focus()
      //           that.oDate2 = sap.ui.getCore().byId("EDRS1");
      //           that.oCurrentDate2 = new Date();
      //           that.oDate2.setMinDate(that.oCurrentDate2);
      //           that.EditDialog.open()


      //         }
      //       }
      //       else {
      //         that.byId("onEditCap").setEnabled(false);
      //         MessageToast.show("User has not been authorized to edit this action");
      //       }
      //     }
      //   })

      // },
      UpdateCap: function (oEvent) {
        that = this;
        that.oGModel = that.getOwnerComponent().getModel("oGModel");
        // var updatedDetails = {};
        // var updatedArray = [];
        var newDetails = {};
        var newArray = [];
        var sProduct = sap.ui.getCore().byId("idConfProd1").getValue();
        var dLocation = sap.ui.getCore().byId("idManfacLoc1").getValue();
        var pLine = sap.ui.getCore().byId("Line_ID1").getValue();
        var capacity = sap.ui.getCore().byId("idCapacity1").getValue();
        var sDates = sap.ui.getCore().byId("EDRS1").getValue(), sFromDt = null, sToDt = null;
        if (sDates) {
          function convertDate(inputFormat, joinBy) {
            function pad(s) {
              return (s < 10) ? '0' + s : s;
            }
            var d = new Date(inputFormat)
            return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(joinBy)
          }
          sFromDt = convertDate(sDates.split(" - ")[0].trim(), '-');
          sToDt = convertDate(sDates.split(" - ")[1].trim(), '-');
        }
        if (dLocation && pLine && sProduct.length > 0) {
          newDetails = {
            LOCATION_ID: dLocation,
            PRODUCT_ID: sProduct,
            LINE_ID: pLine,
            CAPACITY: capacity,
            VALID_FROM: sFromDt,
            VALID_TO: sToDt
          }
          newArray.push(newDetails);
          var User = "";
          if (sap.ushell.Container) {
            let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
            User = (email) ? email : "";
          }
          var bModel = that.getOwnerComponent().getModel("BModel");
          bModel.callFunction("/createPartialLineBatch", {
            method: "GET",
            urlParameters: {
              Flag: "U",
              PRODATA: JSON.stringify(newArray),
              User: User
            },
            success: function (oData) {

              if (that.EditDialog) {
                // that.oDialogFragment.close();
                that.EditDialog.destroy(true);
                that.EditDialog = null;
                delete that.EditDialog;
              }

              that.updateDataAndRefresh()
              MessageToast.show("Updated Successfully");


            },
            error: function (error) {
              MessageToast.show("Failed to update data");
            },
          });
          //   }
        }
      },
      Close: function () {
        this.EditDialog.close()
      },
      getUserName: function () {
        that = this;
        let vUser;
        if (sap.ushell.Container) {
          let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
          vUser = (email) ? email : "";

        }
         if(!vUser){
                vUser='null';
            }
        return vUser;
      },
      //Line Prod-Line
      // onBatchDelete: function (oEvent) {
      //   var oSel = that.byId("Detail").getSelectedItems()
      //   if (oSel.length <= 0) {
      //     MessageToast.show("Please Select a Row")
      //     return false
      //   }
      //   else {
      //     var sFieldsFd = that.byId("Detail").getSelectedItem().getBindingContext().getObject()
      //     var oLnLoc = that.byId("Detail").getSelectedItem().getCells()[0].getText();
      //     var oLnProd = that.byId("Detail").getSelectedItem().getCells()[1].getText();
      //     var oLnLine = that.byId("Detail").getSelectedItem().getCells()[2].getText();

      //     if (oLnProd.length == 0 && oLnLine.length == 0 && oLnLoc.length == 0) {
      //       MessageToast.show("Please select a Required Valid data")
      //       return false;
      //     } else {
      //       var oModel = this.getOwnerComponent().getModel("BModel");
      //       var vUser = that.getUserName();
      //       var oEntry = {
      //         USERDATA: []
      //       };
      //       let oParamVals = {
      //         USEREMAIL: vUser
      //       };
      //       oEntry.USERDATA.push(oParamVals);
      //       oModel.callFunction("/genUserAppVisibility", {
      //         method: "GET",
      //         urlParameters: {
      //           FLAG: 'G',
      //           USERDATA: JSON.stringify(oEntry.USERDATA)
      //         },
      //         success: function (oData) {
      //           var aResults = oData.results;
      //           // var aResults = [ { 
      //           //   "CREATE_CHK": "disabled",
      //           //   "UPDATE_CHK": "disabled",
      //           //   "DELETE_CHK": "enabled"
      //           //    }]


      //           if (aResults.length > 0) {
      //             var isUserLoggedIn = true;
      //           }
      //           if (isUserLoggedIn) {
      //             if (aResults[0].DELETE_CHK === "disabled") {
      //               that.byId("idDeleteButton").setEnabled(false);
      //               MessageToast.show("User has not been authorized to delete this action");
      //             }
      //             else {
      //               var arraySelected = [],
      //                 default1 = {};
      //               var table = that.byId("Detail");
      //               var selectedItems = table.getSelectedItem();

      //               if (selectedItems.length === 1) {
      //                 var sText = "Delete this object?";
      //               }
      //               else if (selectedItems.length > 1) {
      //                 var sText = "Delete the selected objects?";
      //               }
      //               // for(var i=0;i<selectedItems.length;i++){
      //               default1.LOCATION_ID = sFieldsFd.LOCATION_ID;
      //               default1.LINE_ID = sFieldsFd.LINE_ID;
      //               default1.PRODUCT_ID = sFieldsFd.PRODUCT_ID;
      //               arraySelected.push(default1);
      //               default1 = {};
      //               // }
      //               var User = "";
      //               if (sap.ushell.Container) {
      //                 let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
      //                 User = (email) ? email : "";
      //               }

      //               var sText =
      //                 "Do you want to delete the  Capacity & Product " +
      //                 " - " +
      //                 sFieldsFd.CAPACITY + "  &&  " + sFieldsFd.PRODUCT_ID + ' ?';
      //               sap.m.MessageBox.warning(sText, {
      //                 title: "Confirmation",
      //                 actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
      //                 onClose: function (oAction) {
      //                   if (oAction === sap.m.MessageBox.Action.YES) {
      //                     sap.ui.core.BusyIndicator.show();
      //                     var bModel = that.getOwnerComponent().getModel("BModel");
      //                     bModel.callFunction("/DeleteLineBatch", {
      //                       method: "GET",
      //                       urlParameters: {
      //                         Flag: "D",
      //                         PRODATA: JSON.stringify(arraySelected),
      //                         User: User
      //                       },
      //                       success: function (oData) {
      //                         sap.ui.core.BusyIndicator.hide();
      //                         that.onDelete();
      //                         // sap.ui.controller("vcpapp.vcplineapps.controller.Home").onRestore()
      //                         // that.updateDataAndRefresh()
      //                         // that.onAfterRendering()
      //                         MessageToast.show("Deletion successful");
      //                         that.onAfterRendering()
      //                         // that.onAfterRendering()
      //                       },
      //                       error: function (_error) {
      //                         sap.ui.core.BusyIndicator.hide();
      //                         MessageToast.show("Failed to delete data");
      //                       },
      //                     });
      //                   }

      //                 },
      //                 error: function (oData, error) {
      //                   MessageToast.show("error");
      //                 }
      //               });
      //             }
      //           }
      //           else {
      //             that.byId("idDeleteButton").setEnabled(false);
      //             MessageToast.show("User has not been authorized to delete this action");
      //           }
      //         },
      //       });
      //     }

      //   }


      // },

      onDelete: function () {
        var oCapSele = that.byId("Detail").getSelectedItem().getBindingContext().getObject()
        if (oCapSele.CAPACITY > 0) {
          var oModel = this.getOwnerComponent().getModel("BModel");
          var vUser = that.getUserName();
          var oEntry = {
            USERDATA: []
          };
          let oParamVals = {
            USEREMAIL: vUser
          };
          oEntry.USERDATA.push(oParamVals);
          oModel.callFunction("/genUserAppVisibility", {
            method: "GET",
            urlParameters: {
              FLAG: 'G',
              USERDATA: JSON.stringify(oEntry.USERDATA)
            },
            success: function (oData) {

              var aResults = oData.results;



              if (aResults.length > 0) {
                var isUserLoggedIn = true;
              }
              if (isUserLoggedIn) {
                if (aResults[0].DELETE_CHK === "disabled") {
                  that.byId("idDeleteButton").setEnabled(false);
                  MessageToast.show("User not authorised for this Delete action");

                }
                else {
                  var arraySelected = [],
                    default1 = {};
                  var table = that.byId("Detail")
                  var selectedItems = table.getItems();

                  if (selectedItems.length === 1) {
                    var sText = "Delete this object?";
                  }
                  else if (selectedItems.length > 1) {
                    var sText = "Delete the selected objects?";
                  }
                  // for(var i=0;i<selectedItems.length;i++){
                  default1.LOCATION_ID = oCapSele.LOCATION_ID
                  default1.LINE_ID = oCapSele.LINE_ID
                  default1.PRODUCT_ID = oCapSele.PRODUCT_ID
                  default1.CAPACITY = oCapSele.CAPACITY
                  default1.VALID_TO = oCapSele.VALID_TO
                  default1.VALID_FROM = oCapSele.VALID_FROM
                  arraySelected.push(default1);
                  default1 = {};
                  // }
                  var User = "";
                  if (sap.ushell.Container) {
                    let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                    User = (email) ? email : "";
                  }

                  sap.ui.core.BusyIndicator.show();
                  var bModel = that.getOwnerComponent().getModel("BModel");
                  bModel.callFunction("/createPartialLineBatch", {
                    method: "GET",
                    urlParameters: {
                      Flag: "D",
                      PRODATA: JSON.stringify(arraySelected),
                      User: User
                    },
                    success: function (oData) {
                      sap.ui.core.BusyIndicator.hide();
                      // MessageToast.show(oData.createPartialLineBatch);
                    },
                    error: function (_error) {
                      sap.ui.core.BusyIndicator.hide();
                      MessageToast.show("Failed to Delete data");
                    }
                  })
                  // }
                  //  },
                  //   error: function (oData, error) {
                  //       MessageToast.show("error");
                  //  }
                  //  });
                }
              }
              else {
                that.byId("idDeleteButton").setEnabled(false);
                MessageToast.show("User not authorised for this Delete action");
              }
            },
          });
        } else {
          return false;
        }
      },
      onGoSearch: function (oEvent) {
        var TFilter = []
        var stnlist = that.getView().byId("Detail")
        var oItemBind = stnlist.getBinding("items")
        var sValue = oEvent.getSource().getValue();
        var NewFilter = new sap.ui.model.Filter("PRODUCT_ID", sap.ui.model.FilterOperator.Contains, sValue)
        TFilter.push(NewFilter)
        oItemBind.filter(TFilter)
      },
      getAllPartial: function () {
        var topCount = 30000
        that.bModel.read("/genPartialProd", {
          urlParameters: {
            "$skip": that.skip,
            "$top": topCount
          },
          success: function (oData) {
            if (topCount == oData.results.length) {
              that.skip += topCount;
              that.allData = that.allData.concat(oData.results);
              that.getAllPartial();
            } else {
              that.skip = 0;
              that.allData = that.allData.concat(oData.results);
              oData.results = that.allData
              that.allData = []
              var PRDModel = new sap.ui.model.json.JSONModel();
              // PRDModel.setSizeLimit(1000);
              PRDModel.setData({
                itemPRD: oData.results
              });
              that.oGModel.setProperty("/PartialProd", oData.results);
            }

          }
        })
      },

      getAllLineCap: function () {
        var topCount = 30000
        that.bModel.read("/getLineCapacity", {
          urlParameters: {
            "$skip": that.skip,
            "$top": topCount
          },
          headers: {
          "x-user-id": that.getUserName()
        },
          success: function (oData) {
            if (topCount == oData.results.length) {
              that.skip += topCount;
              that.allData = that.allData.concat(oData.results);
              that.getAllLineCap();
            } else {
              that.skip = 0;
              that.allData = that.allData.concat(oData.results);
              oData.results = that.allData
              that.oCdata = that.allData;
              that.allData = []

              var oFCL = that.oView.getParent().getParent();
              oFCL.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
              that.onItem();
            }
          }
        })

      }
    });
  });