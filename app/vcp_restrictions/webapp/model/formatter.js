sap.ui.define([], function () {
    "use strict";

    return {

        formatDate: function (sValue) {
            if (!sValue) return "";
            var oDate = new Date(sValue);
            return sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" }).format(oDate);
        }

      
    };

});