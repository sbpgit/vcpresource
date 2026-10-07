sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "../model/formatter"
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, formatter) {
    "use strict";
    var that;
    return Controller.extend("vcpapp.vcplineapps.controller.Home", {
      formatter: formatter,
      onInit: function () {
        that = this
        // this.variantModel = new JSONModel();
        // this.viewDetails = new JSONModel();
        // that.variantModel.setSizeLimit(5000);
        // that.viewDetails.setSizeLimit(5000);
        if (!that.newDetailsDialog) {
          that.newDetailsDialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.ManfacLineLoca", this);
        }
        if (!that.Line_ID_Dialog) {
          that.Line_ID_Dialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.LineID", this);
        }
        if (!this._valueHelpDialogLoc) {
          this._valueHelpDialogLoc = sap.ui.xmlfragment(
            "vcpapp.vcplineapps.view.LocDialog",
            this
          );
          this.getView().addDependent(this._valueHelpDialogLoc);
        }
        if (!this._valueHelpDialogProd) {
          this._valueHelpDialogProd = sap.ui.xmlfragment(
            "vcpapp.vcplineapps.view.LineDialog",
            this
          );
          this.getView().addDependent(this._valueHelpDialogProd);
        }
        // if (!this._nameFragment) {
        //   this._nameFragment = sap.ui.xmlfragment(
        //     "vcpapp.vcplineapps.view.NameVariant",
        //     this
        //   );
        //   this.getView().addDependent(this._nameFragment);
        // }
        // if (!this._popOver) {
        //   this._popOver = sap.ui.xmlfragment(
        //     "vcpapp.vcplineapps.view.PopOver",
        //     this
        //   );
        //   this.getView().addDependent(this._popOver);
        // }
        sap.ui.core.BusyIndicator.show();
        that.getUser();

        that.getOwnerComponent().getModel("BModel").read("/getUserPreferences", {
          filters: [
            new Filter("PARAMETER", FilterOperator.EQ, "MAX_RECORDS")
          ],
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            that.getOwnerComponent().getModel("oGModel").setProperty("/MaxCount", oData.results[0].PARAMETER_VALUE);

            // that.getAllLine()

          },
          error: function (oData, error) {
            sap.ui.core.BusyIndicator.hide();
            console.log(error)
          },
        });

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

      onAfterRendering: function () {
        this.viewDetails = new JSONModel();
        that.viewDetails.setSizeLimit(5000);
        this.variantModel = new JSONModel();
        that.variantModel.setSizeLimit(5000);
        that.deletedArray = [];
        that.oGModel = that.getOwnerComponent().getModel("oGModel");
        that.bModel = that.getOwnerComponent().getModel("BModel");
        that.oLocG = that.byId("idManLocatLA");
        that.oLineG = that.byId("idFLineLA");
        this.oLineList = sap.ui.getCore().byId("selLineDialogLA");
        this.oLocList = sap.ui.getCore().byId("selectDialogLA");
        that.skip = 0
        that.allData = [];

         that.bModel.read("/getRolesAccess", {
          filters: [new Filter("USER", FilterOperator.EQ, that.getUser())],
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
            }
             that.getData();
            //  that.getVariantData();
            that.oGModel.setProperty("/RoleMap", that.RoleMap);
          },
          error: function (oResponse) {
            console.error(oResponse);
          },
        });

        //  that.getAllLineCap(); temp comment
        // that.getData();
        // that.getVariantData();

        // }
      },

      // this function data used in Details Controller, why we call here because of that.oCdata Global variable called in Details controller in onItem() function, 
      // at that time initilly its not triggered, in this function initially we called in getAllLine() function
      getAllLineCap: function () {
        var topCount = 30000
        sap.ui.core.BusyIndicator.show();
        that.bModel.read("/getLineCapacity", {
          urlParameters: {
            "$skip": that.skip,
            "$top": topCount
          },
            headers: {
          "x-user-id": that.getUser()
        },
          success: function (oData) {
            sap.ui.core.BusyIndicator.hide();
            if (topCount == oData.results.length) {
              that.skip += topCount;
              that.allData = that.allData.concat(oData.results);
              that.getAllLineCap();
            } else {
              that.skip = 0;
              that.allData = that.allData.concat(oData.results);
              oData.results = that.allData
              that.oCdata = that.allData;
              // sap.ui.getCore().byId("")
              that.oGModel.setProperty("/oCdata", that.oCdata);
              that.allData = []

              sap.ui.core.BusyIndicator.show();
              that.getAllLine()
              //  that.onDetails()
              // var oCurrentObj =
              // {
              //   LOCATION_ID: that.oLineObjects[0].LOCATION_ID,
              //   LINE_ID: that.oLineObjects[0].LINE_ID,
              //   LINE_DESC: that.oLineObjects[0].LINE_DESC,
              //   LOCATION_DESC: that.oLineObjects[0].LOCATION_DESC
              // };
              // // );
              // that.getOwnerComponent().getModel("oGModel").setProperty("/selectedItem", oCurrentObj);
              // sap.ui.controller("vcpapp.vcplineapps.controller.Detail").onItem(oEvent)


              // that.onItem();
            }
          }
        })

      },
       // Helper to normalize input (object or ID)
      resolveLocationId(locationRef) {
        return typeof locationRef === 'object' && locationRef !== null
          ? locationRef.LOCATION_ID
          : locationRef;
      },

      updateRole(locationRef) {
        const locationId = this.resolveLocationId(locationRef);
          let bUpdate = false;
        if(that.RoleMap?.get(locationId)){
          if(that.RoleMap?.get(locationId).findIndex(f=>f.UPDATE == true) !=-1){
            bUpdate = true;
          }
        }
        return bUpdate;
      },

      deleteRole(locationRef) {
        const locationId = this.resolveLocationId(locationRef);
        let bDelete = false;
         if(that.RoleMap?.get(locationId)){
          if(that.RoleMap?.get(locationId).findIndex(f=>f.DELETE == true) !=-1){
            bDelete = true;
          }
        }
          return bDelete;
      },

      createRole(locationRef) {
        const locationId = this.resolveLocationId(locationRef);
        let bCreate = false;
        if(that.RoleMap?.get(locationId)){
          if(that.RoleMap?.get(locationId).findIndex(f=>f.CREATE == true) !=-1){
            bCreate = true;
          }
        }
        return bCreate;
      },

      getAllLine: function () {

        var topCount = 30000  //that.getOwnerComponent().getModel("oGModel").getProperty("/MaxCount")
        sap.ui.core.BusyIndicator.show();
        that.getOwnerComponent().getModel("BModel").read("/getLine", {

          urlParameters: {
            "$skip": that.skip,
            "$top": topCount
          },
          headers: {
          "x-user-id": that.getUser()
        },
          success: function (oData) {
          
            if (topCount == oData.results.length) {
              that.skip += topCount;
              that.allData = that.allData.concat(oData.results);
              that.getAllLine();
            } else {
              that.skip = 0;
              that.allData = that.allData.concat(oData.results);
              that.oLineObjects = that.allData
              that.oModel = new sap.ui.model.json.JSONModel();
              that.oModel.setData({
                aItems: that.oLineObjects
              })

              that.getView().byId("tab1LA").setModel(that.oModel);


              if (that.byId("tab1LA").getItems().length > 0) {
                // that.byId("tab1LA").getItems()[0].setSelected(true);
                that.getView().byId("tab1LA").getItems()[0].setSelected(true);
                that.allData = []
              }
              else {
                that.allData = []
              }

              var oFCL = that.oView.getParent().getParent();
              oFCL.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
                sap.ui.core.BusyIndicator.hide();

              //   that.getAllLineCap()
              that.onDetails()
            }
          },
          error: function (error) {
            sap.ui.core.BusyIndicator.hide();
            MessageToast.show("error");
          }

        })
      },


      onGo: function () {

        var ildLoc = that.byId("idManLocatLA").getValue();
        var ildLine = that.byId("idFLineLA").getValue();

        var sArr = that.oLineObjects.filter(function (obj) {
          // both filters provided
          if (ildLoc && ildLine) {
            return obj.LOCATION_ID === ildLoc && obj.LINE_ID === ildLine;
          }
          // only location filter
          else if (ildLoc) {
            return obj.LOCATION_ID === ildLoc;
          }
          // only line filter
          else if (ildLine) {
            return obj.LINE_ID === ildLine;
          }
          // no filters → return everything
          return true;
        });

        // if nothing matched, keep full list
        if (sArr.length === 0) {
          sArr = that.oLineObjects;
        }

        var zModel = new sap.ui.model.json.JSONModel();
        zModel.setData({ aItems: sArr });

        that.getView().byId("tab1LA").setModel(zModel)
        // that.getView().byId("tab1LA").getItems()[0].setSelected(true);
        // if (ildLoc.length > 0 || ildLine.length > 0) {

        //   that.saveDefaultVariant();

        // }

        that.onDetails()

      },

      onDetails: function (oEvent) {
        if (oEvent == undefined) {
          // var itemSel = that.getView().getModel("oGModel").getProperty("/selectedItem");
          var oTab1 = that.getView().byId("tab1LA");
          var aItems = oTab1.getItems();
          var oSelectedItem = oTab1.getSelectedItem();
          if (aItems.length > 0) {
            if (oSelectedItem) {
              var itemSel = oSelectedItem.getBindingContext().getObject()
              var oTaData = oTab1.oModels.undefined.oData.aItems
              for (var i = 0; i < oTaData.length; i++) {
                if (oTaData[i].LOCATION_ID == itemSel.LOCATION_ID && oTaData[i].LINE_ID == itemSel.LINE_ID) {
                  oTab1.setSelectedItem(oTaData[i], true)
                  oSelectedItem = oTaData[i]
                  break;
                }
              }
              var oFCL = that.oView.getParent().getParent();
              oFCL.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
              // that.getView().getModel("oGModel").setProperty("/",
              var oCurrentObj =
              {
                LOCATION_ID: oSelectedItem.LOCATION_ID,
                LINE_ID: oSelectedItem.LINE_ID,
                LINE_DESC: oSelectedItem.LINE_DESC,
                LOCATION_DESC: oSelectedItem.LOCATION_DESC
              };
              // );
              that.getOwnerComponent().getModel("oGModel").setProperty("/selectedItem", oCurrentObj);
              sap.ui.controller("vcpapp.vcplineapps.controller.Detail").onItem(oEvent)
              //  sap.ui.controller("vcpapp.vcplineapps.controller.Detail").getAllLineCap(oEvent)
              // sap.ui.controller("vcpapp.vcplineapps.controller.Detail").onAfterRendering(oEvent)

            }
            else {
              oTab1.setSelectedItem(aItems[0], true);
              oSelectedItem = aItems[0];
              var oFCL = that.oView.getParent().getParent();
              oFCL.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
              // that.getView().getModel("oGModel").setProperty("/",
              var oCurrentObj =
              {
                LOCATION_ID: oSelectedItem.getBindingContext().getObject().LOCATION_ID,
                LINE_ID: oSelectedItem.getBindingContext().getObject().LINE_ID,
                LINE_DESC: oSelectedItem.getBindingContext().getObject().LINE_DESC,
                LOCATION_DESC: oSelectedItem.getBindingContext().getObject().LOCATION_DESC
              }
              // );
              that.getOwnerComponent().getModel("oGModel").setProperty("/selectedItem", oCurrentObj);


            }

          }
        }
        else {
          var oCurrentObj = oEvent.getSource().getSelectedItem().getBindingContext().getObject();
          var oFCL = that.oView.getParent().getParent();
          oFCL.setLayout(sap.f.LayoutType.TwoColumnsMidExpanded);
          that.getOwnerComponent().getModel("oGModel").setProperty("/selectedItem",
            {
              LOCATION_ID: oCurrentObj.LOCATION_ID,
              LINE_ID: oCurrentObj.LINE_ID,
              LINE_DESC: oCurrentObj.LINE_DESC,
              LOCATION_DESC: oCurrentObj.LOCATION_DESC
            }
          );
          that.getOwnerComponent().getModel("oGModel").setProperty("/selectedItem", oCurrentObj);
          sap.ui.controller("vcpapp.vcplineapps.controller.Detail").onItem(oEvent)
        }

      },


      onReset: function () {
        that.byId("idManLocatLA").setValue("");
        that.byId("idFLineLA").setValue("")
        that.byId("SearchIdLA").setValue("")
        that.oModel = new sap.ui.model.json.JSONModel();
        that.oModel.setData({
          aItems: that.oLineObjects
        })

        that.getView().byId("tab1LA").setModel(that.oModel);
        if (that.getView().byId("tab1LA").getItems().length > 0) {
          that.getView().byId("tab1LA").getItems()[0].setSelected(true);
        }
        var oCurrentObj = {
          LINE_ID: that.oCdata[0].LINE_ID,
          LINE_DESC: that.oCdata[0].LINE_DESC,
          LOCATION_ID: that.oCdata[0].LOCATION_ID,
          LOCATION_DESC: that.oCdata[0].LOCATION_DESC
        }
        that.getOwnerComponent().getModel("oGModel").setProperty("/selectedItem", oCurrentObj);
        sap.ui.controller("vcpapp.vcplineapps.controller.Detail").onItem()
        // that.onDetails();
        // var dModel = new sap.ui.model.json.JSONModel([]);
        // that.byId("tab1").setModel(dModel)

        // sap.ui.controller("vcpapp.vcplineapps.controller.Detail").onClearSet()
        //  that.onSearch();
        // var oModel = new sap.ui.model.json.JSONModel();
        // oModel.setData({
        //   aItems: that.oLineObjects
        // })
        // that.getView().byId("tab1LA").setModel(that.oModel);
        // var oFCL = this.oView.getParent().getParent();
        // oFCL.setLayout(sap.f.LayoutType.StartColumnFullScreen)

      },


      /*Getting variant view data*/
      getVariantData: function () {
        var ndData = [];
        var dData = [], uniqueName = [];
        that.uniqueName = [];
        sap.ui.core.BusyIndicator.show();
        var variantUser = that.getUser()
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
                "SCOPE": "Public"
              })
              that.oGModel.setProperty("/viewNames", uniqueName);
              that.oGModel.setProperty("/defaultDetails", "");
              that.viewDetails.setData({
                items12: uniqueName
              });
              that.varianNames = uniqueName;
              that.byId("idMatList123LA").setModel(that.viewDetails);
              that.UniqueDefKey = uniqueName[0].VARIANTID;
              that.byId("idMatList123LA").setDefaultKey(uniqueName[0].VARIANTID);
              that.byId("idMatList123LA").setSelectedKey(uniqueName[0].VARIANTID);
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
                  that.byId("idMatList123LA").setDefaultKey((oData.results[i].VARIANTID));
                  that.byId("idMatList123LA").setSelectedKey((oData.results[i].VARIANTID))
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
            that.oGModel.setProperty("/fieldDetails", oData.results);
            var variantNewData = oData.results;
            aData = variantNewData.map(item1 => {
              const item2 = headerData.find(item2 => item2.VARIANTID === item1.VARIANTID);
              return item2 ? { ...item1, ...item2 } : { ...item1 };
            });
            that.oGModel.setProperty("/variantDetails", aData);
            if (aData.length > 0) {
              aData = aData.filter(id => id.VARIANTNAME !== "defaultSingle" && id.APPLICATION_NAME !== "DefaultSingle");
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
              that.variantModel.setData({
                items12: uniqueName
              });
              that.varianNames = uniqueName;
              that.oGModel.setProperty("/defaultDetails", defaultDetails);
              that.byId("idMatList123LA").setModel(that.variantModel);
              if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                var newVariant = that.oGModel.getProperty("/newVariant");
                that.handleSelectPress(newVariant[0].VARIANTNAME);
                if (newVariant[0].DEFAULT === "Y") {
                  that.UniqueDefKey = newVariant[0].VARIANTID;
                  that.byId("idMatList123LA").setDefaultKey((newVariant[0].VARIANTID));
                }
                that.byId("idMatList123LA").setSelectedKey((newVariant[0].VARIANTID))
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

              that.viewDetails.setData({
                items12: uniqueName
              });
              that.varianNames = uniqueName;
              that.byId("idMatList123LA").setModel(that.viewDetails);
              var Default = "Standard";
              if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                var newVariant = that.oGModel.getProperty("/newVariant");
                that.handleSelectPress(newVariant[0].VARIANTNAME);
                if (newVariant[0].DEFAULT === "Y") {
                  that.UniqueDefKey = newVariant[0].VARIANTID;
                  that.byId("idMatList123LA").setDefaultKey((newVariant[0].VARIANTID));
                }
                that.byId("idMatList123LA").setSelectedKey((newVariant[0].VARIANTID))
                that.oGModel.setProperty("/newVaraintFlag", "");
              } else {
                that.UniqueDefKey = uniqueName[0].VARIANTID;
                that.byId("idMatList123LA").setDefaultKey((uniqueName[0].VARIANTID));
                that.byId("idMatList123LA").setSelectedKey((uniqueName[0].VARIANTID));
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

      // getUserName: function () {
      //   that = this;
      //   let vUser;
      //   if (sap.ushell.Container) {
      //     let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
      //     vUser = (email) ? email : "";

      //   }
      //   return vUser;
      // },

      getData: function () {
        // that.vUser = that.getUserName();
        that.vUser = that.getUser();
        // that.bModel = that.getOwnerComponent().getModel("BModel");
        // that.userLoggedIn;
        // var userData = [
        //   {
        //     USEREMAIL: that.vUser
        //   }
        // ]
        // sap.ui.core.BusyIndicator.show();
        // that.bModel.callFunction("/genUserAppVisibility", {
        //   method: "GET",
        //   urlParameters: {
        //     FLAG: 'G',
        //     USERDATA: JSON.stringify(userData)
        //   },
        //   success: function (oData) {
        //     sap.ui.core.BusyIndicator.hide();
        //     if (oData.results.length > 0) {
        //       that.userLoggedIn = true;
        //     }
        //     else {
        //       that.userLoggedIn = false;
        //       // MessageToast.show("User has not been authorized to edit this action");
        //     }
        //     if (that.userLoggedIn == false) {
        //       that.byId("idAddLA").setEnabled(false);
        //     }
        //     else if (that.userLoggedIn == true) {
        //       that.byId("idAddLA").setEnabled(true);
        //     }
        //   },
        //   error: function (error) {
        //     sap.ui.core.BusyIndicator.hide();
        //   }
        // })

        //  that.getAllLine()
        that.getAllLineCap()

      },

      onRestore: function () {
        that.onDetails();
      },

      onAdd: function () {
        if (!that._valueHelpDialogLoc) {
          that._valueHelpDialogLoc = sap.ui.xmlfragment(
            "vcpapp.vcplineapps.view.LocDialog",
            that
          );
          that.getView().addDependent(that._valueHelpDialogLoc);
        }
          sap.ui.getCore().byId("idManLocat1LA").setValue("");
         sap.ui.getCore().byId("idLineLA").setValue("");
         sap.ui.getCore().byId("idLineDescrLA").setValue("");
        sap.ui.getCore().byId("BtnLA").setText("Create")
        sap.ui.getCore().byId("idprodLA").setTitle("Create")
        that._valueHelpDialogLoc.open();

      },

      onValueHelpRequest1: function (oEvent) {
        if (!that.LinMas_Dialog) {
          that.LinMas_Dialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.LinMasterLocation", this);
        }
        that.LinMas_Dialog.open();

        var oModel = that.getOwnerComponent().getModel('BModel');
        // debugger
        //added a skip and top 
        that.getAllFacLoc()


      },

      onValueHelpDialogLMlocSearch: function (oEvent) {
        var sQuery = oEvent.getParameters().value
        var oFilters = [];
        // Check if search filter is to be applied
        sQuery = sQuery ? sQuery.trim() : "";

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
        sap.ui.getCore().byId("SldLocLA").getBinding("items").filter(oFilters);
      },

      onValueHelpDialogLMlocClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        oEvent.getSource().getBinding("items").filter([]);
        if (!oSelectedItem) {
          return;
        }
        var selectedLocItem = sap.ui.getCore().byId("idManLocat1LA").setValue(oSelectedItem.getTitle());

         that.oGModel.setProperty("/CreateLoc", oSelectedItem.getTitle());
        if (that.oGModel.getProperty("/defaultLocation") !== selectedLocItem) {
          that.byId("idMatList123LA").setModified(true);
        }
        sap.ui.getCore().byId("BtnLA").setVisible(that.createRole(oSelectedItem.getTitle()))
      },

      onValueHelpRequest: function (oEvent) {


        if (oEvent.oSource.sId.includes("idManLocatLA")) {
          if (!that.newDetailsDialog) {
            that.newDetailsDialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.ManfacLineLoca", this);
          }
          that.newDetailsDialog.open();

          // var dModel = new sap.ui.model.json.JSONModel([]);
          // that.byId("tab1LA").setModel(dModel)
          var oModel = that.getOwnerComponent().getModel('BModel');

          let aData = []
          aData.results = that.oLineObjects
          let aResult = Array.from(new Set(aData.results.map(item => item.LOCATION_ID)))
            .map(LOCATION_ID => aData.results.find(item => item.LOCATION_ID === LOCATION_ID));

          var oJSONModel = new sap.ui.model.json.JSONModel();
          oJSONModel.setData({
            aItems: aResult
          })
          sap.ui.getCore().byId("selectDialogLA").setModel(oJSONModel);
          var oLoc = that.oGModel.getProperty("/selectedLocation");
          if (oLoc) {
            that.oLocList.getItems().forEach(item => {
              if (item.getTitle() === oLoc) {
                item.setSelected(true);
              }
            })
          }
        } else {
          // if (that.byId("idManLocatLA").getValue() == "") {
          //   MessageToast.show("Please Select a Location")
          //   return false
          // } 
          // else {
          if (!that.Line_ID_Dialog) {
            that.Line_ID_Dialog = sap.ui.xmlfragment("vcpapp.vcplineapps.view.LineID", this);
          }
          that.Line_ID_Dialog.open();
          // if (that.byId("idManLocatLA").getValue() == "" || undefined) {
          //   MessageBox.show("Please Select a Location")
          //   return false
          // } 
          // else {
          // var dModel = new sap.ui.model.json.JSONModel([]);
          // that.byId("tab1LA").setModel(dModel)
          var sLineID = []
          var sLocation = that.byId("idManLocatLA").getValue()
          if (sLocation.length > 0) {
            for (var i = 0; i < that.oLineObjects.length; i++) {
              if (that.oLineObjects[i].LOCATION_ID == sLocation) {
                sLineID.push(that.oLineObjects[i])
              }
            }
          } else {
            sLineID = that.oLineObjects
          }
          var oJSONModel = new sap.ui.model.json.JSONModel();
          oJSONModel.setData({
            aItems: sLineID
          })
          sap.ui.getCore().byId("selLineDialogLA").setModel(oJSONModel);
          var oLine = that.oGModel.getProperty("/selectedLine");
          if (oLine) {
            that.oLineList.getItems().forEach(item => {
              if (item.getTitle() === oLine) {
                item.setSelected(true);
              }
            })
          }

          //  }
          // }
        }
      },

      onValueHelpDialogLineClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        oEvent.getSource().getBinding("items").filter([]);
        if (!oSelectedItem) {
          return;
        }
        var selectedLocItem = that.byId("idFLineLA").setValue(oSelectedItem.getTitle());
        if (that.oGModel.getProperty("/defaultLine") !== selectedLocItem) {
          that.byId("idMatList123LA").setModified(true);
        }
        // sap.ui.getCore().byId("idFLine").setValue(oSelectedItem.getTitle());

      },

      onValueHelpDialogSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("LOCATION_ID", FilterOperator.Contains, sValue);

        oEvent.getSource().getBinding("items").filter([oFilter]);
      },

      onValueHelpDialogLineSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("LINE_ID", FilterOperator.Contains, sValue);

        oEvent.getSource().getBinding("items").filter([oFilter]);
      },

      onValueHelpDialogClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        oEvent.getSource().getBinding("items").filter([]);
        if (!oSelectedItem) {
          return;
        }
        that.byId("idManLocatLA").setValue(oSelectedItem.getTitle());
        that.byId("idFLineLA").setValue("");
        // sap.ui.getCore().byId("idManLocat").setValue(oSelectedItem.getTitle());
      },



      onTab: function () {
        var sLen = that.byId("tab1LA").getItems()
        for (var i = 0; i < sLen.length; i++) {
          sLen[i].setSelected(false)
        }
        // that.byId("tab1")
      },

      handleClose: function () {
        that._valueHelpDialogLoc.close();
        that._valueHelpDialogLoc.destroy(true);
        that._valueHelpDialogLoc = "";
      },



      getUserDetails: function () {
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
      //CRUD of Line Master

      createBatch: function () {
        if (sap.ui.getCore().byId("BtnLA").getText() == "Create") {
          sap.ui.getCore().byId("idprodLA").setTitle("Create")
          that = this;
          var updatedDetails = {};
          var updatedArray = [];
          var newDetails = {};
          var newArray = [];
          var sLineDesc = sap.ui.getCore().byId("idLineDescrLA").getValue();
          var dLocation = sap.ui.getCore().byId("idManLocat1LA").getValue();
          var pLine = sap.ui.getCore().byId("idLineLA").getValue();
          if (dLocation && pLine && sLineDesc.length > 0) {
            var table = that.byId("tab1LA")
            var tableItems = table.getItems();
            //   for (var k = 0; k < sLineDesc.length; k++) {
            newDetails = {
              LOCATION_ID: dLocation,
              LINE_DESC: sLineDesc,
              LINE_ID: pLine,
            }
            newArray.push(newDetails);
            for (var s = 0; s < tableItems.length; s++) {
              if (dLocation === tableItems[s].oBindingContexts.undefined.getObject().LOCATION_ID
                && pLine === tableItems[s].oBindingContexts.undefined.getObject().LINE_ID
                && sLineDesc === tableItems[s].oBindingContexts.undefined.getObject().LINE_DESC) {
                updatedDetails = {
                  LOCATION_ID: dLocation,
                  LINE_DESC: sLineDesc,
                  LINE_ID: pLine,
                }
                updatedArray.push(updatedDetails);
              }
            }
            //   }
            newArray = newArray.filter((obj1) => !updatedArray.some((obj2) => obj1.LOCATION_ID === obj2.LOCATION_ID &&
              obj1.LINE_ID === obj2.LINE_ID));
            if (newArray.length === 0) {
              if (that._valueHelpDialogLoc) {
                that._valueHelpDialogLoc.close();
                that._valueHelpDialogLoc.destroy(true);
                that._valueHelpDialogLoc = null;
                delete that._valueHelpDialogLoc;
              }
              MessageToast.show("Selected location and line already exists.");
            }
            else {
              var User = "";
              if (sap.ushell.Container) {
                let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                User = (email) ? email : "";
              }
              var bModel = that.getOwnerComponent().getModel("BModel");
              bModel.callFunction("/createLineMasterBatch", {
                method: "GET",
                urlParameters: {
                  PRODATA: JSON.stringify(newArray),
                  Flag: "C",
                  User: User
                },
                success: function (oData) {

                  that.onAfterRendering();
                  MessageToast.show(oData.createLineMasterBatch);
                  // }
                  if (that._valueHelpDialogLoc) {
                    that._valueHelpDialogLoc.close();
                    that._valueHelpDialogLoc.destroy(true);
                    that._valueHelpDialogLoc = null;
                    delete that._valueHelpDialogLoc;
                  }
                  var data = that.byId("tab1LA")
                  data.getBinding("items").refresh()
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
        } else {


          that.updateLine();
        }
      },

      //Del Line 
      onDelete: function (oEvent) {
        var oData = oEvent.getSource().getBindingContext().getObject()

          var sText =
                    "Do you want to delete the Line" +
                    " - " +
                    oData.LINE_ID.toString() + ' ?';
                  sap.m.MessageBox.show(sText, {
                    title: "Confirmation",
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (oAction) {
                      if (oAction === sap.m.MessageBox.Action.YES) {
                        sap.ui.core.BusyIndicator.show();
                        var selcdted = JSON.stringify([{
                    LOCATION_ID: oData.LOCATION_ID,
                    LINE_ID: oData.LINE_ID
                  }])
                        var bModel = that.getOwnerComponent().getModel("BModel");
                        bModel.callFunction("/deleteLine", {
                          method: "GET",
                          urlParameters: {
                            Lines: selcdted
                          },
                          success: function (oData) {
                            sap.ui.core.BusyIndicator.hide();
                            if (oData.deleteLine.error == true) {
                              let aList = JSON.parse(oData.deleteLine.message);
                              if (aList.length > 0) {
                                var oModel = new sap.ui.model.json.JSONModel();
                                oModel.setData({
                                  results: aList
                                })
                                if (!that.oDialogFragment2) {
                                  that.oDialogFragment2 = sap.ui.xmlfragment(
                                    "vcpapp.vcplinemaster1.fragments.LineRestrictions",
                                    that
                                  );
                                  sap.ui.core.BusyIndicator.hide();
                                  that.oDialogFragment2.open();
                                } else {
                                  sap.ui.core.BusyIndicator.hide();
                                  that.oDialogFragment2.open();
                                }
                                sap.ui.getCore().byId("lineTable").setModel(oModel);
                                MessageToast.show("Deletion failed as line(s) are being used in restrictions!");
                              }
                              else {
                                MessageToast.show("Deletion failed");
                              }
                            }
                            else {
                              MessageToast.show("Deletion successful");
                              that.byId("idManLocatLA").setValue("");
                              that.byId("idFLineLA").setValue("");
                              that.onAfterRendering();

                            }
                          },
                          error: function (_error) {
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show("Failed to delete data");
                          },
                        });
                      }
                    },
                  });
        // that = this;
        // var oModel = this.getOwnerComponent().getModel("BModel");
        // var vUser = that.getUserDetails();
        // var oEntry = {
        //   USERDATA: []
        // };
        // let oParamVals = {
        //   USEREMAIL: vUser
        // };
        // oEntry.USERDATA.push(oParamVals);
        // oModel.callFunction("/genUserAppVisibility", {
        //   method: "GET",
        //   urlParameters: {
        //     FLAG: 'G',
        //     USERDATA: JSON.stringify(oEntry.USERDATA)
        //   },
        //   success: function (oData) {
        //     var aResult = oData.results;

        //     if (aResult.length > 0) {
        //       var isUserLoggedIn = true;
        //     }
        //     if (isUserLoggedIn) {
        //       if (aResult[0].DELETE_CHK === "disabled") {
        //         that.byId("deletebtn").setEnabled(false);
        //         MessageToast.show("User not authorised for this create action");
        //       }
        //       else {
        //         var oSelected = that.byId("tab1LA").getSelectedItems();
        //         if (oSelected.length == 0) {
        //           MessageToast.show("Please Select a Row")
        //           return false
        //         }
        //         var aSelectedLIne = [], aLines = [];
        //         for (var i = 0; i < oSelected.length; i++) {
        //           var param = oSelected[i].getCells()[0].getText()
        //           var aLine = oSelected[i].getCells()[1].getText()
        //           aSelectedLIne.push({
        //             LOCATION_ID: param,
        //             LINE_ID: aLine
        //           })
        //           aLines.push(aLine)
        //         }
        //         if (aSelectedLIne.length > 0) {//check if Line is being used In any Restrictions
        //           var sText =
        //             "Do you want to delete the Line(s)" +
        //             " - " +
        //             aLines.toString() + ' ?';
        //           sap.m.MessageBox.show(sText, {
        //             title: "Confirmation",
        //             actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
        //             onClose: function (oAction) {
        //               if (oAction === sap.m.MessageBox.Action.YES) {
        //                 sap.ui.core.BusyIndicator.show();
        //                 var selcdted = JSON.stringify(aSelectedLIne)
        //                 console.log(selcdted)
        //                 var bModel = that.getOwnerComponent().getModel("BModel");
        //                 bModel.callFunction("/deleteLine", {
        //                   method: "GET",
        //                   urlParameters: {
        //                     Lines: selcdted
        //                   },
        //                   success: function (oData) {
        //                     sap.ui.core.BusyIndicator.hide();
        //                     if (oData.deleteLine.error == true) {
        //                       let aList = JSON.parse(oData.deleteLine.message);
        //                       if (aList.length > 0) {
        //                         var oModel = new sap.ui.model.json.JSONModel();
        //                         oModel.setData({
        //                           results: aList
        //                         })
        //                         if (!that.oDialogFragment2) {
        //                           that.oDialogFragment2 = sap.ui.xmlfragment(
        //                             "vcpapp.vcplinemaster1.fragments.LineRestrictions",
        //                             that
        //                           );
        //                           sap.ui.core.BusyIndicator.hide();
        //                           that.oDialogFragment2.open();
        //                         } else {
        //                           sap.ui.core.BusyIndicator.hide();
        //                           that.oDialogFragment2.open();
        //                         }
        //                         sap.ui.getCore().byId("lineTable").setModel(oModel);
        //                         MessageToast.show("Deletion failed as line(s) are being used in restrictions!");
        //                       }
        //                       else {
        //                         MessageToast.show("Deletion failed");
        //                       }
        //                     }
        //                     else {
        //                       MessageToast.show("Deletion successful");
        //                       that.byId("idManLocatLA").setValue("");
        //                       that.byId("idFLineLA").setValue("");
        //                       that.onAfterRendering();

        //                     }
        //                   },
        //                   error: function (_error) {
        //                     sap.ui.core.BusyIndicator.hide();
        //                     MessageToast.show("Failed to delete data");
        //                   },
        //                 });
        //               }
        //             },
        //           });

        //         }
        //       }
        //     }
        //     else {
        //       that.byId("deletebtn").setEnabled(false);
        //       MessageToast.show("User Has not authorized to delete dction");
        //     }
        //   }
        // })
      },

      onEdit: function (oEvent) {
                  var sFild = oEvent.getSource().getBindingContext().getObject()
                  if (!that._valueHelpDialogLoc) {
                    that._valueHelpDialogLoc = sap.ui.xmlfragment(
                      "vcpapp.vcplineapps.view.LocDialog",
                      that
                    );
                    that.getView().addDependent(that._valueHelpDialogLoc);
                  }
                  that._valueHelpDialogLoc.open();
                  sap.ui.getCore().byId("idprodLA").setTitle("Update")
                  sap.ui.getCore().byId("BtnLA").setText("Update")

                  var sL = sap.ui.getCore().byId("idManLocat1LA")
                  sL.setValue(sFild.LOCATION_ID);
                  sL.setEditable(false)
                  var iL = sap.ui.getCore().byId("idLineLA");
                  iL.setValue(sFild.LINE_ID);
                  iL.setEditable(false);
                  var iLnd = sap.ui.getCore().byId("idLineDescrLA");
                  iLnd.setValue(sFild.LINE_DESC);
                   sap.ui.getCore().byId("BtnLA").setVisible(true)

        // var oModel = this.getOwnerComponent().getModel("BModel");
        // var vUser = that.getUserDetails();
        // var oEntry = {
        //   USERDATA: []
        // };
        // let oParamVals = {
        //   USEREMAIL: vUser
        // };
        // oEntry.USERDATA.push(oParamVals);
        // oModel.callFunction("/genUserAppVisibility", {
        //   method: "GET",
        //   urlParameters: {
        //     FLAG: 'G',
        //     USERDATA: JSON.stringify(oEntry.USERDATA)
        //   },
        //   success: function (oData) {
        //     var aResults = oData.results;


        //     if (aResults.length > 0) {
        //       var isUserLoggedIn = true;
        //     }
        //     if (isUserLoggedIn) {
        //       if (aResults[0].UPDATE_CHK === "disabled") {
        //         that.byId("onEdit").setEnabled(false)
        //         MessageToast.show("User not authorised for this edit action");
        //       }
        //       else {

        //         if (that.byId("tab1LA").getSelectedItems().length > 0) {
        //           sap.ui.core.BusyIndicator.show();
        //           var sFild = that.byId("tab1LA").getSelectedItem().getBindingContext().getObject()
        //           that.oLineObjects


        //           sap.ui.core.BusyIndicator.hide();
        //           if (!that._valueHelpDialogLoc) {
        //             that._valueHelpDialogLoc = sap.ui.xmlfragment(
        //               "vcpapp.vcplineapps.view.LocDialog",
        //               that
        //             );
        //             that.getView().addDependent(that._valueHelpDialogLoc);
        //           }
        //           that._valueHelpDialogLoc.open();
        //           sap.ui.getCore().byId("idprodLA").setTitle("Update")
        //           sap.ui.getCore().byId("BtnLA").setText("Update")

        //           var sL = sap.ui.getCore().byId("idManLocat1LA")
        //           sL.setValue(sFild.LOCATION_ID);
        //           sL.setEditable(false)
        //           var iL = sap.ui.getCore().byId("idLineLA");
        //           iL.setValue(sFild.LINE_ID);
        //           iL.setEditable(false);
        //           var iLnd = sap.ui.getCore().byId("idLineDescrLA");
        //           iLnd.setValue(sFild.LINE_DESC);
        //         }
        //         else {
        //           MessageToast.show("Please Select a Row")
        //         }


        //       }
        //     }
        //     else {
        //       that.byId("onEdit").setEnabled(false)
        //       MessageToast.show("User has not authorized to edit action");
        //     }
        //   }
        // })
      },

      updateLine: function () {
        const newArray = [];
        var that = this;
        newArray.push({
          LOCATION_ID: sap.ui.getCore().byId("idManLocat1LA").getValue(),
          LINE_DESC: sap.ui.getCore().byId("idLineDescrLA").getValue(),
          LINE_ID: sap.ui.getCore().byId("idLineLA").getValue(),
        });
        var bModel = that.getOwnerComponent().getModel("BModel");
        var User = "";
        if (sap.ushell.Container) {
          let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
          User = (email) ? email : "";
        }
        bModel.callFunction("/createLineMasterBatch", {
          method: "GET",
          urlParameters: {
            PRODATA: JSON.stringify(newArray),
            Flag: "E",
            User: User
          },
          success: function (oData) {
            MessageToast.show("Updated Successfully");
            that.onAfterRendering();
            if (that._valueHelpDialogLoc) {
              sap.ui.getCore().byId("idManLocat1LA").setValue("");
              sap.ui.getCore().byId("idLineDescrLA").setValue("");
              sap.ui.getCore().byId("idLineLA").setValue("");
              // that.eDialogFragment.close();
              that._valueHelpDialogLoc.destroy();
              delete that._valueHelpDialogLoc;
            }
            that.byId("idManLocatLA").setValue("");
            that.byId("idFLineLA").setValue("");
            // var data = that.byId("tab1")
            // data.getBinding("items").refresh()
          },
          error: function (error) {
            MessageToast.show("Failed to update data");
          },
        });
      },

      onSearch: function (oEvent) {
        var tab1Data = that.byId("tab1LA").getModel().oData.aItems;
        var oModel = new sap.ui.model.json.JSONModel();
        var oFilters = []
        var sQuery;
        if (oEvent) {
          sQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue")
          sQuery = sQuery ? sQuery.trim() : "";
        }

        if (!oEvent) {
          sQuery = that.byId("SearchIdLA").getValue();
        }

        if (sQuery !== "") {
          oFilters.push(
            new Filter({
              filters: [
                new Filter("LOCATION_ID", FilterOperator.Contains, sQuery),
                new Filter("LINE_ID", FilterOperator.Contains, sQuery),
                new Filter("LINE_DESC", FilterOperator.Contains, sQuery),
              ],
              and: false,
            })
          );
          that.byId("tab1LA").getBinding("items").filter(oFilters)
        }

        else if (sQuery == "") {
          // oModel.setData({
          //   aItems: tab1Data
          // })
          // that.byId("tab1LA").setModel(oModel);
          that.onGo()
          //  that.onDetails();
        }

      },

      dateChange: function (oEvent) {
        var sFrom = oEvent.getParameter("from"),
          sTo = oEvent.getParameter("to");
        //Converting dates to yyyy/MM/dd format and setting to daterangeSelection
        function convertDate(inputFormat, joinBy) {
          function pad(s) {
            return (s < 10) ? '0' + s : s;
          }
          var d = new Date(inputFormat)
          return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(joinBy)
        }
        sap.ui.getCore().byId("DRS1LA").setValue(convertDate(sFrom, '/') + " - " + convertDate(sTo, '/'));
      },


      getAllFacLoc: function () {
        var topCount = 30000 //that.getOwnerComponent().getModel("oGModel").getProperty("/MaxCount")
        that.getOwnerComponent().getModel("BModel").read("/getRolesLocProd", {
          urlParameters: {
            "$skip": that.skip,
            "$top": topCount
          },
          filters:  [new Filter(
              "USER",
              FilterOperator.EQ,
              that.getUser()
            )],
          success: function (oData) {
            if (topCount == oData.results.length) {
              that.skip += topCount;
              that.allData = that.allData.concat(oData.results);
              that.getAllFacLoc();
            } else {
              that.skip = 0;
              that.allData = that.allData.concat(oData.results);
              var aResult = that.allData
              aResult = that.removeDuplicate(that.allData, 'FACTORY_LOC')
              var oJSONModel = new sap.ui.model.json.JSONModel();
              oJSONModel.setData({
                aItems: aResult
              })
              sap.ui.getCore().byId("SldLocLA").setModel(oJSONModel);
            }
          },
          error: function (error) {
            MessageToast.show("error");
          }

        })
      },

      /**On Press of Variant Name */
      handleSelectPress: function (oEvent) {
        sap.ui.core.BusyIndicator.show();
        var oLoc, oLine, oTokens = {}, custToken = [];
        that.locProdFilters = [];
        that.finaloTokens = [];
        var oTableItems = that.oGModel.getProperty("/variantDetails");
        that.byId("idMatList123LA").setModified(false);
        var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");

        that.oGModel.setProperty("/setLocation", '');
        that.oGModel.setProperty("/setLine", '');
        that.oGModel.setProperty("/defaultLocation", "");
        that.oGModel.setProperty("/defaultLine", "");

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
            }
          }

          if (oLoc) {
            that.oLocG.setValue(oLoc);
            that.oGModel.setProperty("/setLocation", oLoc);
          }
          else {
            that.oLocG.setValue("");
          }
          if (oLine) {
            that.oLineG.setValue(oLine);
            that.oGModel.setProperty("/setLine", oLine);
          } else {
            that.oLineG.setValue("");
          }
          if (oLoc && oLine) {
            that.onGo()
          }
          sap.ui.core.BusyIndicator.hide();
        }
        else {
          // let headerDetails = that.oGModel.getProperty("/headerDetails").filter(id => id.APPLICATION_NAME == "DefaultSingle" && id.VARIANTNAME == "defaultSingle");
          // if (headerDetails.length) {
          //   var oTableItems = that.oGModel.getProperty("/fieldDetails").filter(id => id.VARIANTID == headerDetails[0].VARIANTID);
          //   for (var i = 0; i < oTableItems.length; i++) {
          //     if (oTableItems[i].FIELD.includes("Loc")) {
          //       oLoc = oTableItems[i].VALUE;
          //       that.oGModel.setProperty("/defaultLocation", oLoc);
          //       var sFilter = new sap.ui.model.Filter({
          //         path: "LOCATION_ID",
          //         operator: sap.ui.model.FilterOperator.EQ,
          //         value1: oTableItems[i].VALUE,
          //       });
          //       that.locProdFilters.push(sFilter);

          //     }
          //     else if (oTableItems[i].FIELD.includes("Line")) {
          //       oLine = oTableItems[i].VALUE;
          //       that.oGModel.setProperty("/defaultLine", oLine);
          //       var sFilter = new sap.ui.model.Filter({
          //         path: "LINE_ID",
          //         operator: sap.ui.model.FilterOperator.EQ,
          //         value1: oTableItems[i].VALUE,
          //       });
          //       that.locProdFilters.push(sFilter);
          //     }
          //   }

          //   if (oLoc) {
          //     that.oLocG.setValue(oLoc);
          //     that.oGModel.setProperty("/setLocation", oLoc);
          //   }
          //   else {
          //     that.oLocG.setValue("");
          //   }
          //   if (oLine) {
          //     that.oLineG.setValue(oLine);
          //     that.oGModel.setProperty("/setLine", oLine);
          //   } else {
          //     that.oLineG.setValue("");
          //   }
          //   if (oLoc && oLine) {
          //     that.onGo()
          //   }
          // }

          // else {
            //do nothing
            that.byId("idManLocatLA").setValue();
            that.byId("idFLineLA").setValue();

            that.onReset();
          // }
          sap.ui.core.BusyIndicator.hide();
        }
      },

      /**
           * Saving the VIEW on press of save in NameVariant fragment
           * @param {*} oEvent 
           */
      onCreate: function (oEvent) {
        sap.ui.core.BusyIndicator.show();
        var array = [];
        var details = {};
        var sLocation = that.byId("idManLocatLA").getValue();
        var Field1 = that.byId("idManLocatLA").getParent().mAggregations.content[0].getText()
        var sLine = that.byId("idFLineLA").getValue();
        var Field2 = that.byId("idFLineLA").getParent().mAggregations.content[0].getText()

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
              that.byId("idMatList123LA").setModified(false);
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
          that.byId("idMatList123LA").setModel(that.viewDetails);
          that.byId("idMatList123LA").setDefaultKey(that.UniqueDefKey);
          return MessageToast.show("Variant doesn't belong to logged in user. Cannot make changes to this Variant");
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
            var defaultVariant = totalVariantData.filter(item => item.DEFAULT === "Y");
            if (defaultVariant.length > 0) {
              defaultVariant[0].DEFAULT = "N";
              that.getView().getModel("BModel").callFunction("/updateVariant", {
                method: "GET",
                urlParameters: {
                  VARDATA: JSON.stringify(defaultVariant)
                },
                success: function (oData) {
                  var newDefault = totalVariantData.filter(item => item.VARIANTID === JSON.parse(selected.def));
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
              var selectedVariant = totalVariantData.filter(item => item.VARIANTID === JSON.parse(selected.def));
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
      /**
               * Save the current view if any changes in the existing properties.
               */
      onSave: function () {
        var updatedDetails = {};
        var updatedArray = [];
        var selectedItem = sap.ui.getCore().byId("idMatList");
        if (selectedItem.getSelectedItem() !== null) {
          var Default = selectedItem.getSelectedItem().getBindingContext().getObject().DEFAULT;
          var VariantId = selectedItem.getSelectedItem().getBindingContext().getObject().VARIANTID;
          var VariantName = selectedItem.getSelectedItem().getBindingContext().getObject().VARIANTNAME;
        } else {
          var defaulDetails1 = that.oGModel.getProperty("/defaultDetails");
          var VariantId = defaulDetails1[0].VARIANTID;
          var VariantName = defaulDetails1[0].VARIANTNAME;
          var Default = "Y";
        }
        if (that.oLocG.getValue()) {
          var sLocation = that.byId("idManLocatLA").getValue();
        }
        else {
          var sLocation = "";
        }
        if (that.oLineG.getValue()) {
          var sProd = that.byId("idFLineLA").getValue();
        }
        else {
          var sProd = ""
        }
        var Field1 = that.byId("idManLocatLA").getParent().getContent()[0].getText();
        var Field2 = that.byId("idFLineLA").getParent().getContent()[0].getText();
        if (!sLocation && !sProd) {
          that._popOver.close();
          return MessageToast.show("No values for filters in Manufacturing Location and Line")
        }
        if (VariantName) {
          if (that.oLocG.getValue()) {
            updatedDetails = {
              Field: Field1,
              FieldCenter: (1).toString(),
              Value: sLocation,
              FAVOURITE: "N",
              Default: Default
            }
            updatedArray.push(updatedDetails);
          }
          if (that.oLineG.getValue()) {
            updatedDetails = {
              Field: Field2,
              FieldCenter: (1).toString(),
              Value: sProd,
              FAVOURITE: "N",
              Default: Default
            }
            updatedArray.push(updatedDetails);
          }

          for (var j = 0; j < updatedArray.length; j++) {
            updatedArray[j].ID = VariantId;
            updatedArray[j].IDNAME = VariantName;
            updatedArray[j].App_Name = "Line Configuration"
          }


          this.getView().getModel("BModel").callFunction("/createVariant", {
            method: "GET",
            urlParameters: {
              Flag: "E",
              USER: that.oGModel.getProperty("/UserId"),
              VARDATA: JSON.stringify(updatedArray)
            },
            success: function (oData) {
              that.oGModel.setProperty("/newVariant", oData.results);
              that.oGModel.setProperty("/newVaraintFlag", "X");
              that.onAfterRendering();
              that._popOver.close();
              that.byId("idDropDown").setPressed(false);
            },
            error: function (error) {

              MessageToast.show("Failed to update variant");
            },
          });
        } else {
          MessageToast.show("Please fill View Name");
        }
      },

      handleSearch: function (oEvent) {
        var sQuery =
          oEvent.getParameter("value") || oEvent.getParameter("newValue"),
          sId = oEvent.getParameter("id"),
          oFilters = [];
        // Check if search filter is to be applied
        sQuery = sQuery ? sQuery.trim() : "";
        if (sId.includes("GenSearch")) {
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
          sap.ui.getCore().byId("varNameListLA").getBinding("items").filter(oFilters);
        }
      },

      saveDefaultVariant: function (oEvent) {
        sap.ui.core.BusyIndicator.show();
        var array = [];
        var details = {};
        var sLocation = that.byId("idManLocatLA").getValue();
        var Field1 = that.byId("idManLocatLA").getParent().mAggregations.content[0].getText()
        var sLine = that.byId("idFLineLA").getValue();
        var Field2 = that.byId("idFLineLA").getParent().mAggregations.content[0].getText();
        if (!sLocation && !sLine === 0) {
          sap.ui.core.BusyIndicator.hide();
          return;
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
            MessageToast.show("Failed to create global variant");
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
          oStorage.put("nodeId", 90);
          //Generate a  URL for the second application
          var url = window.location.href.split('#')[0] + hash;
          //Navigate to second app
          sap.m.URLHelper.redirect(url, true);
        }
      },

    });
  });
