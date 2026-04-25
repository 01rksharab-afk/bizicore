module {
  public type OrgId = Nat;
  public type Timestamp = Int;

  public type TargetMetric = { #Revenue; #Units; #NewCustomers };
  public type RewardType = { #Percentage; #FixedAmount };
  public type SchemeStatus = { #Active; #Inactive };

  public type IncentiveScheme = {
    id            : Nat;
    orgId         : OrgId;
    schemeName    : Text;
    category      : Text;
    targetMetric  : TargetMetric;
    targetValue   : Float;
    rewardType    : RewardType;
    rewardValue   : Float;
    effectiveFrom : Timestamp;
    effectiveTo   : ?Timestamp;
    status        : SchemeStatus;
    createdAt     : Timestamp;
  };

  public type CreateIncentiveSchemeInput = {
    schemeName    : Text;
    category      : Text;
    targetMetric  : TargetMetric;
    targetValue   : Float;
    rewardType    : RewardType;
    rewardValue   : Float;
    effectiveFrom : Timestamp;
    effectiveTo   : ?Timestamp;
  };

  public type UpdateIncentiveSchemeInput = {
    id            : Nat;
    schemeName    : Text;
    category      : Text;
    targetMetric  : TargetMetric;
    targetValue   : Float;
    rewardType    : RewardType;
    rewardValue   : Float;
    effectiveFrom : Timestamp;
    effectiveTo   : ?Timestamp;
    status        : SchemeStatus;
  };
};
