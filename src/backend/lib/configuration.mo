import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/configuration";
import AuthOrgTypes "../types/auth-org";

module {
  public type OrgId     = Types.OrgId;
  public type RoleChecker = (caller : Principal, orgId : OrgId) -> ?AuthOrgTypes.OrgRole;

  // ── Opaque state types ─────────────────────────────────────────────────────
  public type ConfigMap = Map.Map<OrgId, Types.OrgConfiguration>;
  public type NextIdRef = { var value : Nat };

  func defaultConfig(id : Nat, orgId : OrgId, now : Int) : Types.OrgConfiguration {
    {
      id;
      orgId;
      currency            = "INR";
      dateFormat          = "DD/MM/YYYY";
      numberSeriesInvoice = "INV-";
      numberSeriesPO      = "PO-";
      numberSeriesSO      = "SO-";
      enableBarcoding     = false;
      enableBatches       = false;
      enableSerialization = false;
      enableShelfLife     = false;
      trackInventory      = true;
      invoiceTemplate     = "default";
      taxAdjustment       = 0.0;
      logoUrl             = "";
      paymentGatewayType  = "";
      paymentGatewayKey   = "";
      updatedAt           = now;
    }
  };

  public func getOrCreate(
    configs : ConfigMap,
    nextId  : NextIdRef,
    orgId   : OrgId,
  ) : Types.OrgConfiguration {
    switch (configs.get(orgId)) {
      case (?c) c;
      case null {
        let id = nextId.value;
        nextId.value += 1;
        let now = Time.now();
        let cfg = defaultConfig(id, orgId, now);
        configs.add(orgId, cfg);
        cfg
      };
    }
  };

  public func update(
    configs : ConfigMap,
    nextId  : NextIdRef,
    orgId   : OrgId,
    input   : Types.UpdateOrgConfigurationInput,
  ) : Types.OrgConfiguration {
    let existing = getOrCreate(configs, nextId, orgId);
    let now = Time.now();
    let updated : Types.OrgConfiguration = {
      existing with
      currency            = input.currency;
      dateFormat          = input.dateFormat;
      numberSeriesInvoice = input.numberSeriesInvoice;
      numberSeriesPO      = input.numberSeriesPO;
      numberSeriesSO      = input.numberSeriesSO;
      enableBarcoding     = input.enableBarcoding;
      enableBatches       = input.enableBatches;
      enableSerialization = input.enableSerialization;
      enableShelfLife     = input.enableShelfLife;
      trackInventory      = input.trackInventory;
      invoiceTemplate     = input.invoiceTemplate;
      taxAdjustment       = input.taxAdjustment;
      logoUrl             = input.logoUrl;
      paymentGatewayType  = input.paymentGatewayType;
      paymentGatewayKey   = input.paymentGatewayKey;
      updatedAt           = now;
    };
    configs.add(orgId, updated);
    updated
  };
};
