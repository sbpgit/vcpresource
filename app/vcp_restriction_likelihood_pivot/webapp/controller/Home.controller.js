sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "../model/formatter"
],
    function (Controller, JSONModel, MessageToast, Filter, FilterOperator, Token, formatter) {
        "use strict";
        var that;
        return Controller.extend("vcpapp.vcprestrictionlikelihoodv2.controller.Home", {
            formatter: formatter,
            formatter: formatter,
            onInit() {
                that = this;
                that.oGModel = that.getOwnerComponent().getModel("oGModel");
                that.oModel = that.getOwnerComponent().getModel("oModel");
                that.viewDetails = new JSONModel({
                    items12: []
                });
                that.viewDetails.setSizeLimit(5000);
                that.byId("idMatList123").setModel(that.viewDetails);
                // that.variantModel = new JSONModel();
                // that.variantModel.setSizeLimit(5000);
                // that.aModel = that.getOwnerComponent().getModel("aModel");
                that.columns = ["Line", "Resource"];
                that.pivotPage = that.byId("idPivotPageRLP");
                that.FilterBar = that.getView().byId("filterbarRLP");
                that.loadFragments();
                that.is_Go_Ready_To_Press_Again = true;
                that.oGModel.setProperty("/showPivot", false);
                that.sUser = that.getUser();
                var oModel = new sap.ui.model.json.JSONModel({
                    sliderValue: 0
                });
                this.getView().setModel(oModel);

            },
            loadFragments() {
                Promise.all([
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.location",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.line",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.version",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.scenario",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.PivotSettings",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.restriction",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.forecastDetails",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.table",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.keyFigure",
                    }),
                    this.loadFragment({
                        name: "vcpapp.vcprestrictionlikelihoodv2.fragments.Char",
                    })
                ])
                    .then(
                        function (aFragments) {
                            // aFragments is an array of the instantiated fragment roots in the order they were requested
                            that._DialogLoc = aFragments[0];
                            that._DialogLine = aFragments[1];
                            that._DialogVer = aFragments[2];
                            that._DialogSce = aFragments[3];
                            that._pivotSetting = aFragments[4];
                            that._restriction = aFragments[5];
                            that._forecastDetail = aFragments[6];
                            that._table = aFragments[7];
                            that.keyTable = aFragments[8];
                            that.CharTable = aFragments[9];

                            console.log("All fragments loaded asynchronously!");
                            // Now you can safely use them, e.g., this._DialogLoc.open();
                        }.bind(that)
                    )
                    .catch(function (oError) {
                        console.error("Error loading one or more fragments:", oError);
                    });
            },
            onBeforeRendering: function () {
                that.oModel.read("/getWeeks", {
                    success: function (oData) {
                        that.calWeekData = oData.results;
                        if (!oData.results) MessageBox.show("Cal Week Date Not Avail");
                        else {
                            that.telWeek = [];
                            that.telMonth = [];
                            that.telQ = [];
                            const remain = [];
                            for (let i = 0; i < oData.results.length; i++) {
                                const item = oData.results[i];
                                if (!item.TELESCOPIC_WEEK && !item.CALENDAR_WEEK) continue;
                                if (!that.telWeek.includes(item.TELESCOPIC_WEEK) && !that.telMonth.includes(item.TELESCOPIC_WEEK) && !that.telQ.includes(item.TELESCOPIC_WEEK)) {
                                    const found = oData.results.filter(o => o.TELESCOPIC_WEEK === item.TELESCOPIC_WEEK);
                                    const length = found.length;
                                    if (length === 1)
                                        that.telWeek.push(item.TELESCOPIC_WEEK)
                                    else if (length > 2 && length <= 6)
                                        that.telMonth.push(item.TELESCOPIC_WEEK);
                                    else if (length > 6)
                                        that.telQ.push(item.TELESCOPIC_WEEK);
                                    else
                                        remain.push(item.TELESCOPIC_WEEK);
                                }
                            }
                        }
                    },
                    error: function (error) {
                        console.error(error);
                    },
                });

            },
            onAfterRendering() {
                let slider = this.byId("idSliderRLP");

                // Hover events
                slider.$().on("mouseenter", () => {
                    this.byId("idHoverInput").setVisible(true);
                    this._updatePosition();
                });

                slider.$().on("mouseleave", () => {
                    this.byId("idHoverInput").setVisible(false);
                });
                that.today = new Date();
                // that.after90Day = new Date(
                //     that.today.getFullYear(),
                //     that.today.getMonth(),
                //     that.today.getDate() + 90
                // );
                const oDateL = new Date();
                const oDateH = new Date();
                oDateH.setFullYear(oDateL.getFullYear() + 2);
                that.byId("idDateRangeRLP").setFrom(oDateL);
                that.byId("idDateRangeRLP").setTo(oDateH);
                that.byId("idDateRangeRLP").setEnabled(false);
                that.KeyFig = ["Forecast", "Capacity"];
                that.getVariantData();
                that.oUniqueControl = this.byId("uniqueButtonControl");
            },
            getUser: function () {
                let vUser;
                if (sap?.ushell?.Container) {
                    let email = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
                    vUser = (email) ? email : "";
                }
                if (!vUser) {
                    vUser = 'null';
                }
                return vUser;


            },

            onValueHelpRequest(oEvent) {
                const selectId = oEvent.getSource().getId(),
                    selLoc = that.byId("idManLocRLP").getValue(),
                    selLine = that.byId("idLineRLP").getTokens(),
                    selVer = that.byId("idVerRLP").getValue();

                that.selectDialog = oEvent.getSource();

                // Process factory location value help
                async function processFactoryLoc() {
                    const entitySet = "getRolesLocProd";

                    const urlParameters = { "$top": 30000, "$skip": 0 };
                    that._DialogLoc.open();
                    const locVH = that.byId("idValueHelpLocRLP");
                    locVH.setNoDataText("Loading...");
                    locVH.setBusy(true);
                    let model, oResults;

                    if (!that.locModel) {
                        that.allData = [];
                        try {
                            oResults = await that.readModel(entitySet, [new Filter("USER", FilterOperator.EQ, that.sUser)], urlParameters);
                        } catch (e) {
                            locVH.setBusy(false);
                            locVH.setNoDataText("No Data");
                            MessageToast.show(e.message);
                            return;
                        }
                        if (!oResults.length) {
                            locVH.setNoDataText("NoData");
                        }
                        that.allData = oResults;
                        oResults = that.removeDuplicates(oResults, ["FACTORY_LOC"])
                            .sort(that.dynamicSort("FACTORY_LOC"));
                        model = oResults.map(o => ({
                            title: o.FACTORY_LOC,
                            desc: o.LOCATION_DESC,
                            select: false
                        }));
                        that.locModel = model;
                    } else {
                        model = that.locModel;
                    }
                    locVH.setBusy(false);
                    locVH.setNoDataText("No Data");
                    locVH.setModel(new JSONModel({ items: model }));
                }

                // Process line value help
                async function processLine() {
                    if (!selLoc) {
                        return MessageToast.show("Select a Location");
                    }
                    const entitySet = "getLineCap";
                    const filter = [
                        new Filter("LOCATION_ID", FilterOperator.EQ, selLoc)
                    ];
                    const urlParameters = { "$top": 30000, "$skip": 0 };
                    that._DialogLine.open();
                    const lineVH = that.byId("iidValueHelpLineRLP");
                    lineVH.setNoDataText("Loading...");
                    lineVH.setBusy(true);
                    let model, oResults;

                    if (!that.lineModel || !that.lineModel.length) {
                        try {
                            oResults = await that.readModel(entitySet, filter, urlParameters);
                        } catch (e) {
                            lineVH.setBusy(false);
                            lineVH.setNoDataText("No Data");
                            MessageToast.show(e.message);
                            return;
                        }
                        if (!oResults.length) {
                            lineVH.setNoDataText("NoData");
                        }
                        else {//Show only lines assigned to product
                            const rolesSet = new Set(
                                that.allData.map(item => `${item.FACTORY_LOC}|${item.REF_PRODID}`)
                            );
                            oResults = oResults.filter(el => {
                                return rolesSet.has(`${el.LOCATION_ID}|${el.PRODID}`)
                            })
                        }
                        oResults = that.removeDuplicates(oResults, ["LINE_ID"])
                            .sort(that.dynamicSort("LINE_ID"));
                        model = oResults.map(o => ({
                            title: o.LINE_ID,
                            description: o.LINE_DESC,
                            select: false
                        }));
                        that.lineModel = model;
                    } else {
                        model = that.lineModel;
                    }
                    lineVH.setBusy(false);
                    lineVH.setNoDataText("No Data");
                    lineVH.setModel(new JSONModel({ items: model }));
                }

                // Process version value help
                async function processVersion() {
                    if (!selLoc.length) {
                        return MessageToast.show("Select a Location");
                    }
                    const entitySet = "getIbpVerScn";
                    const filter = [
                        new Filter("FACTORY_LOC", FilterOperator.EQ, selLoc)
                    ];
                    that._DialogVer.open();
                    const verVH = that.byId("idValueHelpVerRLP");
                    verVH.setBusy(true);
                    verVH.setNoDataText("Loading...");
                    let model, oResults;

                    if (!that.verModel) {
                        try {
                            oResults = await that.readModel(entitySet, filter);
                        } catch (e) {
                            verVH.setBusy(false);
                            MessageToast.show(e.message);
                            return;
                        }
                        oResults = that.removeDuplicates(oResults, ["VERSION"])
                            .sort(that.dynamicSort("VERSION"));
                        if (!oResults.length) {
                            verVH.setNoDataText("NoData");
                        }
                        model = oResults.map(o => ({
                            title: o.VERSION,
                            desc: o.VERSION_NAME
                        }));
                        that.verModel = model;
                    } else {
                        model = that.verModel;
                    }
                    verVH.setBusy(false);
                    verVH.setNoDataText("NoData");
                    verVH.setModel(new JSONModel({ items: model }));
                }

                // Process scenario value help
                async function processScenario() {
                    if (!selVer) {
                        return MessageToast.show("Select a Version");
                    }
                    const entitySet = "getIbpVerScn";
                    const filter = [
                        new Filter("FACTORY_LOC", FilterOperator.EQ, selLoc),
                        new Filter("VERSION", FilterOperator.EQ, selVer)
                    ];
                    that._DialogSce.open();
                    const sceVH = that.byId("idValueHelpSceRLP");
                    sceVH.setBusy(true);
                    sceVH.setNoDataText("Loading...");
                    let model, oResults;

                    if (!that.sceModel) {
                        try {
                            oResults = await that.readModel(entitySet, filter);
                        } catch (e) {
                            sceVH.setBusy(false);
                            MessageToast.show(e.message);
                            return;
                        }
                        if (!oResults.length) {
                            sceVH.setNoDataText("NoData");
                        }
                        oResults = that.removeDuplicates(oResults, ["SCENARIO"])
                            .sort(that.dynamicSort("SCENARIO_NAME"));
                        model = oResults.map(o => ({
                            title: o.SCENARIO_NAME,
                            desc: o.SCENARIO
                        }));
                        that.sceModel = model;
                    } else {
                        model = that.sceModel;
                    }
                    sceVH.setBusy(false);
                    sceVH.setNoDataText("NoData");
                    sceVH.setModel(new JSONModel({ items: model }));
                }

                // Delegate the request based on the source control's id
                if (selectId.includes("idManLocRLP")) {
                    processFactoryLoc();
                } else if (selectId.includes("idLineRLP")) {
                    processLine();
                } else if (selectId.includes("idVerRLP")) {
                    processVersion();
                } else if (selectId.includes("idSceRLP")) {
                    processScenario();
                }
            },
            handleSelection(oEvent) {
                const selectedControl = oEvent.getSource();
                const title = selectedControl.getTitle();
                const modelData = selectedControl.getModel().getData().items;
                let selValue;

                // For "Line", build a token array from selected contexts; otherwise get the title of the selected item.
                if (title === "Line") {
                    selValue = oEvent.mParameters.selectedContexts.map(item =>
                        new Token({
                            text: item.getObject().title,
                            key: item.getObject().title
                        })
                    );
                } else {
                    selValue = oEvent.mParameters.selectedItem.getTitle();
                }

                // Helper function to clear value help models for given control IDs.
                function clearValueHelpModels(controlIds) {
                    controlIds.forEach(id => {
                        that.byId(id).setModel(new JSONModel({ items: [] }));
                    });
                }

                // Process selection based on the title.
                switch (title) {
                    case "Manufacturing Location":
                        that.locModel = modelData;
                        that.verModel = that.sceModel = that.lineModel = undefined;
                        that.byId("idManLocRLP").setValue(selValue);
                        that.byId("idLineRLP").removeAllTokens();
                        that.byId("idVerRLP").setValue("");
                        that.byId("idSceRLP").setValue("");
                        clearValueHelpModels(["iidValueHelpLineRLP", "idValueHelpVerRLP", "idValueHelpSceRLP"]);
                        that.loadLocationDependentData()
                        break;

                    case "Line":
                        that.lineModel = modelData;
                        that.byId("idLineRLP").setTokens(selValue);
                        // that.verModel = that.sceModel = undefined;
                        // that.byId("idVerRLP").setValue("");
                        // that.byId("idSceRLP").setValue("");
                        // clearValueHelpModels(["idValueHelpVerRLP", "idValueHelpSceRLP"]);
                        break;

                    case "Version":
                        that.verModel = modelData;
                        that.byId("idVerRLP").setValue(selValue);
                        that.byId("idSceRLP").setValue("");
                        clearValueHelpModels(["idValueHelpSceRLP"]);
                        that.sceModel = undefined;
                        break;

                    case "Scenario":
                        that.sceModel = modelData;
                        that.byId("idSceRLP").setValue(selValue);
                        break;

                    default:
                        break;
                }
            },
            async loadLocationDependentData() {
                // Use 'that' if 'this' is rebound, otherwise use 'this' directly.
                // Assuming 'that' is correctly referencing your controller instance.
                const that = this;
                let factoryLoc;

                try {
                    factoryLoc = that.byId("idManLocRLP").getValue();
                    const commonParams = { $top: 30000, $skip: 0 };

                    const lineFilters = [
                        new Filter("LOCATION_ID", FilterOperator.EQ, factoryLoc),
                    ];
                    const verFilters = [
                        new Filter("FACTORY_LOC", FilterOperator.EQ, factoryLoc),
                    ];

                    // Start both read operations
                    const linePromise = that.readModel("getLineCap", lineFilters, commonParams);
                    const verPromise = that.readModel("getIbpVerScn", verFilters, commonParams);

                    // Wait for both promises to resolve
                    let [readLines, readVer] = await Promise.all([linePromise, verPromise]);

                    if (readLines.length > 0) {//Show only lines assigned to product
                        const rolesSet = new Set(
                            that.allData.map(item => `${item.FACTORY_LOC}|${item.REF_PRODID}`)
                        );
                        readLines = readLines.filter(el => {
                            return rolesSet.has(`${el.LOCATION_ID}|${el.PRODID}`)
                        })
                    }
                    // --- 2. Process Lines (selectAllLine logic) ---
                    const lineResults = that
                        .removeDuplicates(readLines, ["LINE_ID"])
                        .sort(that.dynamicSort("LINE_ID"));

                    that.lineModel = lineResults.map((o) => ({
                        // Update internal model if needed
                        title: o.LINE_ID,
                        description: o.LINE_DESC,
                        select: true, // Assuming all fetched lines should be initially selected
                    }));

                    // Create tokens for the MultiInput/ComboBox
                    const lineTokens = lineResults.map(
                        (item) =>
                            new Token({
                                text: item.LINE_ID,
                                key: item.LINE_ID
                            })
                    );
                    that.byId("idLineRLP").setTokens(lineTokens); // Set all lines as selected tokens

                    // --- 3. Process Versions (selectVer logic) ---
                    let selectedVersion = null;
                    const verResults = that
                        .removeDuplicates(readVer, ["VERSION"])
                        .sort(that.dynamicSort("VERSION"));

                    that.verModel = verResults.map((o) => ({
                        // Update internal version model
                        title: o.VERSION,
                        desc: o.VERSION_NAME,
                        select: verResults.length === 1,
                    }));

                    // Auto-select version only if exactly one is returned
                    if (verResults.length === 1) {
                        selectedVersion = that.verModel[0].title;
                        that.byId("idVerRLP").setValue(selectedVersion);
                    } else {
                        that.byId("idVerRLP").setValue(""); // Clear if zero or multiple versions
                        // If version isn't unique, clear scenarios immediately as they depend on a single version
                        that.sceModel = [];
                        that.byId("idSceRLP").setValue("");
                    }

                    // --- 4. Fetch and Process Scenarios (selectSce logic - conditional) ---
                    // Only proceed if a single version was auto-selected
                    if (selectedVersion) {
                        const sceFilters = [
                            new Filter("FACTORY_LOC", FilterOperator.EQ, factoryLoc),
                            new Filter("VERSION", FilterOperator.EQ, selectedVersion),
                        ];
                        // This read happens *after* versions are processed
                        const readSce = await that.readModel(
                            "getIbpVerScn",
                            sceFilters,
                            commonParams
                        );

                        const sceResults = that
                            .removeDuplicates(readSce, ["SCENARIO"])
                            .sort(that.dynamicSort("SCENARIO"));

                        that.sceModel = sceResults.map((o) => ({
                            // Update internal scenario model
                            title: o.SCENARIO_NAME,
                            desc: o.SCENARIO,
                            select: sceResults.length === 1,
                        }));

                        // Auto-select scenario if exactly one is found for the selected version
                        if (sceResults.length === 1) {
                            that.byId("idSceRLP").setValue(that.sceModel[0].title);
                        } else {
                            // If zero or multiple scenarios, clear the selection
                            that.byId("idSceRLP").setValue("");
                        }
                    }
                    // Note: The 'else' case (where selectedVersion is null) was handled
                    // implicitly after processing versions by clearing the scenario fields.
                } catch (e) {
                    MessageToast.show(`Error loading data: ${e.message}`);
                }
            },
            onTokenUpdate(oEvent) {
                const removeLine = oEvent.mParameters.removedTokens[0].getText();
                const curLine = JSON.parse(JSON.stringify(that.lineModel));
                const findIndex = curLine.findIndex(line => line.title === removeLine);
                curLine[findIndex] = {
                    title: removeLine,
                    select: false
                }
                that.byId("iidValueHelpLineRLP").setModel(new JSONModel({ items: curLine }));
                that.byId("iidValueHelpLineRLP").getModel().refresh(true);
                that.lineModel = curLine;
            },
            handleSearch(oEvent) {
                const sValue = oEvent.getParameters().value,
                    oBinding = oEvent.getSource().getBinding("items");
                if (sValue === "") {
                    oBinding.filter([]);
                    return;
                }
                const filter = new Filter(
                    [
                        new sap.ui.model.Filter(
                            "title",
                            FilterOperator.Contains,
                            sValue
                        ),
                        new sap.ui.model.Filter(
                            "desc",
                            FilterOperator.Contains,
                            sValue
                        ),
                    ],
                    false
                );
                oBinding.filter(filter);
            },
            callFunction() {
                const [entity, urlParameters] = arguments,
                    { promise, resolve, reject } = Promise.withResolvers();
                that.oModel.callFunction(`/${entity}`, {
                    urlParameters: urlParameters,
                    success(oRes) {
                        resolve(oRes);
                    },
                    error(oError) {
                        reject(oError);
                    },
                })
                return promise;
            },
            readModel() {
                const [entity, filter = [], urlParameters = {
                    "$top": 20000
                }] = arguments;

                // Initialize variables for pagination
                let allResults = [];
                let skip = 0;
                const top = urlParameters.$top || 20000; // Use provided top or default to 20,000

                // Function to recursively fetch data
                const fetchData = async () => {
                    // Create a copy of urlParameters and update skip
                    const currentUrlParameters = { ...urlParameters, "$skip": skip };

                    try {
                        const { promise, resolve, reject } = Promise.withResolvers();
                        that.oModel.read(`/${entity}`, {
                            filters: filter,
                            urlParameters: currentUrlParameters,
                            success(oRes) {
                                resolve(oRes.results);
                            },
                            error(oError) {
                                reject(oError);
                            },
                        });
                        const results = await promise;

                        // Add results to collection
                        allResults = allResults.concat(results);

                        // Check if more data is available
                        if (results.length === top) {
                            // Update skip for next batch
                            skip += top;
                            // Recursively fetch more data
                            return await fetchData();
                        } else {
                            // All data retrieved
                            return allResults;
                        }
                    } catch (error) {
                        throw error;
                    }
                };

                // Start fetching data
                return fetchData();
            },
            onClear() {
                that.byId("idManLocRLP").setValue();
                that.byId("idVerRLP").setValue();
                that.byId("idSceRLP").setValue();
                that.byId("idDateRangeRLP").setValue();
                that.byId("idLineRLP").removeAllTokens();
                // this.getView().byId("selectWeekType").setSelectedKey("Telescopic");
                that.byId("idToggleRLP").setPressed(true);
                that.byId("idToggleRLP").setText("Telescopic View");
                // that.byId("idDateRangeRLP").setFrom(that.today);
                // that.byId("idDateRangeRLP").setTo(that.after90Day);
                const oDateL = new Date();
                const oDateH = new Date();
                oDateH.setFullYear(oDateL.getFullYear() + 2);
                that.byId("idDateRangeRLP").setFrom(oDateL);
                that.byId("idDateRangeRLP").setTo(oDateH);
                that.byId("idDateRangeRLP").setEnabled(false);
                that.locModel = that.lineModel = that.verModel = that.sceModel = that.settingData = undefined;
                that.oGModel.setProperty("/showPivot", false);

                that.byId("idValueHelpLocRLP").setModel(new JSONModel({ items: [] }));

                // that.byId("idNext").setEnabled(false);
                var existingDiv = document.querySelector(`[id*=mainDivRLP]`);
                if (existingDiv && existingDiv.children.length > 0) {
                    while (existingDiv.firstChild) {
                        existingDiv.removeChild(existingDiv.firstChild);
                    }
                }
            },
            getApplyQueryForFields(groupbyFields, measures) {
                // Build groupby clause
                let groupByClause = groupbyFields.join(",");

                // Build aggregate clause with proper lowercase operations
                let aggregateClause = measures.map(measure => {
                    return `${measure.field} with ${measure.operation} as ${measure.field}_${measure.operation.toUpperCase()}`;
                }).join(",");

                // Build base apply query
                let applyQuery = `groupby((${groupByClause}),aggregate(${aggregateClause}))`;

                return applyQuery;
            },
            buildODataFilter(urlParameters) {
                // Define which parameters should be included in the filter
                const filterParams = ['LOCATION_ID', 'VERSION', 'SCENARIO', 'MODEL_VERSION'];
                const dateParams = ['WEEK_STARTDATE', 'WEEK_ENDDATE'];

                // Build filter conditions
                const conditions = [];

                // Handle regular parameters with 'eq'
                for (const param of filterParams) {
                    if (urlParameters[param] !== undefined && urlParameters[param] !== null) {
                        conditions.push(`${param} eq '${urlParameters[param]}'`);
                    }
                }

                // Handle LINE_ID as an array with 'or' conditions
                if (urlParameters.LINE_ID !== undefined && urlParameters.LINE_ID !== null) {
                    if (Array.isArray(urlParameters.LINE_ID) && urlParameters.LINE_ID.length > 0) {
                        const lineIdConditions = urlParameters.LINE_ID.map(id => `LINE_ID eq '${id}'`);
                        // Wrap multiple LINE_ID conditions in parentheses if there are other conditions
                        if (lineIdConditions.length > 1) {
                            conditions.push(`(${lineIdConditions.join(' or ')})`);
                        } else {
                            conditions.push(lineIdConditions[0]);
                        }
                    } else if (typeof urlParameters.LINE_ID === 'string') {
                        // Handle case where LINE_ID might be a single string
                        conditions.push(`LINE_ID eq '${urlParameters.LINE_ID}'`);
                    }
                }

                // Handle date parameters with 'ge' for start date and 'le' for end date
                if (urlParameters.WEEK_STARTDATE !== undefined && urlParameters.WEEK_STARTDATE !== null) {
                    conditions.push(`WEEK_STARTDATE ge ${urlParameters.WEEK_STARTDATE}`);
                }

                if (urlParameters.WEEK_ENDDATE !== undefined && urlParameters.WEEK_ENDDATE !== null) {
                    conditions.push(`WEEK_ENDDATE le ${urlParameters.WEEK_ENDDATE}`);
                }

                // Join conditions with 'and' and wrap with filter()
                if (conditions.length > 0) {
                    return `filter(${conditions.join(' and ')})`;
                }

                return '';
            },
            onGo() {
                if (that.is_Go_Ready_To_Press_Again) {
                    // const selectedItem = this.getView().byId("selectWeekType").getSelectedKey() ? this.getView().byId("selectWeekType").getSelectedKey() : "Telescopic";
                    const bPressed = this.getView().byId("idToggleRLP").getPressed();
                    const selectedItem = bPressed ? "Telescopic View" : "Calendar View";
                    that.weekMode = selectedItem;
                    that.is_Go_Ready_To_Press_Again = false;
                    that.oResult = that.finalData = [];
                    let loc = that.byId("idManLocRLP").getValue(),
                        line = that.byId("idLineRLP").getTokens(),
                        ver = that.byId("idVerRLP").getValue(),
                        sce = that.byId("idSceRLP").getValue(),
                        date = that.byId("idDateRangeRLP").getTo();
                    if (!(loc && line.length && ver && sce && date)) {
                        that.is_Go_Ready_To_Press_Again = true;
                        return MessageToast.show("Select all the required filters");
                    }
                    that.Resource = [];
                    if (selectedItem == 'Calendar View') {
                        this.loadData('CALENDAR_WEEK');
                    } else {
                        this.loadData('TELESCOPIC_WEEK');
                    }
                }
            },
            async loadData(sField) {
                that.weekType = sField;

                if (that.weekType == 'CALENDAR_WEEK') {
                    that.weekMod = "Calendar Week";
                } else {
                    that.weekMod = "Telescopic Week";
                }
                let loc = that.byId("idManLocRLP").getValue(),
                    line = that.byId("idLineRLP").getTokens(),
                    ver = that.byId("idVerRLP").getValue(),
                    sce = that.byId("idSceRLP").getValue(),
                    from = that.byId("idDateRangeRLP").getFrom(),
                    to = that.byId("idDateRangeRLP").getTo(),
                    model = that.byId("idModelVerRLP").getSelectedKey();
                function toLocalDateString(date) {
                    const d = new Date(date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                }

                const startVal = toLocalDateString(new Date(from));
                const endVal = toLocalDateString(new Date(to));

                const foundobj = that.calWeekData.find(f =>
                    toLocalDateString(f.WEEK_STARTDATE) <= startVal &&
                    toLocalDateString(f.WEEK_ENDDATE) >= startVal
                );

                const vFromDate = toLocalDateString(foundobj.WEEK_STARTDATE);

                const urlParameters = {
                    LOCATION_ID: loc,
                    VERSION: ver,
                    LINE_ID: line.map(token => token.getText()),
                    SCENARIO: sce,
                    WEEK_STARTDATE: vFromDate,
                    WEEK_ENDDATE: endVal,
                    MODEL_VERSION: model
                };
                let groupbyFields = [
                    "LOCATION_ID",
                    "LOCATION_DESC",
                    "LINE_ID",
                    "LINE_DESC",
                    "RESTRICTION",
                    "RTR_DESC",
                    "VERSION_NAME",
                    "SCENARIO_NAME",
                    "VERSION",
                    "WEEK_STARTDATE",
                    sField
                ],
                    measures = [
                        { field: "RTR_QTY", operation: "sum" },
                        { field: "RESTRICTIONAVAIL_QTY", operation: "sum" }
                    ];

                let baseApplyQuery = that.getApplyQueryForFields(groupbyFields, measures);
                let filter = that.buildODataFilter(urlParameters);
                try {
                    const restritData = await that.readModel("getRestrLikelihood_tel", [], {
                        "$apply": `${filter}/${baseApplyQuery}`
                    });
                    that.rawData = restritData.sort((a, b) => new Date(a.WEEK_STARTDATE) - new Date(b.WEEK_STARTDATE));
                    that.calledPivot(restritData);
                    // that.saveDefaultVariant();
                } catch (error) {
                    console.error(error);
                    that.is_Go_Ready_To_Press_Again = true;
                }
            },
            calledPivot(restritData) {
                if (that.weekType === "CALENDAR_WEEK") {
                    that.pivotData = that.processData(restritData);
                    that.mondaysCW = [...new Set(that.pivotData.map(o => o[that.weekMod]))];
                }
                else {
                    that.pivotData = that.processData(restritData);
                    that.mondaysCW = [...new Set(that.pivotData.map(o => o[that.weekMod]))];
                }
                that.byId("idSliderRLP").setValue(0);
                that.loadPivotTab(that.pivotData)
                that.is_Go_Ready_To_Press_Again = true;
            },
            processData(rawData) {
                const res = [];
                that.Exceeded = [];
                that.Not_Exceeded = [];
                for (let i = 0; i < rawData.length; i++) {
                    const obj = rawData[i];
                    const Location = that.getFieldCategory("Location", obj),
                        Line = that.getFieldCategory("Line", obj),
                        Resource = that.getFieldCategory("Resource", obj),
                        Version = that.getFieldCategory("Version", obj),
                        Scenario = that.getFieldCategory("Scenario", obj);
                    const item = {
                        Location: Location,
                        Line: Line,
                        Resource: Resource,
                        Version: Version,
                        Scenario: Scenario,
                        [that.weekMod]: obj[that.weekType]
                    }
                    const forecast = { ...item, Type: "Forecast", value: obj.RTR_QTY_SUM };
                    const capacity = { ...item, Type: "Capacity", value: obj.RESTRICTIONAVAIL_QTY_SUM };
                    if (!that.Resource.includes(obj.RESTRICTION))
                        that.Resource.push(obj.RESTRICTION);
                    if (forecast.value > capacity.value) {
                        that.Exceeded.push({
                            RESTRICTION: forecast.Resource,
                            LINE_ID: forecast.Line,
                            Week: forecast[that.weekType],
                            forecast: forecast.value,
                            capacity: capacity.value
                        });
                    } else {
                        that.Not_Exceeded.push({
                            RESTRICTION: forecast.Resource,
                            LINE_ID: forecast.Line,
                            Week: forecast[that.weekType],
                            forecast: forecast.value,
                            capacity: capacity.value
                        });
                    }
                    res.push(forecast, capacity)
                }

                return res;
            },
            changeLabel: function (json) {
                const headers = [];
                const keys = Object.keys(json[0]);
                keys.forEach(key => {
                    let label;
                    switch (key) {
                        case "LOCATION_ID":
                            label = "Location";
                            break;
                        case "LOCATION_DESC":
                            label = "Location Description";
                            break;
                        case "LINE_ID":
                            label = "Line";
                            break;
                        case "LINE_DESC":
                            label = "Line Description";
                            break;
                        case "RESTRICTION":
                            label = "Resource";
                            break;
                        case "RTR_DESC":
                            label = "Resource Description";
                            break;
                        case "VERSION_NAME":
                            label = "Version Name";
                            break;
                        case "SCENARIO_NAME":
                            label = "Scenario Name";
                            break;
                        case "VERSION":
                            label = "Version";
                            break;
                        case "TELESCOPIC_WEEK":
                            label = "Telescopic Week";
                            break;
                        case "CALENDAR_WEEK":
                            label = "Calendar Week";
                            break;
                        case "RTR_QTY_SUM":
                            label = "Forecast";
                            break;
                        case "RESTRICTIONAVAIL_QTY_SUM":
                            label = "Capacity";
                            break;
                        default:
                            label = key;
                            break;
                    }
                    headers.push(label);
                });

                const data = json.map(item => Object.values(item));
                return [headers, ...data];
            },
            loadPivotTab(data) {
                that.oGModel.setProperty("/showPivot", true);
                var newDiv = document.createElement("div");
                newDiv.id = `pivotGrid`;
                newDiv.textContent = "";
                var existingDiv = document.querySelector(`[id*='mainDivRLP']`);

                existingDiv.appendChild(newDiv);
                var pivotDiv = document.querySelector(`[id*='pivotGrid']`);
                if (data.length === 0) {
                    that.oGModel.setProperty("/showPivot", false);
                    pivotDiv.innerHTML = "";
                    MessageToast.show("No Data");
                    return;
                }
                that.pivotPage.setBusy(true);
                if (window.jQuery && window.jQuery.fn.pivot) {
                    var weekMod;
                    if (that.weekType == 'CALENDAR_WEEK') {
                        weekMod = "Calendar Week";
                    } else {
                        weekMod = "Telescopic Week";
                    }
                    const rows = that.columns || ["Line", "Resource"],
                        cols = [weekMod],
                        val = ["value"];
                    const pivotData = data.filter(o => that.KeyFig.includes(o.Type));
                    pivotDiv = $(pivotDiv);
                    $(pivotDiv).pivot(pivotData, {
                        rows: [...rows, "Type"],
                        cols: cols,
                        aggregator: $.pivotUtilities.aggregators["Integer Sum"](val),
                        renderer: $.pivotUtilities.renderers["Table"],
                        sorters: {
                            "Type": () => 0,
                            [weekMod]: () => 0,
                            "Type": () => 0,
                            [weekMod]: () => 0
                        },
                        rendererOptions: {
                            table: {
                                clickCallback: function (e, value, filters, pivotData) {
                                    that.pivotClick(e, value, filters, pivotData);
                                },
                                colTotals: false,
                                rowTotals: false
                            },
                        },
                    });
                    $(pivotDiv).ready(function () {
                        // $(pivotDiv).addClass('hide-last-column hide-last-row');
                        // $(pivotDiv).find("tr:last").hide();
                        // $(pivotDiv).find('thead:first tr:first th:last-child').hide(); // Remove the last header cell
                        // $(pivotDiv).find('tbody tr').each(function () {
                        //     $(this).find('td:last-child').hide(); // Remove the last cell in each row
                        // });
                        pivotDiv.find("tbody th[rowspan]").each(function () {
                            if (parseInt($(this).attr("rowspan") || 1) > 7) {
                                $(this).css("vertical-align", "top");
                            }
                        });

                        const allWeek = $(".pvtTable").find("thead tr:first th");

                        $(allWeek).each(function (e) {
                            const cellText = $(this).text();

                            if (that.weekType === "TELESCOPIC_WEEK") {
                                if (that.telMonth.includes(cellText)) {
                                    $(this).css("background-color", "#ced4da");
                                }

                                if (that.telQ.includes(cellText)) {
                                    $(this).css("background-color", "#adb5bd");
                                }

                                if (e === allWeek.length - 1) {
                                    $(this).css("background-color", "#adb5bd");
                                }
                            }

                            $(this).addClass("weekHeader");

                            const popoverHtml = `
                                <div class="popover">
                                    <div class="popover-content">
                                        <div class="date-row">
                                            <span class="date-label">From:</span>
                                            <span class="From${cellText}"></span>
                                        </div>
                                        <div class="date-row">
                                            <span class="date-label">To:</span>
                                            <span class="To${cellText}"></span>
                                        </div>
                                    </div>
                                </div>`;

                            // Add popover to header cell
                            $(this).append(popoverHtml);

                            // On hover, update date
                            $(this).hover(function () {
                                that.updateDate(cellText);
                            });
                        });


                        freezeHeaderColumns();
                        freezeBodyColumns();
                        formatCells();
                        if (that.KeyFig.length === 2)
                            applyRedColor();

                        $("#pivotGrid table.pvtTable tbody tr th").each(function () {
                            const text = $(this).text();
                            if (that.Resource.includes(text))
                                $(this)
                                    .css("cursor", "pointer")
                                    .addClass("clickable-cell")
                            $(this)
                                .off("click")
                                .on("click", function () {
                                    if (that.Resource.includes(text)) {
                                        that.onClickRestriction(text);
                                    }
                                });
                        });

                        function freezeHeaderColumns() {
                            const firstHeadRow = $(".mainDivClass .pvtTable").find("thead tr:first");
                            if (firstHeadRow.length) {
                                let widthsHead = [0];
                                const columnsToFreeze = Math.min(2, firstHeadRow.find("th").length);

                                for (let i = 0; i < columnsToFreeze; i++) {
                                    const th = firstHeadRow.find(`th:eq(${i})`);
                                    if (th.length) {
                                        const borderWidth =
                                            parseFloat(th.css("border-left-width") || "0") +
                                            parseFloat(th.css("border-right-width") || "0");
                                        const paddingWidth =
                                            parseFloat(th.css("padding-left") || "0") +
                                            parseFloat(th.css("padding-right") || "0");
                                        const width =
                                            parseFloat(th.css("width") || "0") +
                                            borderWidth +
                                            paddingWidth;
                                        widthsHead.push(widthsHead[i] + width);
                                    }
                                }

                                firstHeadRow.find("th").each(function (index) {
                                    if (index < columnsToFreeze) {
                                        $(this).addClass("frezzThead");
                                        $(this).css("left", `${widthsHead[index]}px`);
                                    }
                                });
                            }

                            const secondHeadRow = $(".mainDivClass .pvtTable").find("thead tr:eq(1)");
                            if (secondHeadRow.length) {
                                let widthsHead2 = [0];
                                const thElements = secondHeadRow.find("th");
                                const columnsToFreeze = thElements.length;

                                for (let i = 0; i < columnsToFreeze; i++) {
                                    const th = thElements.eq(i);
                                    const borderWidth =
                                        parseFloat(th.css("border-left-width") || "0") +
                                        parseFloat(th.css("border-right-width") || "0");
                                    const paddingWidth =
                                        parseFloat(th.css("padding-left") || "0") +
                                        parseFloat(th.css("padding-right") || "0");
                                    const width =
                                        parseFloat(th.css("width") || "0") +
                                        borderWidth +
                                        paddingWidth;
                                    widthsHead2.push(widthsHead2[i] + width);
                                }

                                thElements.each(function (index) {
                                    if (index < columnsToFreeze) {
                                        $(this).addClass("frezzThead");
                                        $(this).css("left", `${widthsHead2[index]}px`);
                                    }
                                });
                            }
                        }

                        // Freeze columns in tbody
                        function freezeBodyColumns() {
                            const tbody = $(".mainDivClass .pvtTable").find("tbody");
                            if (!tbody.length) return;

                            let maxThCount = 0;
                            let referenceRow = null;

                            tbody.find("tr").each(function () {
                                const thCount = $(this).find("th").length;
                                if (thCount > maxThCount) {
                                    maxThCount = thCount;
                                    referenceRow = $(this);
                                }
                            });

                            if (!referenceRow || maxThCount === 0) return;

                            let widths = [0];
                            for (let i = 0; i < maxThCount; i++) {
                                const th = referenceRow.find(`th:eq(${i})`);
                                if (th.length) {
                                    const borderWidth =
                                        parseFloat(th.css("border-left-width") || "0") +
                                        parseFloat(th.css("border-right-width") || "0");
                                    const paddingWidth =
                                        parseFloat(th.css("padding-left") || "0") +
                                        parseFloat(th.css("padding-right") || "0");
                                    const width =
                                        parseFloat(th.css("width") || "0") +
                                        borderWidth +
                                        paddingWidth;
                                    widths.push(widths[i] + width);
                                }
                            }

                            tbody.find("tr").each(function () {
                                const thElements = $(this).find("th");
                                const currentThCount = thElements.length;

                                thElements.each(function (index) {
                                    let positionIndex = index;
                                    if (currentThCount < maxThCount) {
                                        positionIndex += maxThCount - currentThCount;
                                    }
                                    $(this).addClass("frezz");
                                    $(this).css("left", `${widths[positionIndex]}px`);
                                });
                            });
                        }

                        function applyRedColor() {
                            const $table = $(".pvtTable"),
                                highlightforecastBg = "#FFD7C4",
                                highlightcapacityBg = "#FFD7C4";

                            const $rows = $table.find("tbody tr");

                            // Iterate through rows in pairs (forecast and capacity are consecutive rows)
                            for (let i = 0; i < $rows.length - 1; i += 2) {
                                const $forecastRow = $rows.eq(i);
                                const $capacityRow = $rows.eq(i + 1);

                                // Iterate through each week column
                                for (let week = 0; week < that.mondaysCW.length; week++) {
                                    const $forecastCell = $forecastRow.find(`td.pvtVal.col${week}`);
                                    const $capacityCell = $capacityRow.find(`td.pvtVal.col${week}`);

                                    $forecastCell.css("cursor", "pointer").addClass("clickable-cell");

                                    if (!$forecastCell.length || !$capacityCell.length) continue;

                                    const forecastValue = parseFloat(
                                        $forecastCell.attr("data-value") || $forecastCell.text().replace(/,/g, "")
                                    );
                                    const capacityValue = parseFloat(
                                        $capacityCell.attr("data-value") || $capacityCell.text().replace(/,/g, "")
                                    );

                                    if (
                                        !isNaN(forecastValue) &&
                                        !isNaN(capacityValue) &&
                                        forecastValue > capacityValue
                                    ) {
                                        $forecastCell
                                            .addClass("highlighted-ac")
                                            .css("background-color", highlightforecastBg);

                                        $capacityCell
                                            .addClass("highlighted-qu")
                                            .css("background-color", highlightcapacityBg);
                                    }
                                }
                            }
                        }

                        function formatCells() {
                            $(".mainDivClass .pvtTable")
                                .find("td")
                                .each(function () {
                                    let cellText = $(this).text().trim();
                                    if (cellText === "") {
                                        $(this).text("0");
                                    }
                                });
                        }
                    });
                    that.pivotPage.setBusy(false);
                } else {
                    console.error("Pivot.js or jQuery is not loaded yet.");
                    that.pivotPage.setBusy(false);
                }
            },
            updateDate(week) {
                try {
                    const Calendar = Array.isArray(that.calWeekData)
                        ? that.calWeekData.filter(o => o && o[that.weekType] == week)
                        : [];

                    const fromElem = document.getElementsByClassName(`From${week}`)[0];
                    const toElem = document.getElementsByClassName(`To${week}`)[0];

                    if (Calendar.length === 0) {
                        $('.popover').hide()
                        return;
                    }
                    $('.popover').show()
                    const startDate = Calendar[0]?.WEEK_STARTDATE instanceof Date
                        ? Calendar[0].WEEK_STARTDATE
                        : new Date(Calendar[0]?.WEEK_STARTDATE);
                    const endDate = Calendar[Calendar.length - 1]?.WEEK_ENDDATE instanceof Date
                        ? Calendar[Calendar.length - 1].WEEK_ENDDATE
                        : new Date(Calendar[Calendar.length - 1]?.WEEK_ENDDATE);

                    const startDateStr = isNaN(startDate) ? "" : startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    const endDateStr = isNaN(endDate) ? "" : endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

                    if (fromElem) fromElem.innerHTML = startDateStr;
                    if (toElem) toElem.innerHTML = endDateStr;

                } catch (e) {
                    console.error("Error in updateDate:", e);
                }
            },
            async onClickRestriction(restriction) {

                that.pivotPage.setBusy(true);
                try {
                    const oResults = await that.readModel("getODHdrRstr", [
                        new Filter("RESTRICTION", FilterOperator.EQ, restriction),
                    ]);
                    that._restriction.open();
                    that.byId("idRestDetailsRLP").setModel(new JSONModel({
                        results: oResults
                    }));
                    that.byId("idRestItemRLP").setTitle(restriction + " " + "- Resource Details");
                    that.pivotPage.setBusy(false);

                } catch (error) {
                    that.pivotPage.setBusy(false);
                    MessageToast.show(error.message);
                }
            },
            async pivotClick(e, value, filters, pivotData) {
                if (filters.Type !== "Forecast")
                    return;
                try {
                    const oResults = await that.readModel("getPlancfgPara", [
                        new Filter("LOCATION_ID", FilterOperator.EQ, that.byId("idManLocRLP").getValue()),
                        new Filter("PARAMETER_ID", FilterOperator.EQ, "5"),
                    ]);
                    let method;
                    if (oResults && oResults.length)
                        method = oResults[0].VALUE;

                    if (method === "M1")
                        that.onMethod_M1_Click(value, filters);
                    else if (method === "M2")
                        that.onMethod_M2_Click(value, filters);
                } catch (error) {
                    console.error(error);
                }


            }, async onMethod_M1_Click(value, filters) {
                try {
                    const WeekDate = filters[that.weekMod];
                    const week = that.calWeekData.find(week => week[that.weekType] === WeekDate)?.WEEK_STARTDATE;
                    const rawdata = that.rawData.find(o =>
                        o[that.weekType] === WeekDate &&
                        o.RTR_QTY_SUM == value &&
                        o.RESTRICTION === filters.Resource
                    );
                    // const selObj = that.pivotData.find(o => o[that.weekMod] === WeekDate && o.Type === "Forecast" && o.value == value);
                    const filter = new Filter([new Filter("LOCATION_ID", FilterOperator.EQ, rawdata.LOCATION_ID),
                    new Filter("LINE_ID", FilterOperator.EQ, rawdata.LINE_ID),
                    new Filter("RESTRICTION", FilterOperator.EQ, rawdata.RESTRICTION),
                    new Filter("VERSION", FilterOperator.EQ, rawdata.VERSION),
                    new Filter("SCENARIO", FilterOperator.EQ, rawdata.SCENARIO),
                    new Filter("MODEL_VERSION", FilterOperator.EQ, that.byId("idModelVerRLP").getSelectedKey())
                    ], true);

                    const oResults = await that.readModel(entitySet, [filter], {});

                    if (oResults.length) {
                        that.CharTable.open();
                        that.byId("restrictionRuleTable").setModel(new JSONModel({
                            V_RESTRICTION_RULE: oResults
                        }))
                    }
                    that.pivotPage.setBusy(false);
                } catch (error) {
                    that.pivotPage.setBusy(false);
                    MessageToast.show(error.message);
                }
            },
            async onMethod_M2_Click(value, filters) {
                that.pivotPage.setBusy(true);
                try {
                    const WeekDate = filters[that.weekMod];
                    const prodDetails = await that.fetchProductDetails(WeekDate, value, filters);
                    if (!prodDetails || !prodDetails.length) {
                        that.pivotPage.setBusy(false);
                        return MessageToast.show("No Product Found")
                    }
                    prodDetails.forEach(obj => obj.expand = false);
                    that._forecastDetail.open();
                    that.byId("idForecastDetailsRLP").setModel(new JSONModel({
                        items: prodDetails
                    }))
                    // that.forecstDetsils = { ...selObj, date: date };
                    that.pivotPage.setBusy(false);
                } catch (error) {
                    that.pivotPage.setBusy(false);
                    MessageToast.show(error.message);
                }
            },
            async fetchProductDetails(WeekDate, value, filters) {
                let urlParameters, oRes = [];

                if (that.telWeek.includes(WeekDate) || that.weekType == "CALENDAR_WEEK") {
                    const rawdata = that.rawData.find(o =>
                        o[that.weekType] === WeekDate &&
                        o.RTR_QTY_SUM == value &&
                        o.RESTRICTION === filters.Resource
                    );
                    const selObj = that.pivotData.find(o => o[that.weekMod] === WeekDate && o.Type === "Forecast" && o.value == value),
                        urlParameters = {
                            LOCATION_ID: rawdata.LOCATION_ID,
                            LINE_ID: rawdata.LINE_ID,
                            VERSION: rawdata.VERSION,
                            SCENARIO: rawdata.SCENARIO_NAME,
                            MODEL_VERSION: that.byId("idModelVerRLP").getSelectedKey(),
                            RESTRICTION: rawdata.RESTRICTION,
                        };
                    const week = that.calWeekData.find(week => week[that.weekType] === WeekDate);
                    const monday = that.getMondaysBetween(week.WEEK_STARTDATE, week.WEEK_ENDDATE);
                    urlParameters.WEEK_DATE = monday;
                    const res = await that.callFunction("getRestrictionProdQty", urlParameters);
                    if (res.results) {
                        res.results.forEach(p => {
                            p.date = monday
                            oRes.push(p)
                        })
                    }
                    that.forecstDetsils = { ...selObj, date: monday };
                } else {
                    const rawdata = that.rawData.filter(o =>
                        o[that.weekType] === WeekDate &&
                        o.RESTRICTION === filters.Resource
                    );

                    const selObj = that.pivotData.find(o => o[that.weekMod] === WeekDate && o.Type === "Forecast");
                    that.forecstDetsils = { ...selObj };

                    const allWeek = that.calWeekData.filter(week => week[that.weekType] === WeekDate);
                    const baseParams = {
                        LOCATION_ID: rawdata[0].LOCATION_ID,
                        LINE_ID: rawdata[0].LINE_ID,
                        VERSION: rawdata[0].VERSION,
                        SCENARIO: rawdata[0].SCENARIO_NAME,
                        MODEL_VERSION: that.byId("idModelVerRLP").getSelectedKey(),
                        RESTRICTION: rawdata[0].RESTRICTION,
                    };
                    const Mondays = [];
                    const promises = allWeek.map(week => {
                        const monday = that.getMondaysBetween(week.WEEK_STARTDATE, week.WEEK_ENDDATE);
                        Mondays.push(monday);
                        const params = { ...baseParams, WEEK_DATE: monday };
                        return that.callFunction("getRestrictionProdQty", params);
                    });

                    const allResults = await Promise.all(promises);
                    allResults.forEach((res, index) => {
                        if (res.results) {
                            res.results.forEach(p => {
                                p.date = Mondays[index]
                                oRes.push(p)
                            })
                        }
                    });
                }

                return oRes;
            },
            async onExpandPanel(oEvent) {
                if (!oEvent.getSource().getBindingContext() || !(oEvent.mParameters.expand)) {
                    oEvent.getSource().getContent()[0].getItems()[0].setValue();
                    return;
                }
                try {
                    that.byId("idForecastDetailsRLP").setBusy(true);
                    const selPanel = oEvent.getSource().getBindingContext()?.getObject(),
                        urlParameters = {
                            WEEK_DATE: selPanel.date,
                            LOCATION_ID: selPanel.LOCATION_ID,
                            PRODUCT_ID: selPanel.PRODUCT_ID,
                            VERSION: that.forecstDetsils.Version,
                            SCENARIO: that.forecstDetsils.Scenario,
                            MODEL_VERSION: that.byId("idModelVerRLP").getSelectedKey(),
                            RESTRICTION: that.forecstDetsils.Resource,
                            RULE_TYPE: "RT"
                        },
                        oRes = await that.callFunction("getRestrictionUID", urlParameters),
                        getRestrictionUID = JSON.parse(oRes.getRestrictionUID),
                        panel = oEvent.getSource(),
                        table = panel.getContent()[0],
                        Uids = getRestrictionUID.map(o => {
                            return {
                                UNIQUE_ID: String(o.UNIQUE_ID),
                                CIR_QTY: String(o.CIR_QTY),
                                ASMB_QTY: String(o.ASMB_QTY),
                                TOTAL_RTR_QTY: String(o.TOTAL_RTR_QTY)
                            }
                        });
                    const w = that.forecstDetsils[that.weekMod]

                    const date = new Date(selPanel.date);

                    const urlParametersForeacst = {
                        LOCATION_ID: JSON.stringify([selPanel.LOCATION_ID]),
                        PLANNING_LOC: JSON.stringify([]),
                        UNIQUE_ID: JSON.stringify(Uids.map(o => Number(o.UNIQUE_ID))),
                        PRODUCT_ID: JSON.stringify([selPanel.PRODUCT_ID]),
                        VERSION: JSON.stringify([that.forecstDetsils.Version]),
                        SCENARIO: JSON.stringify([that.forecstDetsils.Scenario]),
                        FROMDATE: selPanel.date,
                        TODATE: new Date(date.setDate(date.getDate() + 6)).toISOString().split("T")[0],
                        MODEL_VERSION: that.byId("idModelVerRLP").getSelectedKey(),
                        weekType: that.weekType === "CALENDAR_WEEK" ? 'cal' : 'tel'
                    };
                    const forecstRes = await that.callFunction("getForecastCIRTel", urlParametersForeacst);
                    const res = JSON.parse(forecstRes.getForecastCIRTel).res;
                    if (Object.keys(JSON.parse(forecstRes.getForecastCIRTel).res).length > 0) {
                        const key = `${selPanel.LOCATION_ID}|${selPanel.PRODUCT_ID}|${that.forecstDetsils.Version}|${that.forecstDetsils.Scenario}`
                        const data = res[w][key].data;
                        Uids.forEach(item => {
                            item.ACT_QTY = data[item.UNIQUE_ID]?.ACT_QTY ?? 0;
                            item.OPEN_QTY = data[item.UNIQUE_ID]?.OPEN_QTY ?? 0;
                        })
                    }
                    that.curProd = selPanel.PRODUCT_ID;
                    table.setModel(new JSONModel({
                        items: Uids
                    }))
                    that.byId("idForecastDetailsRLP").setBusy(false);
                } catch (error) {
                    MessageToast.show(error.message);
                }
            },
            onOpenUniqueIdDialog: async function (e) {
                // Load fragment via Unique.js control
                var oFragment = await that.oUniqueControl.loadUniqueIdFragment();
                // Fetch data from backend
                sap.ui.core.BusyIndicator.show(0);
                that.oModel.callFunction("/getUniqueIdItemsNew", {
                    method: "GET",
                    urlParameters: {
                        // PRODUCT_ID: that.curProd,
                        UNIQUE_ID: Number(e.getSource().getBindingContext().getObject().UNIQUE_ID)
                    },
                    success: function (oData) {
                        try {
                            var parsedData = JSON.parse(oData.getUniqueIdItemsNew);
                            var oJSONModel = new sap.ui.model.json.JSONModel({ data: parsedData });
                            oFragment.setModel(oJSONModel, "uniqueIdModel");
                            oFragment.open();
                            sap.ui.core.BusyIndicator.hide(0);
                        } catch (err) {
                            MessageToast.show("Invalid data format returned from service");
                            sap.ui.core.BusyIndicator.hide(0);
                        }
                    },
                    error: function (oError) {
                        MessageToast.show("Failed to load Unique ID items");
                        console.error(oError);
                    }
                });
            },
            onSearch(oEvent) {
                const sValue = oEvent.getParameters().newValue,
                    table = oEvent.getSource().getParent().getItems()[1].getContent()[0],
                    oBinding = table.getBinding("items"),
                    filters = [];
                let cols = ["UNIQUE_ID", "CIR_QTY"];
                cols.forEach(col => {
                    filters.push(new Filter(col, FilterOperator.Contains, sValue))
                })
                const aFilters = [
                    new Filter({
                        filters: filters,
                        and: false
                    })
                ];
                oBinding.filter(aFilters);
            },
            onCloseDialog() {
                that.byId("idForecastDetailsRLP").setModel(new JSONModel({
                    items: []
                }))
                that._forecastDetail.close();
            },
            onCloseChar() {
                that.byId("restrictionRuleTable").setModel(new JSONModel({
                    items: []
                }))
                that.CharTable.close();
            },
            onCloseRest() {
                that._restriction.close();
            },
            onExportPivot() {
                const dataType = 'application/vnd.ms-excel',
                    tableSelect = that.byId("mainDivRLP").getDomRef().childNodes[0],
                    tableHTML = tableSelect.outerHTML.replace(/ /g, '%20'),
                    filename = `Pivot(${new Date().toLocaleString()})`,
                    downloadLink = document.createElement("a");
                document.body.appendChild(downloadLink);
                downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
                downloadLink.download = filename;
                downloadLink.click();
                document.body.removeChild(downloadLink);
            },
            onExport() {
                const dataType = 'application/vnd.ms-excel',
                    tableSelect = that.byId("idExceededTableRLP").getTableDomRef(),
                    tableHTML = tableSelect.outerHTML.replace(/ /g, '%20'),
                    filename = `Table_(${new Date().toLocaleString()})`,
                    downloadLink = document.createElement("a");
                document.body.appendChild(downloadLink);
                downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
                downloadLink.download = filename;
                downloadLink.click();
                document.body.removeChild(downloadLink);
            },
            onPressKey() {
                that.keyTable.open();
                const table = that.byId("idkeyTableRLP");
                that.table = table;
                if (!that.keySettingData) {
                    that.keySettingData = [{
                        field: "Forecast",
                        select: true
                    },
                    {
                        field: "Capacity",
                        select: true
                    }];
                    var oModel = new JSONModel({
                        data: that.keySettingData,
                    });
                    table.setModel(oModel);
                }
            },
            onAddKey: function () {
                try {
                    that.pivotPage.setBusy(true);
                    const dataTable = that.table;
                    const selectItems = dataTable.getSelectedItems();
                    const keyFig = selectItems.map((col) => {
                        return col.getBindingContext().getObject().field
                    });
                    that.KeyFig = keyFig;
                    that.loadPivotTab(that.pivotData);
                    that.keyTable.close();
                } catch (error) {
                    console.error("Error in onAddColumn:", error);
                }
            },
            onTogglePress: function (oEvent) {
                const oButton = oEvent.getSource();
                const $btn = oButton.$();
                const bPressed = oButton.getPressed();
                const newText = bPressed ? "Telescopic View" : "Calendar View";

                // A single duration for a consistent animation speed
                const animationDuration = 500; // ms

                // Set transform origin for a centered scale effect
                $btn.css("transform-origin", "50% 50%");

                // Animate out by shrinking horizontally
                $({ animValue: 1 }).animate({ animValue: 0 }, {
                    duration: animationDuration,
                    easing: "swing", // Optional: for a more natural feel
                    step: function (now) {
                        // 'now' progresses from 1 to 0
                        // Apply this progress to both scaleX and opacity
                        $btn.css({
                            transform: `scaleX(${now})`,
                            opacity: now
                        });
                    },
                    complete: function () {
                        // --- Animation Out Complete ---

                        // 1. Update the text while the button is invisible
                        oButton.setText(newText);

                        // 2. Animate in by expanding horizontally
                        $({ animValue: 0 }).animate({ animValue: 1 }, {
                            duration: animationDuration,
                            easing: "swing",
                            step: function (now) {
                                // 'now' progresses from 0 to 1
                                $btn.css({
                                    transform: `scaleX(${now})`,
                                    opacity: now
                                });
                            }
                        });
                    }
                });
                const selectedItem = bPressed ? "Telescopic View" : "Calendar View";
                const oDateL = new Date();
                const oDateH = new Date();
                if (selectedItem == "Calendar View") {
                    oDateH.setMonth(oDateL.getMonth() + 3)
                    that.byId("idDateRangeRLP").setEnabled(true);
                } else {
                    oDateH.setFullYear(oDateL.getFullYear() + 2);
                    that.byId("idDateRangeRLP").setEnabled(false);
                }
                that.byId("idDateRangeRLP").setDateValue(oDateL);
                that.byId("idDateRangeRLP").setSecondDateValue(oDateH);
                that.onGo();
            },
            onSelectColumns() {
                that._pivotSetting.open();
                const table = that.byId("idDataTableRLP"),
                    columns = ["Line", "Resource", "Location", "Version", "Scenario"];
                if (!that.settingData) {
                    that.settingData = columns.map(field => {
                        return {
                            field: field,
                            option: [{
                                "key": "ID",
                                "text": "ID"
                            },
                            {
                                "key": "Description",
                                "text": "Description"
                            },
                            {
                                "key": "ID-Description",
                                "text": "ID-Description"
                            }
                            ],
                            select: that.columns.includes(field) ? true : false
                        }
                    })
                }
                var oModel = new JSONModel({
                    data: that.settingData
                });
                table.setModel(oModel);
                that.checkSelect();
            },
            onIconPress(oEvent) {
                let item = oEvent.getSource().getParent().getParent(),
                    path = Number(item.getBindingContext().getPath().split("/")[2]),
                    icon = oEvent.getSource().getTooltip(),
                    model, oModel, newData, newIndex;
                // item.getDomRef().scrollIntoView();
                switch (icon) {
                    case ("up"):
                        newIndex = path - 1;
                        break;
                    case ("top"):
                        newIndex = 0;
                        break;
                    case ("down"):
                        newIndex = path + 1;
                        break;
                    case ("bottom"):
                        newIndex = that.settingData.length - 1;
                        break;
                    default:
                        console.log("Error")

                }
                model = oEvent.getSource().getModel().getData()
                newData = that.changeIndexPosition(model.data, path, newIndex);
                that.settingData = newData;
                oModel = new JSONModel({
                    data: that.settingData
                });
                that.byId("idDataTableRLP").setModel(oModel);
                that.checkSelect();
            },
            changeIndexPosition(arr, oldIndex, newIndex) {
                // Check for valid indices
                if (newIndex >= arr.length) {
                    let k = newIndex - arr.length + 1;
                    while (k--) {
                        arr.push(undefined); // Add undefined values for out-of-bounds
                    }
                }
                // Remove the item from the old index and store it
                const [movedItem] = arr.splice(oldIndex, 1);

                // Insert the item at the new index
                arr.splice(newIndex, 0, movedItem);
                return arr;
            },
            checkSelect() {
                const table = that.byId("idDataTableRLP");
                table.getItems()
                    .forEach((item, index) => {
                        const obj = item.getBindingContext().getObject();
                        if (obj.select)
                            item.addStyleClass("selectItem")
                        else
                            item.removeStyleClass("selectItem")
                        const icons = item.getCells()[2].getItems();
                        if (index === 0) {
                            icons[0].setVisible(false);
                            icons[2].setVisible(false);
                        } else {
                            icons[0].setVisible(true);
                            icons[2].setVisible(true);
                        }
                        if (index === that.settingData.length - 1) {
                            icons[1].setVisible(false);
                            icons[3].setVisible(false);
                        } else {
                            icons[1].setVisible(true);
                            icons[3].setVisible(true);
                        }
                    })
            },
            onAddColumn() {
                const selectItems = that.byId("idDataTableRLP").getSelectedItems();
                that.selectItems = selectItems;
                that.columns = that.byId("idDataTableRLP").getModel().getData().data.filter(o => o.select).map(o => o.field);
                // that.loadPivotTab(that.pivotData);
                that.calledPivot(that.rawData);
                that._pivotSetting.close();
            },
            onCloseColumn() {
                that._pivotSetting.close();
            },
            getFieldCategory(field, object) {
                const fieldMap = {
                    "Location": { ID: "LOCATION_ID", Description: "LOCATION_DESC" },
                    "Line": { ID: "LINE_ID", Description: "LINE_DESC" },
                    "Resource": { ID: "RESTRICTION", Description: "RTR_DESC" },
                    "Version": { ID: "VERSION", Description: "VERSION_NAME" },
                    "Scenario": { ID: "SCENARIO_NAME", Description: "SCENARIO_NAME" }
                };
                let key = "ID";
                const selectField = that.selectItems?.find(item => item.getBindingContext().getObject().field === field);
                if (selectField) {
                    key = selectField.getCells()[1].getSelectedKey();
                }

                if (key === "ID-Description") {
                    const id = fieldMap[field].ID;
                    const desc = fieldMap[field].Description;
                    return `${object[id]}-${object[desc]}`;
                }

                const keyName = fieldMap[field][key]
                return object[keyName];
            },




            onInputLiveChange: function (oEvent) {
                let oInput = oEvent.getSource();
                let oModel = this.getView().getModel();
                let value = oEvent.getParameter("value");

                if (value == "") {
                    oInput.setValue("0");
                    oEvent.mParameters.value = "0"

                }
                // Case: 0- → make -0
                if (value.endsWith("-")) {
                    value = "-" + value.replace("-", "");
                    oInput.setValue(value);
                    return;
                }
                value = oEvent.getParameter("value")

                // Allow only one minus and numbers
                let regex = /^-?\d*$/;
                if (!regex.test(value)) {
                    oInput.setValue(value.slice(0, -1));
                    return;
                }

                // Cases: "-", "-0", ""
                // if (value === "-" || value === "" || value === "-0") {
                //     oModel.setProperty("/sliderValue", 0);
                //     return;
                // }

                let num = parseInt(value);
                if (isNaN(num)) return;

                // Limit range
                if (num > 100) num = 100;
                if (num < -100) num = -100;

                oModel.setProperty("/sliderValue", num);
                oInput.setValue(num);

                this._applyPercentageChange(num);
            },

            onChangeSlider: function (oEvent) {
                const value = oEvent.getParameter("value");
                const oSlider = oEvent.getSource();

                this.getView().getModel().setProperty("/sliderValue", value);
                oEvent.getSource().setValue(value);

                //  continuously update tooltip
                // this._updateSliderTooltip(oSlider, value);

                this._applyPercentageChange(value);
            },


            _applyPercentageChange: function (value) {
                let changeData = [];

                for (let index = 0; index < this.pivotData.length; index++) {

                    const element = { ...this.pivotData[index] };

                    if (element.Type === "Capacity") {

                        let percentageIncrease = (element.value * value) / 100;
                        element.value += percentageIncrease;

                        if (element.value < 0) {
                            element.value = 0;
                        }
                    }

                    changeData.push(element);
                }

                this.loadPivotTab(changeData);
            },




            // onSliderChangeEnd: function () {
            //     if (this._oPopover) {
            //         this._oPopover.close();
            //     }
            // },



            // _updateSliderTooltip: function (oSlider, value) {
            //     setTimeout(() => {
            //         const tooltip = oSlider.$().find(".sapMSliderHandleTooltip");

            //         if (tooltip && tooltip.length) {
            //             tooltip.text(value + "%");
            //         }
            //     }, 0);
            // },


            // onChangeSlider: function (oEvent) {
            //     const value = oEvent.getParameter("value");

            //     // update model (syncs input)
            //     this.getView().getModel().setProperty("/sliderValue", value);

            //     this._applyPercentageChange(value);
            // },

            // onChangeSlider(oEvent) {
            //     const value = oEvent.mParameters.value;
            //     let changeData = [];
            //     for (let index = 0; index < that.pivotData.length; index++) {
            //         const element = { ...that.pivotData[index] };
            //         if (element.Type === "Capacity") {
            //             // element.value += value;
            //             let percentageIncrease = (element.value * value) / 100;
            //             element.value += percentageIncrease;
            //             if (element.value < 0)
            //                 element.value = 0;
            //         }
            //         changeData.push(element);
            //     }
            //     that.loadPivotTab(changeData);
            // },


            onSelectExceeded(oEvent) {
                let res,
                    sel = oEvent.mParameters.newValue;
                if (sel === 'All')
                    return;
                else if (sel === 'Exceeded')
                    res = that.Exceeded;
                else
                    res = that.Not_Exceeded
                // that._exceeded.open();
                that._table.open();
                that.byId("idExceededTableRLP").setModel(new JSONModel({
                    restrictions: res
                }));
            },
            onCloseExceeded() {
                // that._exceeded.close();
                that._table.close();
                that.byId("idExceededRLP").setSelectedKey("All")
            },
            formatUtilization: function (forecast, capacity) {
                if (!forecast || !capacity || capacity === 0) {
                    return 0;
                }
                return Math.min(forecast / capacity * 100, 100);
            },
            formatState: function (forecast, capacity) {
                if (!forecast || !capacity || capacity === 0) {
                    return "None";
                }

                var utilization = forecast / capacity;

                if (utilization > 1) {
                    return "Error";
                } else if (utilization > 0.8) {
                    return "Warning";
                } else {
                    return "Success";
                }
            },
            getMondaysBetween(startDateStr, endDateStr) {
                let startDate = new Date(startDateStr);
                const endDate = new Date(endDateStr);

                // Ensure startDate is before endDate
                if (startDate > endDate) {
                    [startDate, endDate] = [endDate, startDate];
                }

                // Loop from start to end, checking for Mondays
                while (startDate <= endDate) {
                    if (startDate.getDay() === 1) {
                        return startDate.toLocaleDateString("en-CA");
                    }
                    startDate.setDate(startDate.getDate() + 1);
                }

                return undefined;
            },
            removeDuplicates(array, keys) {
                const seen = new Set();
                const filtered = [];

                for (let i = 0; i < array.length; i++) {
                    const item = array[i];
                    const compositeKey = keys.map(key => item[key]).join('|');

                    if (!seen.has(compositeKey)) {
                        seen.add(compositeKey);
                        filtered.push(item);
                    }
                }

                return filtered;
            },
            dynamicSortMultiple() {
                const props = arguments;
                const that = this;
                return function (obj1, obj2) {
                    let i = 0,
                        result = 0,
                        numberOfProperties = props.length;
                    while (result === 0 && i < numberOfProperties) {
                        result = that.dynamicSort(props[i])(obj1, obj2);
                        i++;
                    }
                    return result;
                };
            },
            dynamicSort(property) {
                var sortOrder = 1;
                if (property[0] === "-") {
                    sortOrder = -1;
                    property = property.substr(1);
                }
                return function (a, b) {
                    var result =
                        a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
                    return result * sortOrder;
                };
            },
            getDateFn(imDate) {
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
            /*Getting variant view data*/
            getVariantData: function () {
                var ndData = [];
                var dData = [], uniqueName = [];
                that.uniqueName = [];
                sap.ui.core.BusyIndicator.show();
                var variantUser = that.getUser();
                variantUser = variantUser?.toLowerCase();
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

                //   this.getView().getModel("oModel").read("/getVariantHeader", {
                that.oModel.read("/getVariantHeader", {
                    // filters: [oFinalFilter],
                    headers: {
                        "x-user-id": variantUser,
                        "x-app-name": appName
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
                                "SCOPE": sap.m.SharingMode.Public
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            that.oGModel.setProperty("/defaultDetails", "");
                            // uniqueName = that.normalizeVariantItems(uniqueName);
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            // that.byId("idMatList123").setModel(that.viewDetails);
                            that.UniqueDefKey = uniqueName[0].VARIANTID;
                            that.byId("idMatList123").setDefaultKey(uniqueName[0].VARIANTID);
                            that.byId("idMatList123").setSelectedKey(uniqueName[0].VARIANTID);
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
                                    that.byId("idMatList123").setDefaultKey((oData.results[i].VARIANTID));
                                    that.byId("idMatList123").setSelectedKey((oData.results[i].VARIANTID))
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
                that.oModel.read("/getVariant", {
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
                        aData = aData.map(item => ({
                            ...item,
                            SCOPE: item.SCOPE === "Public" ? sap.m.SharingMode.Public : sap.m.SharingMode.Private
                        }));
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
                                "SCOPE": sap.m.SharingMode.Public
                            })
                            that.oGModel.setProperty("/viewNames", uniqueName);
                            // uniqueName = that.normalizeVariantItems(uniqueName);
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            that.oGModel.setProperty("/defaultDetails", defaultDetails);
                            // that.byId("idMatList123").setModel(that.variantModel);
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                if (newVariant[0].DEFAULT === "Y") {
                                    that.UniqueDefKey = newVariant[0].VARIANTID;
                                    that.byId("idMatList123").setDefaultKey((newVariant[0].VARIANTID));
                                }
                                that.byId("idMatList123").setSelectedKey((newVariant[0].VARIANTID))
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
                            // uniqueName = that.normalizeVariantItems(uniqueName);
                            that.viewDetails.setData({
                                items12: uniqueName
                            });
                            that.varianNames = uniqueName;
                            // that.byId("idMatList123").setModel(that.viewDetails);
                            var Default = "Standard";
                            if (that.oGModel.getProperty("/newVaraintFlag") === "X") {
                                var newVariant = that.oGModel.getProperty("/newVariant");
                                that.handleSelectPress(newVariant[0].VARIANTNAME);
                                if (newVariant[0].DEFAULT === "Y") {
                                    that.UniqueDefKey = newVariant[0].VARIANTID;
                                    that.byId("idMatList123").setDefaultKey((newVariant[0].VARIANTID));
                                }
                                that.byId("idMatList123").setSelectedKey((newVariant[0].VARIANTID))
                                that.oGModel.setProperty("/newVaraintFlag", "");
                            } else {
                                that.UniqueDefKey = uniqueName[0].VARIANTID;
                                that.byId("idMatList123").setDefaultKey((uniqueName[0].VARIANTID));
                                that.byId("idMatList123").setSelectedKey((uniqueName[0].VARIANTID));
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
            /**On Press of Variant Name */
            handleSelectPress: function (oEvent) {
                var oTokens = {}, oFilterData = {};
                that.finaloTokens = [];
                var oTableItems = that.oGModel.getProperty("/variantDetails");
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                that.byId("idMatList123").setModified(false);
                that.oGModel.setProperty("/defaultLocation", "");
                that.oGModel.setProperty("/defaultLine", []);
                that.oGModel.setProperty("/defaultVersion", "");
                that.oGModel.setProperty("/defaultScenario", "");
                that.oGModel.setProperty("/defaultModelVersion", "");


                if (that.oGModel.getProperty("/fromFunction") === "X") {
                    that.oGModel.setProperty("/fromFunction", "");
                    that.selectedApp = oEvent;
                    that.oGModel.setProperty("/variantName", that.selectedApp);
                } else {
                    that.selectedApp = oEvent.getSource().getTitle().getText();
                    that.oGModel.setProperty("/variantName", that.selectedApp);
                }
                that.byId("idManLocRLP").setValue();
                that.byId("idLineRLP").removeAllTokens();
                if (that.selectedApp !== "Standard") {
                    var filteredData = oTableItems.filter(a => a.VARIANTNAME === that.selectedApp && (a.APPLICATION_NAME === appName));
                    var locData = filteredData.filter(a => a.FIELD.includes("Manufacturing Location"));
                    var lineData = filteredData.filter(a => a.FIELD.includes("Line"));
                    var versData = filteredData.filter(a => a.FIELD === "Version");
                    var scenData = filteredData.filter(a => a.FIELD.includes("Scenario"));
                    var modelVersionData = filteredData.filter(a => a.FIELD.includes("Model Version"));
                    if (locData.length > 0) {
                        that.byId("idManLocRLP").setValue(locData[0].VALUE);
                        that.oGModel.setProperty("/defaultLocation", locData[0].VALUE);
                    }
                    if (lineData.length > 0) {
                        for (var i = 0; i < lineData.length; i++) {
                            oTokens = new sap.m.Token({
                                key: lineData[i].FIELD,
                                text: lineData[i].VALUE,
                                editable: false
                            });
                            that.finaloTokens.push(oTokens);
                            that.byId("idLineRLP").addToken(oTokens);
                            oTokens = {};
                        }
                        that.oGModel.setProperty("/defaultLine", that.finaloTokens);
                    }
                    if (versData.length > 0) {
                        that.byId("idVerRLP").setValue(versData[0].VALUE);
                        that.oGModel.setProperty("/defaultVersion", versData[0].VALUE);
                    }
                    if (scenData.length > 0) {
                        that.byId("idSceRLP").setValue(scenData[0].VALUE);
                        that.oGModel.setProperty("/defaultScenario", scenData[0].VALUE);
                    }
                    if (modelVersionData.length > 0) {
                        that.byId("idModelVerRLP").setSelectedKey(modelVersionData[0].VALUE);
                        that.oGModel.setProperty("/defaultModelVersion", modelVersionData[0].VALUE);
                    }
                    sap.ui.core.BusyIndicator.hide();
                } else {
                    // let headerDetails = that.oGModel.getProperty("/headerDetails").filter(id => id.APPLICATION_NAME == "DefaultSingle" && id.VARIANTNAME == "defaultSingle");
                    // if (headerDetails.length) {
                    //     var filteredData = that.oGModel.getProperty("/fieldDetails").filter(id => id.VARIANTID == headerDetails[0].VARIANTID);
                    //     var locData, lineData, versData, scenData, modelVersionData;
                    //     locData = filteredData.filter(a => a.FIELD.includes("Manufacturing Location"));
                    //     lineData = filteredData.filter(a => a.FIELD.includes("Line"));
                    //     versData = filteredData.filter(a => a.FIELD === "Version");
                    //     scenData = filteredData.filter(a => a.FIELD.includes("Scenario"));
                    //     modelVersionData = filteredData.filter(a => a.FIELD.includes("Model Version"));
                    //     if (locData.length > 0) {
                    //         that.byId("idManLocRLP").setValue(locData[0].VALUE);
                    //         that.oGModel.setProperty("/defaultLocation", locData[0].VALUE);
                    //     }
                    //     if (lineData.length > 0) {
                    //         for (var i = 0; i < lineData.length; i++) {
                    //             oTokens = new sap.m.Token({
                    //                 key: lineData[i].FIELD,
                    //                 text: lineData[i].VALUE,
                    //                 editable: false
                    //             });
                    //             that.finaloTokens.push(oTokens);
                    //             that.byId("idLineRLP").addToken(oTokens);
                    //             oTokens = {};
                    //         }
                    //         that.oGModel.setProperty("/defaultLine", that.finaloTokens);
                    //     }
                    //     if (versData.length > 0) {
                    //         that.byId("idVerRLP").setValue(versData[0].VALUE);
                    //         that.oGModel.setProperty("/defaultVersion", versData[0].VALUE);
                    //     }
                    //     if (scenData.length > 0) {
                    //         that.byId("idSceRLP").setValue(scenData[0].VALUE);
                    //         that.oGModel.setProperty("/defaultScenario", scenData[0].VALUE);
                    //     }
                    //     if (modelVersionData.length > 0) {
                    //         that.byId("idModelVerRLP").setSelectedKey(modelVersionData[0].VALUE);
                    //         that.oGModel.setProperty("/defaultModelVersion", modelVersionData[0].VALUE);
                    //     }

                    // } else {
                    //     //do nothing
                    //     var oResults = {};
                    //     var oCModel = that.getOwnerComponent().getModel("oModel");
                    //     oCModel.callFunction("/getGlobalPlanningConfig", {
                    //         method: "GET",
                    //         success: function (oData, oResponse) {
                    //             if (oData.getGlobalPlanningConfig) {
                    //                 oResults = JSON.parse(oData.getGlobalPlanningConfig);
                    //                 var version = oResults.IBPVERSION;
                    //                 var scenario = oResults.IBPSCENARIO;
                    //                 that.byId("idSceRLP").setValue(scenario);
                    //                 that.byId("idVerRLP").setValue(version);
                    //             }
                    //         },
                    //         error: function (oResponse) {
                    //             sap.m.MessageToast.show("Failed to get planning config, please try later!");
                    //         },
                    //     });

                    // }
                    sap.ui.core.BusyIndicator.hide();
                }
            },
            // * Saving the VIEW on press of save in NameVariant fragment
            // * @param {*} oEvent 
            // */
            onCreate: function (oEvent) {
                sap.ui.core.BusyIndicator.show();
                var array = [];
                var details = {};
                var sLocation = that.byId("idManLocRLP").getValue();
                var Field1 = that.byId("filterbarRLP").getFilterGroupItems()[0].getLabel();
                var sLine = that.byId("idLineRLP").getTokens();
                var Field2 = that.byId("filterbarRLP").getFilterGroupItems()[1].getLabel();
                var sVers = that.byId("idVerRLP").getValue();
                var Field3 = that.byId("filterbarRLP").getFilterGroupItems()[2].getLabel();
                var sScen = that.byId("idSceRLP").getValue();
                var Field4 = that.byId("filterbarRLP").getFilterGroupItems()[3].getLabel();
                var sModelVers = that.byId("idModelVerRLP").getSelectedKey();
                var Field5 = that.byId("filterbarRLP").getFilterGroupItems()[5].getLabel();

                var varName = oEvent.getParameters().name;
                var sDefault = oEvent.getParameters().def;
                var appName = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                if (!sLocation && !sLine && !sScen && !sVers) {
                    sap.ui.core.BusyIndicator.hide();
                    return sap.m.MessageToast.show("No values selected in filters Location, Line, Version & Scenario")
                }

                if (varName) {
                    if (sDefault && that.oGModel.getProperty("/defaultDetails").length > 0) {
                        var defaultChecked = "Y";
                        that.oModel.callFunction("/updateVariant", {
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
                        details = {
                            Field: Field1,
                            FieldCenter: (1).toString(), //sLocation[s].getKey(),
                            Value: sLocation,
                            Default: defaultChecked
                        }
                        array.push(details);
                    }
                    if (sLine) {
                        for (var s = 0; s < sLine.length; s++) {
                            details = {
                                Field: Field2,
                                FieldCenter: sLine[s].getKey(), //getKey(),
                                Value: sLine[s].getText(),
                                Default: defaultChecked
                            }
                            array.push(details);
                        }
                    }
                    if (sVers) {
                        details = {
                            Field: Field3,
                            FieldCenter: (1).toString(),
                            Value: sVers,
                            Default: defaultChecked
                        }
                        array.push(details);
                    }
                    if (sScen) {
                        details = {
                            Field: Field4,
                            FieldCenter: (1).toString(),
                            Value: sScen,
                            Default: defaultChecked
                        }
                        array.push(details);
                    }
                    if (sModelVers) {
                        details = {
                            Field: Field5,
                            FieldCenter: (1).toString(),
                            Value: sModelVers,
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
                    that.oModel.callFunction("/createVariant", {
                        method: "GET",
                        urlParameters: {
                            Flag: flag,
                            USER: (that.oGModel.getProperty("/UserId")),
                            VARDATA: JSON.stringify(array)
                        },
                        success: function (oData) {
                            that.oGModel.setProperty("/newVariant", oData.results);
                            that.oGModel.setProperty("/newVaraintFlag", "X");
                            that.byId("idMatList123").setModified(false);
                            that.getVariantData();
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
                    // that.byId("idMatList123").setModel(that.viewDetails);
                    that.byId("idMatList123").setDefaultKey(that.UniqueDefKey);
                    return sap.m.MessageToast.show("Variant doesn't belong to logged in user. Cannot make changes to this Variant");
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
                        var defaultVariant = totalVariantData.filter(item => item.DEFAULT === "Y" && item.USER === variantUser);
                        if (defaultVariant.length > 0) {
                            defaultVariant[0].DEFAULT = "N";
                            that.getView().getModel("oModel").callFunction("/updateVariant", {
                                method: "GET",
                                urlParameters: {
                                    VARDATA: JSON.stringify(defaultVariant)
                                },
                                success: function (oData) {
                                    var newDefault = totalVariantData.filter(item => item.VARIANTID == JSON.parse(selected.def));
                                    newDefault[0].DEFAULT = "Y";
                                    that.oModel.callFunction("/updateVariant", {
                                        method: "GET",
                                        urlParameters: {
                                            VARDATA: JSON.stringify(newDefault)
                                        },
                                        success: function (oData) {
                                            that.getVariantData();
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
                            var selectedVariant = totalVariantData.filter(item => item.VARIANTID == JSON.parse(selected.def));
                            selectedVariant[0].DEFAULT = "Y";
                            that.oModel.callFunction("/updateVariant", {
                                method: "GET",
                                urlParameters: {
                                    VARDATA: JSON.stringify(selectedVariant)
                                },
                                success: function (oData) {
                                    that.getVariantData();
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
                        that.oModel.callFunction("/updateVariant", {
                            method: "GET",
                            urlParameters: {
                                VARDATA: JSON.stringify(defaultItem)
                            },
                            success: function (oData) {
                                that.getVariantData();
                                // sap.ui.core.BusyIndicator.hide();
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                sap.m.MessageToast.show("Failed to update variant");
                            },
                        });
                    }
                } else {
                    that.getVariantData();
                }
                sap.ui.core.BusyIndicator.hide();
            },

            deleteVariant: function (oEvent) {
                var deletedItems = JSON.stringify(oEvent);
                that.oModel.callFunction("/createVariant", {
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
            saveDefaultVariant: function () {
                sap.ui.core.BusyIndicator.show();
                var array = [];
                var details = {};
                var sLocation = that.byId("idManLocRLP").getValue();
                var Field1 = that.byId("filterbarRLP").getFilterGroupItems()[0].getLabel();
                var sLine = that.byId("idLineRLP").getTokens();
                var Field2 = that.byId("filterbarRLP").getFilterGroupItems()[1].getLabel();
                var sVers = that.byId("idVerRLP").getValue();
                var Field3 = that.byId("filterbarRLP").getFilterGroupItems()[2].getLabel();
                var sScen = that.byId("idSceRLP").getValue();
                var Field4 = that.byId("filterbarRLP").getFilterGroupItems()[3].getLabel();
                var sModelVers = that.byId("idModelVerRLP").getSelectedKey();
                var Field5 = that.byId("filterbarRLP").getFilterGroupItems()[5].getLabel();
                if (!sLocation && !sLine && !sScen && !sVers) {
                    sap.ui.core.BusyIndicator.hide();
                    return
                }
                if (sLocation) {
                    details = {
                        Field: Field1,
                        FieldCenter: (1).toString(), //sLocation[s].getKey(),
                        Value: sLocation
                    }
                    array.push(details);
                }
                if (sLine) {
                    for (var s = 0; s < sLine.length; s++) {
                        details = {
                            Field: Field2,
                            FieldCenter: sLine[s].getKey(), //getKey(),
                            Value: sLine[s].getText()
                        }
                        array.push(details);
                    }
                }
                if (sVers) {
                    details = {
                        Field: Field3,
                        FieldCenter: (1).toString(),
                        Value: sVers
                    }
                    array.push(details);
                }
                if (sScen) {
                    details = {
                        Field: Field4,
                        FieldCenter: (1).toString(),
                        Value: sScen
                    }
                    array.push(details);
                }
                if (sModelVers) {
                    details = {
                        Field: Field5,
                        FieldCenter: (1).toString(),
                        Value: sModelVers
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
                that.oModel.callFunction("/createVariant", {
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
                    oStorage.put("nodeId", 89);
                    //Generate a  URL for the second application
                    var url = window.location.href.split('#')[0] + hash;
                    //Navigate to second app
                    sap.m.URLHelper.redirect(url, true);
                }
            }
        });
    });