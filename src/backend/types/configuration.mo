module {
  public type OrgId = Nat;
  public type Timestamp = Int;

  public type OrgConfiguration = {
    id                  : Nat;
    orgId               : OrgId;
    currency            : Text;
    dateFormat          : Text;
    numberSeriesInvoice : Text;
    numberSeriesPO      : Text;
    numberSeriesSO      : Text;
    enableBarcoding     : Bool;
    enableBatches       : Bool;
    enableSerialization : Bool;
    enableShelfLife     : Bool;
    trackInventory      : Bool;
    invoiceTemplate     : Text;
    taxAdjustment       : Float;
    logoUrl             : Text;
    paymentGatewayType  : Text;
    paymentGatewayKey   : Text;
    updatedAt           : Timestamp;
  };

  public type UpdateOrgConfigurationInput = {
    currency            : Text;
    dateFormat          : Text;
    numberSeriesInvoice : Text;
    numberSeriesPO      : Text;
    numberSeriesSO      : Text;
    enableBarcoding     : Bool;
    enableBatches       : Bool;
    enableSerialization : Bool;
    enableShelfLife     : Bool;
    trackInventory      : Bool;
    invoiceTemplate     : Text;
    taxAdjustment       : Float;
    logoUrl             : Text;
    paymentGatewayType  : Text;
    paymentGatewayKey   : Text;
  };
};
